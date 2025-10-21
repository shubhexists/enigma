use enigma_apis::{X402Client, X402Config};
use serde_json::Value;
use std::env;

#[tokio::main]
/// THESE ARE SAMPLE USER ID AND API ID THAT I TESTED ON, CHANGE IT ACCORDING TO YOUR NEEDS
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = X402Config::builder()
        .user_id("3c508bea-3687-4f0b-8b5a-0011fc5c4279")
        .api_id("911be2bf-c93d-4b04-9163-089e9c05674a")
        .base_url("http://localhost:3000")
        .solana_rpc_url(
            env::var("SOLANA_RPC_URL")
                .unwrap_or_else(|_| "https://api.devnet.solana.com".to_string()),
        )
        .max_payment_amount(0.1)
        .build()?;

    let private_key = env::var("SOLANA_PRIVATE_KEY").unwrap_or_else(|_| "PVT_KEY".to_string());

    let client = X402Client::from_base58(&private_key, config)?;

    println!("=== GET Request ===");
    let get_response = client.get("/posts").await?;
    println!("Status: {}", get_response.status);

    if let Ok(json) = serde_json::from_str::<Value>(&get_response.body) {
        if let Some(body) = json.get("body") {
            println!("\n{}", serde_json::to_string_pretty(body)?);
        }
    }

    println!("\n=== POST Request ===");
    let post_response = client.post("/posts", None).await?;
    println!("Status: {}", post_response.status);

    if let Ok(json) = serde_json::from_str::<Value>(&post_response.body) {
        if let Some(body) = json.get("body") {
            println!("\n{}", serde_json::to_string_pretty(body)?);
        }
    }

    Ok(())
}
