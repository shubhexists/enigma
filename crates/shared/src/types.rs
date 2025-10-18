use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Api {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub base_url: String,
    pub endpoints: Vec<ApiEndpoint>,
    pub payment_config: Option<PaymentConfig>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiEndpoint {
    pub path: String,
    pub method: HttpMethod,
    pub headers: Option<serde_json::Value>,
    pub body_schema: Option<serde_json::Value>,
    pub query_params: Option<serde_json::Value>,
}

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

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateUserRequest {
    pub name: String,
    pub email: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateApiRequest {
    pub name: String,
    pub description: Option<String>,
    pub base_url: String,
    pub endpoints: Vec<ApiEndpoint>,
    pub payment_config: Option<PaymentConfig>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PaymentConfig {
    pub sol_public_key: String,
    pub cost_per_request: f64, // Cost in USDC
    pub enabled: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProxyRequest {
    pub method: HttpMethod,
    pub path: Option<String>,
    pub headers: Option<serde_json::Value>,
    pub body: Option<serde_json::Value>,
    pub query_params: Option<serde_json::Value>,
}
