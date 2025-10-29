### Basic Setup

```typescript
import { X402Client, X402ConfigBuilder } from "x402-client";

// Configure the client
const config = new X402ConfigBuilder()
  .userId("user-id-of-publisher")
  .apiId("api-id-you-want-to-call")
  .baseUrl("http://localhost:3000")
  .solanaRpcUrl("https://api.devnet.solana.com")
  .maxPaymentAmount(0.1)
  .build();

// Create client with your private key
const client = await X402Client.create(privateKey, config);

// Make requests
const response = await client.get("/posts");
console.log(response.status, response.body);
```