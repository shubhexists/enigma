
## Quick Start

```rust
use enigma_apis::{X402Client, X402Config};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Configure the client
    let config = X402Config::builder()
        .user_id("user-id-of-publisher")
        .api_id("api-id-you-want-to-call")
        .build()?;

    // Create client
    let client = X402Client::from_base58("your-private-key", config)?;

    // Make requests
    let response = client.get("/posts").await?;
    println!("Response: {}", response.body);

    Ok(())
}
```
