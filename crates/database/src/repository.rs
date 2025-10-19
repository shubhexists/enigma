use crate::models::{ApiRow, UserRow};
use anyhow::Result;
use shared::{Api, CreateApiRequest, CreateUserRequest, User};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Clone)]
pub struct UserRepository {
    pool: PgPool,
}

#[derive(Clone)]
pub struct ApiRepository {
    pool: PgPool,
}

impl UserRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create_user(&self, request: CreateUserRequest) -> Result<User> {
        let id = Uuid::new_v4();
        let now = chrono::Utc::now();

        let user = sqlx::query_as::<_, UserRow>(
            "INSERT INTO users (id, name, email, created_at) VALUES ($1, $2, $3, $4) RETURNING *",
        )
        .bind(&id)
        .bind(&request.name)
        .bind(&request.email)
        .bind(&now)
        .fetch_one(&self.pool)
        .await?;

        Ok(user.into())
    }

    pub async fn get_user_by_id(&self, id: Uuid) -> Result<Option<User>> {
        let user = sqlx::query_as::<_, UserRow>("SELECT * FROM users WHERE id = $1")
            .bind(&id)
            .fetch_optional(&self.pool)
            .await?;

        Ok(user.map(|u| u.into()))
    }

    pub async fn get_user_by_email(&self, email: &str) -> Result<Option<User>> {
        let user = sqlx::query_as::<_, UserRow>("SELECT * FROM users WHERE email = $1")
            .bind(email)
            .fetch_optional(&self.pool)
            .await?;

        Ok(user.map(|u| u.into()))
    }
}

impl ApiRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create_api(&self, user_id: Uuid, request: CreateApiRequest) -> Result<Api> {
        let id = Uuid::new_v4();
        let now = chrono::Utc::now();
        let endpoints_json = serde_json::to_value(&request.endpoints)?;
        let payment_config_json = request
            .payment_config
            .map(|config| serde_json::to_value(config))
            .transpose()?;
        let category_str = serde_json::to_string(&request.category)?;

        let api = sqlx::query_as::<_, ApiRow>(
            "INSERT INTO apis (id, user_id, name, description, category, base_url, endpoints, payment_config, created_at, updated_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *"
        )
        .bind(&id)
        .bind(&user_id)
        .bind(&request.name)
        .bind(&request.description)
        .bind(&category_str)
        .bind(&request.base_url)
        .bind(&endpoints_json)
        .bind(&payment_config_json)
        .bind(&now)
        .bind(&now)
        .fetch_one(&self.pool)
        .await?;

        Ok(api.into())
    }

    pub async fn get_api_by_id(&self, id: Uuid) -> Result<Option<Api>> {
        let api = sqlx::query_as::<_, ApiRow>("SELECT * FROM apis WHERE id = $1")
            .bind(&id)
            .fetch_optional(&self.pool)
            .await?;

        Ok(api.map(|a| a.into()))
    }

    pub async fn get_apis_by_user_id(&self, user_id: Uuid) -> Result<Vec<Api>> {
        let apis = sqlx::query_as::<_, ApiRow>(
            "SELECT * FROM apis WHERE user_id = $1 ORDER BY created_at DESC",
        )
        .bind(&user_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(apis.into_iter().map(|a| a.into()).collect())
    }

    pub async fn update_api(&self, id: Uuid, request: CreateApiRequest) -> Result<Option<Api>> {
        let now = chrono::Utc::now();
        let endpoints_json = serde_json::to_value(&request.endpoints)?;
        let payment_config_json = request
            .payment_config
            .map(|config| serde_json::to_value(config))
            .transpose()?;
        let category_str = serde_json::to_string(&request.category)?;

        let api = sqlx::query_as::<_, ApiRow>(
            "UPDATE apis SET name = $2, description = $3, category = $4, base_url = $5, endpoints = $6, payment_config = $7, updated_at = $8 
             WHERE id = $1 RETURNING *"
        )
        .bind(&id)
        .bind(&request.name)
        .bind(&request.description)
        .bind(&category_str)
        .bind(&request.base_url)
        .bind(&endpoints_json)
        .bind(&payment_config_json)
        .bind(&now)
        .fetch_optional(&self.pool)
        .await?;

        Ok(api.map(|a| a.into()))
    }

    pub async fn delete_api(&self, id: Uuid) -> Result<bool> {
        let result = sqlx::query("DELETE FROM apis WHERE id = $1")
            .bind(&id)
            .execute(&self.pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
