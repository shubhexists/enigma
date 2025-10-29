use std::fmt::Debug;
use x402_rs::network::USDCDeployment;
use x402_rs::types::{EvmAddress, MixedAddress, TokenDeployment};
use x402_rs::types::{MoneyAmount, TokenAmount};

#[derive(Clone, Debug, Eq, Hash, PartialEq)]
pub struct PriceTag {
    pub pay_to: MixedAddress,
    pub amount: TokenAmount,
    pub token: TokenDeployment,
}

impl PriceTag {
    pub fn new<P: Into<MixedAddress>, T: Into<TokenAmount>, A: Into<TokenDeployment>>(
        pay_to: P,
        amount: T,
        token: A,
    ) -> Self {
        Self {
            pay_to: pay_to.into(),
            amount: amount.into(),
            token: token.into(),
        }
    }
}

impl From<PriceTag> for Vec<PriceTag> {
    fn from(value: PriceTag) -> Self {
        vec![value]
    }
}

#[derive(Clone, Debug)]
pub struct PriceTagBuilder<A, P> {
    token: TokenDeployment,
    amount: Option<A>,
    pay_to: Option<P>,
}

#[derive(Clone, Debug)]
pub struct PriceTagMoneyAmount<A>(A);

#[derive(Clone, Debug)]
pub struct PriceTagTokenAmount<A>(A);

impl<A> TryInto<TokenAmount> for PriceTagTokenAmount<A>
where
    A: TryInto<TokenAmount>,
{
    type Error = A::Error;

    fn try_into(self) -> Result<TokenAmount, Self::Error> {
        self.0.try_into()
    }
}

impl<A> TryInto<MoneyAmount> for PriceTagMoneyAmount<A>
where
    A: TryInto<MoneyAmount>,
{
    type Error = A::Error;
    fn try_into(self) -> Result<MoneyAmount, Self::Error> {
        self.0.try_into()
    }
}

pub trait IntoPriceTag {
    fn token_amount<A: TryInto<TokenAmount>>(
        &self,
        token_amount: A,
    ) -> PriceTagBuilder<PriceTagTokenAmount<A>, ()>;
    fn amount<A: TryInto<MoneyAmount>>(
        &self,
        amount: A,
    ) -> PriceTagBuilder<PriceTagMoneyAmount<A>, ()>;
    fn pay_to<P: Into<MixedAddress>>(&self, address: P) -> PriceTagBuilder<(), P>;
}

#[derive(Clone, Debug, thiserror::Error)]
pub enum PriceTagBuilderError {
    #[error("No amount provided")]
    NoAmount,
    #[error("Invalid amount value")]
    InvalidAmount,
    #[error("No pay_to address provided")]
    NoPayTo,
    #[error("Invalid pay_to address")]
    InvalidPayTo,
}

impl<A, P> PriceTagBuilder<PriceTagTokenAmount<A>, P>
where
    A: TryInto<TokenAmount>,
    P: Into<MixedAddress>,
{
    #[allow(dead_code)]
    pub fn build(self) -> Result<PriceTag, PriceTagBuilderError> {
        let token = self.token;
        let amount = self.amount.ok_or(PriceTagBuilderError::NoAmount)?;
        let amount = amount
            .try_into()
            .ok()
            .ok_or(PriceTagBuilderError::InvalidAmount)?;
        let pay_to = self.pay_to.ok_or(PriceTagBuilderError::NoPayTo)?;
        let pay_to = pay_to.into();
        let price_tag = PriceTag {
            token,
            amount,
            pay_to,
        };
        Ok(price_tag)
    }

    #[allow(dead_code)]
    pub fn unwrap(self) -> PriceTag {
        self.build().unwrap()
    }
}

impl<A, P> PriceTagBuilder<PriceTagMoneyAmount<A>, P>
where
    A: TryInto<MoneyAmount>,
    P: Into<MixedAddress>,
{
    pub fn build(self) -> Result<PriceTag, PriceTagBuilderError> {
        let token = self.token;
        let amount = self.amount.ok_or(PriceTagBuilderError::NoAmount)?;
        let money_amount: MoneyAmount = amount
            .try_into()
            .ok()
            .ok_or(PriceTagBuilderError::InvalidAmount)?;
        let amount = money_amount
            .as_token_amount(token.decimals as u32)
            .ok()
            .ok_or(PriceTagBuilderError::InvalidAmount)?;
        let pay_to = self.pay_to.ok_or(PriceTagBuilderError::NoPayTo)?;
        let pay_to = pay_to.into();
        let price_tag = PriceTag {
            token,
            amount,
            pay_to,
        };
        Ok(price_tag)
    }

    pub fn unwrap(self) -> PriceTag {
        self.build().unwrap()
    }
}

impl<A, P> PriceTagBuilder<A, P>
where
    A: Clone,
{
    #[allow(dead_code)]
    pub fn pay_to<P1: TryInto<EvmAddress>>(&self, address: P1) -> PriceTagBuilder<A, P1> {
        PriceTagBuilder {
            token: self.token.clone(),
            amount: self.amount.clone(),
            pay_to: Some(address),
        }
    }
}

impl<A, P> PriceTagBuilder<A, P>
where
    P: Clone,
{
    pub fn amount<A1: TryInto<MoneyAmount>>(
        &self,
        amount: A1,
    ) -> PriceTagBuilder<PriceTagMoneyAmount<A1>, P> {
        PriceTagBuilder {
            token: self.token.clone(),
            amount: Some(PriceTagMoneyAmount(amount)),
            pay_to: self.pay_to.clone(),
        }
    }

    #[allow(dead_code)]
    pub fn token_amount<A1: TryInto<TokenAmount>>(
        &self,
        token_amount: A1,
    ) -> PriceTagBuilder<PriceTagTokenAmount<A1>, P> {
        PriceTagBuilder {
            token: self.token.clone(),
            amount: Some(PriceTagTokenAmount(token_amount)),
            pay_to: self.pay_to.clone(),
        }
    }
}

impl IntoPriceTag for TokenDeployment {
    fn token_amount<A: TryInto<TokenAmount>>(
        &self,
        token_amount: A,
    ) -> PriceTagBuilder<PriceTagTokenAmount<A>, ()> {
        let token = self.clone();
        PriceTagBuilder {
            token,
            amount: Some(PriceTagTokenAmount(token_amount)),
            pay_to: None,
        }
    }

    fn amount<A: TryInto<MoneyAmount>>(
        &self,
        amount: A,
    ) -> PriceTagBuilder<PriceTagMoneyAmount<A>, ()> {
        let token = self.clone();
        PriceTagBuilder {
            token,
            amount: Some(PriceTagMoneyAmount(amount)),
            pay_to: None,
        }
    }

    fn pay_to<P: Into<MixedAddress>>(&self, address: P) -> PriceTagBuilder<(), P> {
        let token = self.clone();
        PriceTagBuilder {
            token,
            amount: None,
            pay_to: Some(address),
        }
    }
}

impl IntoPriceTag for USDCDeployment {
    fn token_amount<A: TryInto<TokenAmount>>(
        &self,
        token_amount: A,
    ) -> PriceTagBuilder<PriceTagTokenAmount<A>, ()> {
        self.0.token_amount(token_amount)
    }

    fn amount<A: TryInto<MoneyAmount>>(
        &self,
        amount: A,
    ) -> PriceTagBuilder<PriceTagMoneyAmount<A>, ()> {
        self.0.amount(amount)
    }

    fn pay_to<P: Into<MixedAddress>>(&self, address: P) -> PriceTagBuilder<(), P> {
        self.0.pay_to(address)
    }
}
