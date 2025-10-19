use chrono::{DateTime, Utc};
use shared::{Api, ApiCategory, User};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, FromRow)]
pub struct UserRow {
    pub id: Uuid,
    pub name: String,
    pub email: String,
    pub created_at: DateTime<Utc>,
}

impl From<UserRow> for User {
    fn from(row: UserRow) -> Self {
        User {
            id: row.id,
            name: row.name,
            email: row.email,
            created_at: row.created_at,
        }
    }
}

#[derive(Debug, Clone, FromRow)]
pub struct ApiRow {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub base_url: String,
    pub endpoints: serde_json::Value,
    pub payment_config: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<ApiRow> for Api {
    fn from(row: ApiRow) -> Self {
        Api {
            id: row.id,
            user_id: row.user_id,
            name: row.name,
            description: row.description,
            category: serde_json::from_str(&row.category).unwrap_or(ApiCategory::Other),
            base_url: row.base_url,
            endpoints: serde_json::from_value(row.endpoints).unwrap_or_default(),
            payment_config: row
                .payment_config
                .and_then(|v| serde_json::from_value(v).ok()),
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }
}
