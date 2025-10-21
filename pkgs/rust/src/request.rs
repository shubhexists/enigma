use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum HttpMethod {
    GET,
    POST,
    PUT,
    DELETE,
    PATCH,
    HEAD,
    OPTIONS,
}

impl HttpMethod {
    pub fn as_str(&self) -> &'static str {
        match self {
            HttpMethod::GET => "GET",
            HttpMethod::POST => "POST",
            HttpMethod::PUT => "PUT",
            HttpMethod::DELETE => "DELETE",
            HttpMethod::PATCH => "PATCH",
            HttpMethod::HEAD => "HEAD",
            HttpMethod::OPTIONS => "OPTIONS",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiRequest {
    pub method: HttpMethod,
    pub path: String,
    #[serde(skip_serializing_if = "HashMap::is_empty")]
    pub headers: HashMap<String, String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub body: Option<serde_json::Value>,
}

impl ApiRequest {
    pub fn new(method: HttpMethod, path: impl Into<String>) -> Self {
        let mut headers = HashMap::new();
        headers.insert("Content-Type".to_string(), "application/json".to_string());

        Self {
            method,
            path: path.into(),
            headers,
            body: None,
        }
    }

    pub fn get(path: impl Into<String>) -> Self {
        Self::new(HttpMethod::GET, path)
    }

    pub fn post(path: impl Into<String>) -> Self {
        Self::new(HttpMethod::POST, path)
    }

    pub fn put(path: impl Into<String>) -> Self {
        Self::new(HttpMethod::PUT, path)
    }

    pub fn delete(path: impl Into<String>) -> Self {
        Self::new(HttpMethod::DELETE, path)
    }

    pub fn patch(path: impl Into<String>) -> Self {
        Self::new(HttpMethod::PATCH, path)
    }

    pub fn with_header(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.headers.insert(key.into(), value.into());
        self
    }

    pub fn with_headers(mut self, headers: HashMap<String, String>) -> Self {
        self.headers.extend(headers);
        self
    }

    pub fn with_body(mut self, body: Option<serde_json::Value>) -> Self {
        self.body = body;
        self
    }
}
