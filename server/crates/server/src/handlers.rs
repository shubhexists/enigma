use crate::app::AppState;
use anyhow::Result;
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
};
use serde::{Deserialize, Serialize};
use shared::{Api, CreateApiRequest, CreateUserRequest, User};
use uuid::Uuid;

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateUserWithClerkIdRequest {
    pub clerk_id: String,
    pub name: String,
    pub email: String,
}

pub async fn create_user(
    State(state): State<AppState>,
    Json(request): Json<CreateUserRequest>,
) -> Result<Json<User>, StatusCode> {
    match state.user_repo.create_user(request).await {
        Ok(user) => Ok(Json(user)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn create_user_with_clerk_id(
    State(state): State<AppState>,
    Json(request): Json<CreateUserWithClerkIdRequest>,
) -> Result<Json<User>, StatusCode> {
    match state.user_repo.create_user_with_clerk_id(&request.clerk_id, request.name, request.email).await {
        Ok(user) => Ok(Json(user)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn get_user(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> Result<Json<User>, StatusCode> {
    match state.user_repo.get_user_by_id(user_id).await {
        Ok(Some(user)) => Ok(Json(user)),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn get_user_by_clerk_id(
    State(state): State<AppState>,
    Path(clerk_id): Path<String>,
) -> Result<Json<User>, StatusCode> {
    // Convert Clerk ID to UUID using the same logic as create_user_with_clerk_id
    let user_uuid = Uuid::parse_str(&clerk_id).unwrap_or_else(|_| {
        Uuid::new_v5(&Uuid::NAMESPACE_OID, clerk_id.as_bytes())
    });

    match state.user_repo.get_user_by_id(user_uuid).await {
        Ok(Some(user)) => Ok(Json(user)),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn create_api(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
    Json(request): Json<CreateApiRequest>,
) -> Result<Json<Api>, StatusCode> {
    match state.user_repo.get_user_by_id(user_id).await {
        Ok(Some(_)) => {}
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    }

    match state.api_repo.create_api(user_id, request).await {
        Ok(api) => Ok(Json(api)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn list_user_apis(
    State(state): State<AppState>,
    Path(user_id): Path<Uuid>,
) -> Result<Json<Vec<Api>>, StatusCode> {
    match state.user_repo.get_user_by_id(user_id).await {
        Ok(Some(_)) => {}
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    }

    match state.api_repo.get_apis_by_user_id(user_id).await {
        Ok(apis) => Ok(Json(apis)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn get_api(
    State(state): State<AppState>,
    Path((user_id, api_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<Api>, StatusCode> {
    match state.user_repo.get_user_by_id(user_id).await {
        Ok(Some(_)) => {}
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    }

    match state.api_repo.get_api_by_id(api_id).await {
        Ok(Some(api)) => {
            if api.user_id == user_id {
                Ok(Json(api))
            } else {
                Err(StatusCode::NOT_FOUND)
            }
        }
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn update_api(
    State(state): State<AppState>,
    Path((user_id, api_id)): Path<(Uuid, Uuid)>,
    Json(request): Json<CreateApiRequest>,
) -> Result<Json<Api>, StatusCode> {
    match state.user_repo.get_user_by_id(user_id).await {
        Ok(Some(_)) => {}
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    }

    match state.api_repo.get_api_by_id(api_id).await {
        Ok(Some(api)) => {
            if api.user_id != user_id {
                return Err(StatusCode::NOT_FOUND);
            }
        }
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    }

    match state.api_repo.update_api(api_id, request).await {
        Ok(Some(api)) => Ok(Json(api)),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn list_all_apis(
    State(state): State<AppState>,
) -> Result<Json<Vec<Api>>, StatusCode> {
    match state.api_repo.get_all_apis().await {
        Ok(apis) => {
            if apis.is_empty() {
                return Err(StatusCode::NOT_FOUND);
            }
            
            Ok(Json(apis))
        },
        Err(_) => {
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        },
    }
}

pub async fn delete_api(
    State(state): State<AppState>,
    Path((user_id, api_id)): Path<(Uuid, Uuid)>,
) -> Result<StatusCode, StatusCode> {
    match state.user_repo.get_user_by_id(user_id).await {
        Ok(Some(_)) => {}
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    }

    match state.api_repo.get_api_by_id(api_id).await {
        Ok(Some(api)) => {
            if api.user_id != user_id {
                return Err(StatusCode::NOT_FOUND);
            }
        }
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    }

    match state.api_repo.delete_api(api_id).await {
        Ok(true) => Ok(StatusCode::NO_CONTENT),
        Ok(false) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}
