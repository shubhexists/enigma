use crate::facilitator_client::{FacilitatorClient, FacilitatorClientError};
use crate::price::PriceTag;
use axum::Json;
use axum_core::body::Body;
use axum_core::{
    extract::Request,
    response::{IntoResponse, Response},
};
use database::ApiRepository;
use http::{HeaderMap, HeaderValue, StatusCode, Uri};
use once_cell::sync::Lazy;
use serde_json::json;
use solana_sdk::pubkey::Pubkey;
use std::collections::HashSet;
use std::fmt::{Debug, Display};
use std::str::FromStr;
use std::sync::Arc;
use std::{
    convert::Infallible,
    future::Future,
    pin::Pin,
    task::{Context, Poll},
};
use tower::util::BoxCloneSyncService;
use tower::{Layer, Service};
use url::Url;
use uuid::Uuid;
use x402_rs::facilitator::Facilitator;
use x402_rs::network::Network;
use x402_rs::types::{
    Base64Bytes, FacilitatorErrorReason, MixedAddress, PaymentPayload, PaymentRequiredResponse,
    PaymentRequirements, Scheme, SettleRequest, SettleResponse, TokenAmount, VerifyRequest,
    VerifyResponse, X402Version,
};

#[derive(Clone, Debug)]
pub struct X402Middleware<F> {
    facilitator: Arc<F>,
    description: Option<String>,
    mime_type: Option<String>,
    resource: Option<Url>,
    base_url: Option<Url>,
    price_tag: Vec<PriceTag>,
    max_timeout_seconds: u64,
    payment_offers: Arc<PaymentOffers>,
    api_id: Option<String>,
    api_repo: Option<ApiRepository>,
}

impl TryFrom<&str> for X402Middleware<FacilitatorClient> {
    type Error = FacilitatorClientError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        let facilitator = FacilitatorClient::try_from(value)?;
        Ok(X402Middleware::new(facilitator))
    }
}

impl TryFrom<String> for X402Middleware<FacilitatorClient> {
    type Error = FacilitatorClientError;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        X402Middleware::try_from(value.as_str())
    }
}

impl<F> X402Middleware<F>
where
    F: Clone,
{
    pub fn new(facilitator: F) -> Self {
        Self {
            facilitator: Arc::new(facilitator),
            description: None,
            mime_type: None,
            resource: None,
            base_url: None,
            max_timeout_seconds: 300,
            price_tag: Vec::new(),
            payment_offers: Arc::new(PaymentOffers::Ready(Arc::new(Vec::new()))),
            api_id: None,
            api_repo: None,
        }
    }

    pub fn facilitator_url(&self) -> Url {
        self.base_url()
    }

    pub fn base_url(&self) -> Url {
        self.base_url
            .clone()
            .unwrap_or(Url::parse("http://localhost/").unwrap())
    }

    pub fn with_description(&self, description: &str) -> Self {
        let mut this = self.clone();
        this.description = Some(description.to_string());
        this.recompute_offers()
    }

    pub fn with_mime_type(&self, mime: &str) -> Self {
        let mut this = self.clone();
        this.mime_type = Some(mime.to_string());
        this.recompute_offers()
    }

    #[allow(dead_code)]
    pub fn with_resource(&self, resource: Url) -> Self {
        let mut this = self.clone();
        this.resource = Some(resource);
        this.recompute_offers()
    }

    #[allow(dead_code)]
    pub fn with_base_url(&self, base_url: Url) -> Self {
        let mut this = self.clone();
        this.base_url = Some(base_url);
        this.recompute_offers()
    }

    #[allow(dead_code)]
    pub fn with_max_timeout_seconds(&self, seconds: u64) -> Self {
        let mut this = self.clone();
        this.max_timeout_seconds = seconds;
        this.recompute_offers()
    }

    #[allow(dead_code)]
    pub fn with_price_tag<T: Into<Vec<PriceTag>>>(&self, price_tag: T) -> Self {
        let mut this = self.clone();
        this.price_tag = price_tag.into();
        this.recompute_offers()
    }

    #[allow(dead_code)]
    pub fn or_price_tag<T: Into<Vec<PriceTag>>>(&self, price_tag: T) -> Self {
        let mut this = self.clone();
        let mut seen: HashSet<PriceTag> = this.price_tag.iter().cloned().collect();
        for tag in price_tag.into() {
            if seen.insert(tag.clone()) {
                this.price_tag.push(tag);
            }
        }
        this.recompute_offers()
    }

    pub fn with_api_id(&self, api_id: String) -> Self {
        let mut this = self.clone();
        this.api_id = Some(api_id);
        this
    }

    pub fn with_api_repo(&self, api_repo: ApiRepository) -> Self {
        let mut this = self.clone();
        this.api_repo = Some(api_repo);
        this
    }

    fn recompute_offers(mut self) -> Self {
        let base_url = self.base_url();
        let description = self.description.clone().unwrap_or_default();
        let mime_type = self
            .mime_type
            .clone()
            .unwrap_or("application/json".to_string());
        let max_timeout_seconds = self.max_timeout_seconds;
        let payment_offers = if let Some(resource) = self.resource.clone() {
            let payment_requirements = self
                .price_tag
                .iter()
                .map(|price_tag| {
                    let extra = if let Some(eip712) = price_tag.token.eip712.clone() {
                        Some(json!({
                            "name": eip712.name,
                            "version": eip712.version
                        }))
                    } else {
                        None
                    };
                    PaymentRequirements {
                        scheme: Scheme::Exact,
                        network: price_tag.token.network(),
                        max_amount_required: price_tag.amount,
                        resource: resource.clone(),
                        description: description.clone(),
                        mime_type: mime_type.clone(),
                        pay_to: price_tag.pay_to.clone(),
                        max_timeout_seconds,
                        asset: price_tag.token.address(),
                        extra,
                        output_schema: None,
                    }
                })
                .collect::<Vec<_>>();
            PaymentOffers::Ready(Arc::new(payment_requirements))
        } else {
            let no_resource = self
                .price_tag
                .iter()
                .map(|price_tag| {
                    let extra = if let Some(eip712) = price_tag.token.eip712.clone() {
                        Some(json!({
                            "name": eip712.name,
                            "version": eip712.version
                        }))
                    } else {
                        None
                    };
                    PaymentRequirementsNoResource {
                        scheme: Scheme::Exact,
                        network: price_tag.token.network(),
                        max_amount_required: price_tag.amount,
                        description: description.clone(),
                        mime_type: mime_type.clone(),
                        pay_to: price_tag.pay_to.clone(),
                        max_timeout_seconds,
                        asset: price_tag.token.address(),
                        extra,
                        output_schema: None,
                    }
                })
                .collect::<Vec<_>>();
            PaymentOffers::NoResource {
                partial: no_resource,
                base_url,
            }
        };
        self.payment_offers = Arc::new(payment_offers);
        self
    }
}

#[derive(Clone, Debug)]
pub struct X402MiddlewareService<F> {
    facilitator: Arc<F>,
    payment_offers: Arc<PaymentOffers>,
    inner: BoxCloneSyncService<Request, Response, Infallible>,
    api_id: Option<String>,
    api_repo: Option<ApiRepository>,
}

impl<S, F> Layer<S> for X402Middleware<F>
where
    S: Service<Request, Response = Response, Error = Infallible> + Clone + Send + Sync + 'static,
    S::Future: Send + 'static,
    F: Facilitator + Clone,
{
    type Service = X402MiddlewareService<F>;

    fn layer(&self, inner: S) -> Self::Service {
        if self.base_url.is_none() && self.resource.is_none() {}
        X402MiddlewareService {
            facilitator: self.facilitator.clone(),
            payment_offers: self.payment_offers.clone(),
            inner: BoxCloneSyncService::new(inner),
            api_id: self.api_id.clone(),
            api_repo: self.api_repo.clone(),
        }
    }
}

impl<F> Service<Request> for X402MiddlewareService<F>
where
    F: Facilitator + Clone + Send + Sync + 'static,
{
    type Response = Response;
    type Error = Infallible;
    type Future = Pin<Box<dyn Future<Output = Result<Response, Infallible>> + Send>>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, req: Request) -> Self::Future {
        let payment_requirements =
            gather_payment_requirements(self.payment_offers.as_ref(), req.uri());
        let gate = X402Paygate {
            facilitator: self.facilitator.clone(),
            payment_requirements,
            api_id: self.api_id.clone(),
            api_repo: self.api_repo.clone(),
        };
        let inner = self.inner.clone();
        Box::pin(gate.call(inner, req))
    }
}

#[derive(Debug)]
pub struct X402Error(PaymentRequiredResponse);

impl Display for X402Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "402 Payment Required: {}", self.0)
    }
}

static ERR_PAYMENT_HEADER_REQUIRED: Lazy<String> =
    Lazy::new(|| "X-PAYMENT header is required".to_string());
static ERR_INVALID_PAYMENT_HEADER: Lazy<String> =
    Lazy::new(|| "Invalid or malformed payment header".to_string());
static ERR_NO_PAYMENT_MATCHING: Lazy<String> =
    Lazy::new(|| "Unable to find matching payment requirements".to_string());

impl X402Error {
    pub fn payment_header_required(payment_requirements: Vec<PaymentRequirements>) -> Self {
        let payment_required_response = PaymentRequiredResponse {
            error: ERR_PAYMENT_HEADER_REQUIRED.clone(),
            accepts: payment_requirements,
            x402_version: X402Version::V1,
        };
        Self(payment_required_response)
    }

    pub fn invalid_payment_header(payment_requirements: Vec<PaymentRequirements>) -> Self {
        let payment_required_response = PaymentRequiredResponse {
            error: ERR_INVALID_PAYMENT_HEADER.clone(),
            accepts: payment_requirements,
            x402_version: X402Version::V1,
        };
        Self(payment_required_response)
    }

    pub fn no_payment_matching(payment_requirements: Vec<PaymentRequirements>) -> Self {
        let payment_required_response = PaymentRequiredResponse {
            error: ERR_NO_PAYMENT_MATCHING.clone(),
            accepts: payment_requirements,
            x402_version: X402Version::V1,
        };
        Self(payment_required_response)
    }

    pub fn verification_failed<E2: Display>(
        error: E2,
        payment_requirements: Vec<PaymentRequirements>,
    ) -> Self {
        let payment_required_response = PaymentRequiredResponse {
            error: format!("Verification Failed: {error}"),
            accepts: payment_requirements,
            x402_version: X402Version::V1,
        };
        Self(payment_required_response)
    }

    pub fn settlement_failed<E2: Display>(
        error: E2,
        payment_requirements: Vec<PaymentRequirements>,
    ) -> Self {
        let payment_required_response = PaymentRequiredResponse {
            error: format!("Settlement Failed: {error}"),
            accepts: payment_requirements,
            x402_version: X402Version::V1,
        };
        Self(payment_required_response)
    }
}

impl IntoResponse for X402Error {
    fn into_response(self) -> Response {
        let payment_required_response_bytes =
            serde_json::to_vec(&self.0).expect("serialization failed");
        let body = Body::from(payment_required_response_bytes);
        Response::builder()
            .status(StatusCode::PAYMENT_REQUIRED)
            .header("Content-Type", "application/json")
            .body(body)
            .expect("Fail to construct response")
    }
}

pub struct X402Paygate<F> {
    pub facilitator: Arc<F>,
    pub payment_requirements: Arc<Vec<PaymentRequirements>>,
    pub api_id: Option<String>,
    pub api_repo: Option<ApiRepository>,
}

impl<F> X402Paygate<F>
where
    F: Facilitator + Clone + Send + Sync,
{
    pub async fn extract_payment_payload(
        &self,
        headers: &HeaderMap,
    ) -> Result<PaymentPayload, X402Error> {
        let payment_header = headers.get("X-Payment");
        let supported = self.facilitator.supported().await.map_err(|e| {
            X402Error(PaymentRequiredResponse {
                x402_version: X402Version::V1,
                error: format!("Unable to retrieve supported payment schemes: {e}"),
                accepts: vec![],
            })
        })?;
        match payment_header {
            None => {
                let requirements = self
                    .payment_requirements
                    .as_ref()
                    .iter()
                    .map(|r| {
                        let mut r = r.clone();
                        let network = r.network;
                        let extra = supported
                            .kinds
                            .iter()
                            .find(|s| s.network == network)
                            .cloned()
                            .and_then(|s| s.extra);
                        if let Some(extra) = extra {
                            r.extra = Some(json!({
                                "feePayer": extra.fee_payer
                            }));
                            r
                        } else {
                            r
                        }
                    })
                    .collect::<Vec<_>>();
                Err(X402Error::payment_header_required(requirements))
            }
            Some(payment_header) => {
                let base64 = Base64Bytes::from(payment_header.as_bytes());
                let payment_payload = PaymentPayload::try_from(base64);
                match payment_payload {
                    Ok(payment_payload) => Ok(payment_payload),
                    Err(_) => Err(X402Error::invalid_payment_header(
                        self.payment_requirements.as_ref().clone(),
                    )),
                }
            }
        }
    }

    fn find_matching_payment_requirements(
        &self,
        payment_payload: &PaymentPayload,
    ) -> Option<PaymentRequirements> {
        self.payment_requirements
            .iter()
            .find(|requirement| {
                requirement.scheme == payment_payload.scheme
                    && requirement.network == payment_payload.network
            })
            .cloned()
    }

    #[cfg_attr(
        feature = "telemetry",
        instrument(name = "x402.verify_payment", skip_all, err)
    )]
    pub async fn verify_payment(
        &self,
        payment_payload: PaymentPayload,
    ) -> Result<VerifyRequest, X402Error> {
        let selected = self
            .find_matching_payment_requirements(&payment_payload)
            .ok_or(X402Error::no_payment_matching(
                self.payment_requirements.as_ref().clone(),
            ))?;
        let verify_request = VerifyRequest {
            x402_version: payment_payload.x402_version,
            payment_payload,
            payment_requirements: selected,
        };
        let verify_response = self
            .facilitator
            .verify(&verify_request)
            .await
            .map_err(|e| {
                X402Error::verification_failed(e, self.payment_requirements.as_ref().clone())
            })?;
        match verify_response {
            VerifyResponse::Valid { .. } => Ok(verify_request),
            VerifyResponse::Invalid { reason, .. } => Err(X402Error::verification_failed(
                reason,
                self.payment_requirements.as_ref().clone(),
            )),
        }
    }

    #[cfg_attr(
        feature = "telemetry",
        instrument(name = "x402.settle_payment", skip_all, err)
    )]
    pub async fn settle_payment(
        &self,
        settle_request: &SettleRequest,
    ) -> Result<SettleResponse, X402Error> {
        let settlement = self.facilitator.settle(settle_request).await.map_err(|e| {
            X402Error::settlement_failed(e, self.payment_requirements.as_ref().clone())
        })?;
        if settlement.success {
            Ok(settlement)
        } else {
            let error_reason = settlement
                .error_reason
                .unwrap_or(FacilitatorErrorReason::InvalidScheme);
            Err(X402Error::settlement_failed(
                error_reason,
                self.payment_requirements.as_ref().clone(),
            ))
        }
    }

    pub async fn call<
        ReqBody,
        ResBody,
        S: Service<http::Request<ReqBody>, Response = http::Response<ResBody>>,
    >(
        self,
        inner: S,
        req: http::Request<ReqBody>,
    ) -> Result<Response, Infallible>
    where
        S::Response: IntoResponse,
        S::Error: IntoResponse,
    {
        Ok(self.handle_request(inner, req).await)
    }

    #[cfg_attr(
        feature = "telemetry",
        instrument(name = "x402.handle_request", skip_all)
    )]
    pub async fn handle_request<
        ReqBody,
        ResBody,
        S: Service<http::Request<ReqBody>, Response = http::Response<ResBody>>,
    >(
        mut self,
        mut inner: S,
        req: http::Request<ReqBody>,
    ) -> Response
    where
        S::Response: IntoResponse,
        S::Error: IntoResponse,
    {
        let api_id = req.extensions().get::<String>().cloned();
        if let Some(api_id) = api_id {
            let response = match self
                .api_repo
                .clone()
                .unwrap()
                .get_api_by_id(Uuid::from_str(&api_id).unwrap())
                .await
            {
                Ok(Some(api)) => Ok(Json(api)),
                Ok(None) => Err(StatusCode::NOT_FOUND),
                Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
            }
            .unwrap();
            let pay_to = response
                .0
                .payment_config
                .as_ref()
                .map(|c| c.sol_public_key.clone())
                .unwrap_or_else(|| "8hAVK73RZdtyP2kE82ohAsAGgKaxffS6pU7B9bxRg2RL".to_string());
            let amount = TokenAmount::from(
                response
                    .0
                    .payment_config
                    .as_ref()
                    .map(|c| (c.cost_per_request * 1_000_000.0) as u64)
                    .unwrap_or(50000u64),
            );

            let updated_requirements = self
                .payment_requirements
                .iter()
                .map(|req| {
                    let mut updated = req.clone();
                    updated.pay_to = MixedAddress::Solana(Pubkey::from_str(&pay_to).unwrap());
                    updated.max_amount_required = amount;
                    updated
                })
                .collect::<Vec<_>>();

            self.payment_requirements = Arc::new(updated_requirements);
        }

        let payment_payload = match self.extract_payment_payload(req.headers()).await {
            Ok(payment_payload) => payment_payload,
            Err(err) => {
                return err.into_response();
            }
        };
        let verify_request = match self.verify_payment(payment_payload).await {
            Ok(verify_request) => verify_request,
            Err(err) => return err.into_response(),
        };
        let inner_fut = {
            #[cfg(not(feature = "telemetry"))]
            {
                inner.call(req)
            }
        };
        let response = match inner_fut.await {
            Ok(response) => response,
            Err(err) => return err.into_response(),
        };
        if response.status().is_client_error() || response.status().is_server_error() {
            return response.into_response();
        }
        let settlement = match self.settle_payment(&verify_request).await {
            Ok(settlement) => settlement,
            Err(err) => return err.into_response(),
        };
        let payment_header: Base64Bytes = match settlement.try_into() {
            Ok(payment_header) => payment_header,
            Err(err) => {
                return X402Error::settlement_failed(
                    err,
                    self.payment_requirements.as_ref().clone(),
                )
                .into_response();
            }
        };
        let header_value = match HeaderValue::from_bytes(payment_header.as_ref()) {
            Ok(header_value) => header_value,
            Err(err) => {
                return X402Error::settlement_failed(
                    err,
                    self.payment_requirements.as_ref().clone(),
                )
                .into_response();
            }
        };
        let mut res = response;
        res.headers_mut().insert("X-Payment-Response", header_value);
        res.into_response()
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PaymentRequirementsNoResource {
    pub scheme: Scheme,
    pub network: Network,
    pub max_amount_required: TokenAmount,
    pub description: String,
    pub mime_type: String,
    pub pay_to: MixedAddress,
    pub max_timeout_seconds: u64,
    pub asset: MixedAddress,
    pub extra: Option<serde_json::Value>,
    pub output_schema: Option<serde_json::Value>,
}

impl PaymentRequirementsNoResource {
    pub fn to_payment_requirements(&self, resource: Url) -> PaymentRequirements {
        PaymentRequirements {
            scheme: self.scheme,
            network: self.network,
            max_amount_required: self.max_amount_required,
            resource,
            description: self.description.clone(),
            mime_type: self.mime_type.clone(),
            pay_to: self.pay_to.clone(),
            max_timeout_seconds: self.max_timeout_seconds,
            asset: self.asset.clone(),
            extra: self.extra.clone(),
            output_schema: self.output_schema.clone(),
        }
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum PaymentOffers {
    Ready(Arc<Vec<PaymentRequirements>>),
    NoResource {
        partial: Vec<PaymentRequirementsNoResource>,
        base_url: Url,
    },
}

fn gather_payment_requirements(
    payment_offers: &PaymentOffers,
    req_uri: &Uri,
) -> Arc<Vec<PaymentRequirements>> {
    match payment_offers {
        PaymentOffers::Ready(requirements) => Arc::clone(requirements),
        PaymentOffers::NoResource { partial, base_url } => {
            let resource = {
                let mut resource_url = base_url.clone();
                resource_url.set_path(req_uri.path());
                resource_url.set_query(req_uri.query());
                resource_url
            };
            let payment_requirements = partial
                .iter()
                .map(|partial| partial.to_payment_requirements(resource.clone()))
                .collect::<Vec<_>>();
            Arc::new(payment_requirements)
        }
    }
}
