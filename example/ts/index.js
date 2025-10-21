import { X402Client, X402ConfigBuilder } from "@shubhexists/enigma";

const config = new X402ConfigBuilder()
    .userId("3c508bea-3687-4f0b-8b5a-0011fc5c4279")
    .apiId("911be2bf-c93d-4b04-9163-089e9c05674a")
    .baseUrl("http://localhost:3000")
    .solanaRpcUrl("https://api.devnet.solana.com")
    .maxPaymentAmount(0.1)
    .build();

const client = await X402Client.create("PVT KEY", config);

const response = await client.get("/posts");
console.log(response.status, response.body);