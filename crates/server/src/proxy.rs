use crate::app::AppState;
use anyhow::Result;
use axum::{
    body::Bytes,
    extract::{Path, State},
    http::StatusCode,
    response::Json,
};
use reqwest::{Client, Method};
use serde_json::Value;
use shared::ProxyRequest;
use std::collections::HashMap;
use uuid::Uuid;

pub async fn proxy_request(
    State(state): State<AppState>,
    Path((user_id, api_id)): Path<(Uuid, Uuid)>,
    body: Bytes,
) -> Result<Json<Value>, StatusCode> {
    let proxy_request: ProxyRequest = match serde_json::from_slice(&body) {
        Ok(req) => req,
        Err(_) => return Err(StatusCode::BAD_REQUEST),
    };

    let api = match state.api_repo.get_api_by_id(api_id).await {
        Ok(Some(api)) => {
            if api.user_id != user_id {
                return Err(StatusCode::NOT_FOUND);
            }
            api
        }
        Ok(None) => return Err(StatusCode::NOT_FOUND),
        Err(_) => return Err(StatusCode::INTERNAL_SERVER_ERROR),
    };

    let client = Client::new();
    let path = proxy_request.path.unwrap_or_else(|| "/".to_string());
    let target_url = format!("{}{}", api.base_url, path);

    let query_string = if let Some(query_params) = &proxy_request.query_params {
        if let Some(params_obj) = query_params.as_object() {
            let pairs: Vec<String> = params_obj
                .iter()
                .map(|(k, v)| format!("{}={}", k, v))
                .collect();
            if !pairs.is_empty() {
                format!("?{}", pairs.join("&"))
            } else {
                String::new()
            }
        } else {
            String::new()
        }
    } else {
        String::new()
    };

    let full_url = format!("{}{}", target_url, query_string);
    let mut request_headers = reqwest::header::HeaderMap::new();

    if let Some(headers_obj) = &proxy_request.headers {
        if let Some(headers_map) = headers_obj.as_object() {
            for (key, value) in headers_map {
                if let Ok(header_name) = reqwest::header::HeaderName::try_from(key.as_str()) {
                    if let Some(value_str) = value.as_str() {
                        if let Ok(header_value) = reqwest::header::HeaderValue::try_from(value_str)
                        {
                            request_headers.insert(header_name, header_value);
                        }
                    }
                }
            }
        }
    }

    let method = match proxy_request.method {
        shared::HttpMethod::GET => Method::GET,
        shared::HttpMethod::POST => Method::POST,
        shared::HttpMethod::PUT => Method::PUT,
        shared::HttpMethod::DELETE => Method::DELETE,
        shared::HttpMethod::PATCH => Method::PATCH,
        shared::HttpMethod::HEAD => Method::HEAD,
        shared::HttpMethod::OPTIONS => Method::OPTIONS,
    };

    let request_body = if let Some(body_data) = &proxy_request.body {
        serde_json::to_vec(body_data).unwrap_or_default()
    } else {
        Vec::new()
    };

    let response = match client
        .request(method, &full_url)
        .headers(request_headers)
        .body(request_body)
        .send()
        .await
    {
        Ok(response) => response,
        Err(_) => return Err(StatusCode::BAD_GATEWAY),
    };

    let status = response.status();
    let response_headers: HashMap<String, String> = response
        .headers()
        .iter()
        .map(|(k, v)| (k.to_string(), v.to_str().unwrap_or("").to_string()))
        .collect();

    let response_body = match response.text().await {
        Ok(body) => body,
        Err(_) => return Err(StatusCode::BAD_GATEWAY),
    };

    let json_response: Value = match serde_json::from_str(&response_body) {
        Ok(json) => json,
        Err(_) => Value::String(response_body),
    };

    let proxy_response = serde_json::json!({
        "status": status.as_u16(),
        "headers": response_headers,
        "body": json_response
    });

    Ok(Json(proxy_response))
}
