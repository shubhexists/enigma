use crate::handlers::*;
use crate::proxy::proxy_request;
use axum::{
    extract::{Path, Request},
    middleware::Next,
    response::Response,
    routing::{delete, get, post, put},
    Router,
};
use database::{ApiRepository, UserRepository};
use middleware::{IntoPriceTag, X402Middleware};
use sqlx::PgPool;
use std::env;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use url::Url;
use x402_rs::address_sol;
use x402_rs::network::{Network, USDCDeployment};

async fn inject_api_id(
    Path((_user_id, api_id)): Path<(String, String)>,
    mut req: Request,
    next: Next,
) -> Response {
    req.extensions_mut().insert(api_id);
    next.run(req).await
}

pub fn create_app(pool: PgPool) -> Router {
    let user_repo = UserRepository::new(pool.clone());
    let api_repo = ApiRepository::new(pool);

    let facilitator_url =
        env::var("FACILITATOR_URL").unwrap_or_else(|_| "https://facilitator.x402.rs".to_string());

    let base_url = env::var("BASE_URL").unwrap_or_else(|_| "http://localhost:3000".to_string());
    let base_url = Url::parse(&base_url).expect("Invalid BASE_URL");
    let x402 = X402Middleware::try_from(facilitator_url.clone())
        .expect("Failed to initialize X402 middleware")
        .with_base_url(base_url.clone());

    // temporary address, would be removed essentially if the API has address attached
    let usdc_solana = USDCDeployment::by_network(Network::SolanaDevnet)
        .pay_to(address_sol!("8hAVK73RZdtyP2kE82ohAsAGgKaxffS6pU7B9bxRg2RL"));

    Router::new()
        .route("/users", post(create_user))
        .route("/users/{user_id}", get(get_user))
        .route("/users/{user_id}/apis", post(create_api))
        .route("/users/{user_id}/apis", get(list_user_apis))
        .route("/users/{user_id}/apis/{api_id}", get(get_api))
        .route("/users/{user_id}/apis/{api_id}", put(update_api))
        .route("/users/{user_id}/apis/{api_id}", delete(delete_api))
        .route(
            "/users/{user_id}/apis/{api_id}",
            post(proxy_request)
                .layer(
                    x402.with_description("Protected API Proxy")
                        .with_mime_type("application/json")
                        .with_price_tag(usdc_solana.amount(0).unwrap())
                        .with_api_repo(api_repo.clone()),
                )
                .layer(axum::middleware::from_fn(inject_api_id)),
        )
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(AppState {
            user_repo,
            api_repo,
            facilitator_url,
            base_url,
        })
}

#[derive(Clone)]
pub struct AppState {
    pub user_repo: UserRepository,
    pub api_repo: ApiRepository,
    pub facilitator_url: String,
    pub base_url: Url,
}
