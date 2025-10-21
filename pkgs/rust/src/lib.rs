use reqwest::Client;
use reqwest_middleware::ClientWithMiddleware;
use serde::{Deserialize, Serialize};
use serde_json::json;
use solana_sdk::signature::Keypair;
use x402_reqwest::chains::solana::SolanaSenderWallet;
use x402_reqwest::{MaxTokenAmountFromAmount, ReqwestWithPayments, ReqwestWithPaymentsBuild};
use x402_rs::network::{Network, USDCDeployment};

pub mod errors;
pub mod request;
pub use errors::{Error, Result};
pub use request::{ApiRequest, HttpMethod};

#[derive(Debug, Clone)]
pub struct X402Config {
    /// Base URL ( Enigma Base URL )
    /// TODO: Change this when the service is deployed
    pub base_url: String,
    /// User ID of the Publisher of the API
    pub user_id: String,
    /// API ID for the specific API endpoint
    pub api_id: String,
    /// Solana RPC URL
    pub solana_rpc_url: String,
    /// Network to use for payments
    pub network: Network,
    /// Maximum payment amount in USDC
    pub max_payment_amount: f64,
}

impl Default for X402Config {
    fn default() -> Self {
        Self {
            base_url: "http://localhost:3000".to_string(),
            user_id: String::new(),
            api_id: String::new(),
            solana_rpc_url: "https://api.devnet.solana.com".to_string(),
            network: Network::SolanaDevnet,
            max_payment_amount: 0.1,
        }
    }
}

impl X402Config {
    pub fn builder() -> X402ConfigBuilder {
        X402ConfigBuilder::default()
    }

    fn endpoint_url(&self) -> String {
        format!(
            "{}/users/{}/apis/{}",
            self.base_url, self.user_id, self.api_id
        )
    }
}

#[derive(Default)]
pub struct X402ConfigBuilder {
    base_url: Option<String>,
    user_id: Option<String>,
    api_id: Option<String>,
    solana_rpc_url: Option<String>,
    network: Option<Network>,
    max_payment_amount: Option<f64>,
}

impl X402ConfigBuilder {
    pub fn base_url(mut self, url: impl Into<String>) -> Self {
        self.base_url = Some(url.into());
        self
    }

    pub fn user_id(mut self, id: impl Into<String>) -> Self {
        self.user_id = Some(id.into());
        self
    }

    pub fn api_id(mut self, id: impl Into<String>) -> Self {
        self.api_id = Some(id.into());
        self
    }

    pub fn solana_rpc_url(mut self, url: impl Into<String>) -> Self {
        self.solana_rpc_url = Some(url.into());
        self
    }

    pub fn network(mut self, network: Network) -> Self {
        self.network = Some(network);
        self
    }

    pub fn max_payment_amount(mut self, amount: f64) -> Self {
        self.max_payment_amount = Some(amount);
        self
    }

    pub fn build(self) -> Result<X402Config> {
        Ok(X402Config {
            base_url: self
                .base_url
                .unwrap_or_else(|| "http://localhost:3000".to_string()),
            user_id: self.user_id.ok_or(Error::MissingConfig("user_id"))?,
            api_id: self.api_id.ok_or(Error::MissingConfig("api_id"))?,
            solana_rpc_url: self
                .solana_rpc_url
                .unwrap_or_else(|| "https://api.devnet.solana.com".to_string()),
            network: self.network.unwrap_or(Network::SolanaDevnet),
            max_payment_amount: self.max_payment_amount.unwrap_or(0.1),
        })
    }
}

pub struct X402Client {
    config: X402Config,
    http_client: ClientWithMiddleware,
}

impl X402Client {
    pub fn new(keypair: Keypair, config: X402Config) -> Result<Self> {
        let rpc_client = solana_client::rpc_client::RpcClient::new(&config.solana_rpc_url);
        let sender = SolanaSenderWallet::new(keypair, rpc_client);

        let http_client = Client::new()
            .with_payments(sender)
            .prefer(USDCDeployment::by_network(config.network))
            .max(
                USDCDeployment::by_network(config.network)
                    .amount(config.max_payment_amount)
                    .map_err(|e| Error::PaymentSetup(e.to_string()))?,
            )
            .build();

        Ok(Self {
            config,
            http_client,
        })
    }

    pub fn from_base58(private_key: &str, config: X402Config) -> Result<Self> {
        let keypair = Keypair::from_base58_string(private_key);
        Self::new(keypair, config)
    }

    pub async fn execute(&self, request: ApiRequest) -> Result<ApiResponse> {
        let body = json!({
            "method": request.method.as_str(),
            "path": request.path,
            "headers": request.headers,
            "body": request.body,
        });

        let body_string = serde_json::to_string(&body)
            .map_err(|e| Error::Request(format!("Failed to serialize body: {}", e)))?;

        let response = self
            .http_client
            .post(&self.config.endpoint_url())
            .header("Content-Type", "application/json")
            .body(body_string)
            .send()
            .await
            .map_err(|e| Error::Request(e.to_string()))?;

        let status = response.status();
        let text = response
            .text()
            .await
            .map_err(|e| Error::Response(e.to_string()))?;

        Ok(ApiResponse {
            status: status.as_u16(),
            body: text,
        })
    }

    pub async fn get(&self, path: impl Into<String>) -> Result<ApiResponse> {
        let request = ApiRequest::get(path);
        self.execute(request).await
    }

    pub async fn post(
        &self,
        path: impl Into<String>,
        body: Option<serde_json::Value>,
    ) -> Result<ApiResponse> {
        let request = ApiRequest::post(path).with_body(body);
        self.execute(request).await
    }

    pub async fn put(
        &self,
        path: impl Into<String>,
        body: Option<serde_json::Value>,
    ) -> Result<ApiResponse> {
        let request = ApiRequest::put(path).with_body(body);
        self.execute(request).await
    }

    pub async fn delete(&self, path: impl Into<String>) -> Result<ApiResponse> {
        let request = ApiRequest::delete(path);
        self.execute(request).await
    }

    pub async fn patch(
        &self,
        path: impl Into<String>,
        body: Option<serde_json::Value>,
    ) -> Result<ApiResponse> {
        let request = ApiRequest::patch(path).with_body(body);
        self.execute(request).await
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiResponse {
    pub status: u16,
    pub body: String,
}

impl ApiResponse {
    pub fn json<T: serde::de::DeserializeOwned>(&self) -> Result<T> {
        serde_json::from_str(&self.body).map_err(|e| Error::Parse(e.to_string()))
    }

    pub fn is_success(&self) -> bool {
        (200..300).contains(&self.status)
    }
}
