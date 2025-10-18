use crate::app::AppState;
use anyhow::Result;
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
};
use shared::{Api, CreateApiRequest, CreateUserRequest, User};
use uuid::Uuid;

pub async fn create_user(
    State(state): State<AppState>,
    Json(request): Json<CreateUserRequest>,
) -> Result<Json<User>, StatusCode> {
    match state.user_repo.create_user(request).await {
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
