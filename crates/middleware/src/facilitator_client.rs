use http::{HeaderMap, StatusCode};
use reqwest::Client;
use std::fmt::Display;
use std::time::Duration;
use url::Url;
use x402_rs::facilitator::Facilitator;
use x402_rs::types::{
    SettleRequest, SettleResponse, SupportedPaymentKindsResponse, VerifyRequest, VerifyResponse,
};

#[derive(Clone, Debug)]
pub struct FacilitatorClient {
    #[allow(dead_code)] 
    base_url: Url,
    verify_url: Url,
    settle_url: Url,
    supported_url: Url,
    client: Client,
    headers: HeaderMap,
    timeout: Option<Duration>,
}

impl Facilitator for FacilitatorClient {
    type Error = FacilitatorClientError;

    #[cfg(not(feature = "telemetry"))]
    async fn verify(
        &self,
        request: &VerifyRequest,
    ) -> Result<VerifyResponse, FacilitatorClientError> {
        FacilitatorClient::verify(self, request).await
    }

    async fn supported(&self) -> Result<SupportedPaymentKindsResponse, Self::Error> {
        FacilitatorClient::supported(self).await
    }

    #[cfg(not(feature = "telemetry"))]
    async fn settle(
        &self,
        request: &SettleRequest,
    ) -> Result<SettleResponse, FacilitatorClientError> {
        FacilitatorClient::settle(self, request).await
    }
}

#[derive(Debug, thiserror::Error)]
pub enum FacilitatorClientError {
    #[error("URL parse error: {context}: {source}")]
    UrlParse {
        context: &'static str,
        #[source]
        source: url::ParseError,
    },
    #[error("HTTP error: {context}: {source}")]
    Http {
        context: &'static str,
        #[source]
        source: reqwest::Error,
    },
    #[error("Failed to deserialize JSON: {context}: {source}")]
    JsonDeserialization {
        context: &'static str,
        #[source]
        source: reqwest::Error,
    },
    #[error("Unexpected HTTP status {status}: {context}: {body}")]
    HttpStatus {
        context: &'static str,
        status: StatusCode,
        body: String,
    },
    #[error("Failed to read response body as text: {context}: {source}")]
    ResponseBodyRead {
        context: &'static str,
        #[source]
        source: reqwest::Error,
    },
}

impl FacilitatorClient {
    #[allow(dead_code)]
    pub fn base_url(&self) -> &Url {
        &self.base_url
    }

    #[allow(dead_code)]
    pub fn verify_url(&self) -> &Url {
        &self.verify_url
    }

    #[allow(dead_code)]
    pub fn settle_url(&self) -> &Url {
        &self.settle_url
    }

    #[allow(dead_code)]
    pub fn headers(&self) -> &HeaderMap {
        &self.headers
    }

    #[allow(dead_code)]
    pub fn timeout(&self) -> &Option<Duration> {
        &self.timeout
    }

    pub fn try_new(base_url: Url) -> Result<Self, FacilitatorClientError> {
        let client = Client::new();
        let verify_url =
            base_url
                .join("./verify")
                .map_err(|e| FacilitatorClientError::UrlParse {
                    context: "Failed to construct ./verify URL",
                    source: e,
                })?;
        let settle_url =
            base_url
                .join("./settle")
                .map_err(|e| FacilitatorClientError::UrlParse {
                    context: "Failed to construct ./settle URL",
                    source: e,
                })?;
        let supported_url =
            base_url
                .join("./supported")
                .map_err(|e| FacilitatorClientError::UrlParse {
                    context: "Failed to construct ./supported URL",
                    source: e,
                })?;
        Ok(Self {
            client,
            base_url,
            verify_url,
            settle_url,
            supported_url,
            headers: HeaderMap::new(),
            timeout: None,
        })
    }

    #[allow(dead_code)]
    pub fn with_headers(&self, headers: HeaderMap) -> Self {
        let mut this = self.clone();
        this.headers = headers;
        this
    }

    #[allow(dead_code)]
    pub fn with_timeout(&self, timeout: Duration) -> Self {
        let mut this = self.clone();
        this.timeout = Some(timeout);
        this
    }

    pub async fn verify(
        &self,
        request: &VerifyRequest,
    ) -> Result<VerifyResponse, FacilitatorClientError> {
        self.post_json(&self.verify_url, "POST /verify", request)
            .await
    }

    pub async fn settle(
        &self,
        request: &SettleRequest,
    ) -> Result<SettleResponse, FacilitatorClientError> {
        self.post_json(&self.settle_url, "POST /settle", request)
            .await
    }

    pub async fn supported(&self) -> Result<SupportedPaymentKindsResponse, FacilitatorClientError> {
        self.get_json(&self.supported_url, "GET /supported").await
    }

    async fn post_json<T, R>(
        &self,
        url: &Url,
        context: &'static str,
        payload: &T,
    ) -> Result<R, FacilitatorClientError>
    where
        T: serde::Serialize + ?Sized,
        R: serde::de::DeserializeOwned,
    {
        let mut req = self.client.post(url.clone()).json(payload);
        for (key, value) in self.headers.iter() {
            req = req.header(key, value);
        }
        if let Some(timeout) = self.timeout {
            req = req.timeout(timeout);
        }
        let http_response = req
            .send()
            .await
            .map_err(|e| FacilitatorClientError::Http { context, source: e })?;

        let result = if http_response.status() == StatusCode::OK {
            http_response
                .json::<R>()
                .await
                .map_err(|e| FacilitatorClientError::JsonDeserialization { context, source: e })
        } else {
            let status = http_response.status();
            let body = http_response
                .text()
                .await
                .map_err(|e| FacilitatorClientError::ResponseBodyRead { context, source: e })?;
            Err(FacilitatorClientError::HttpStatus {
                context,
                status,
                body,
            })
        };

        record_result_on_span(&result);

        result
    }

    async fn get_json<R>(
        &self,
        url: &Url,
        context: &'static str,
    ) -> Result<R, FacilitatorClientError>
    where
        R: serde::de::DeserializeOwned,
    {
        let mut req = self.client.get(url.clone());
        for (key, value) in self.headers.iter() {
            req = req.header(key, value);
        }
        if let Some(timeout) = self.timeout {
            req = req.timeout(timeout);
        }
        let http_response = req
            .send()
            .await
            .map_err(|e| FacilitatorClientError::Http { context, source: e })?;

        let result = if http_response.status() == StatusCode::OK {
            http_response
                .json::<R>()
                .await
                .map_err(|e| FacilitatorClientError::JsonDeserialization { context, source: e })
        } else {
            let status = http_response.status();
            let body = http_response
                .text()
                .await
                .map_err(|e| FacilitatorClientError::ResponseBodyRead { context, source: e })?;
            Err(FacilitatorClientError::HttpStatus {
                context,
                status,
                body,
            })
        };

        record_result_on_span(&result);

        result
    }
}

impl TryFrom<&str> for FacilitatorClient {
    type Error = FacilitatorClientError;
    fn try_from(value: &str) -> Result<Self, Self::Error> {
        let mut normalized = value.trim_end_matches('/').to_string();
        normalized.push('/');
        let url = Url::parse(&normalized).map_err(|e| FacilitatorClientError::UrlParse {
            context: "Failed to parse base url",
            source: e,
        })?;
        FacilitatorClient::try_new(url)
    }
}

#[cfg(not(feature = "telemetry"))]
fn record_result_on_span<R, E: Display>(_result: &Result<R, E>) {}
