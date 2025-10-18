use axum::serve;
use dotenvy;
use sqlx::PgPool;
use std::net::SocketAddr;
use tokio::net::TcpListener;
use tracing_subscriber;
use database::migrations;
use server::create_app;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt::init();

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:password@localhost/enigma".to_string());

    let pool = PgPool::connect(&database_url).await?;

    migrations::run_migrations(&pool).await?;

    let app = create_app(pool);
    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    tracing::info!("Server starting on {}", addr);

    let listener = TcpListener::bind(&addr).await?;
    serve(listener, app).await?;
    Ok(())
}
