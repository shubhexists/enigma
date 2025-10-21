# Enigma API

EnigmaAPi is an advanced platform that acts as a marketplace and hub for APIs — basically a one-stop shop where developers can find, connect to, and manage thousands of APIs from different providers, all through a single interface.

It leverages the x402 Protocol implemented on Solana to make transactions between the creator of the API and the user in a fully secure manner, leveraging stablecoins.

Enigma currently just supports USDC, although soon would be expanding to more popular coins for payments.

## Technical Overview 

Enigma implements a custom [middleware](https://github.com/shubhexists/enigma/tree/main/crates/middleware), derived after making several changes to the `x402-axum` crate, which makes this peer to peer access possible.

Several of the server business logic resides in the [server](https://github.com/shubhexists/enigma/tree/main/crates/server) crate which exposes several APIs for Enigma.

Database models are in the [shared](https://github.com/shubhexists/enigma/blob/main/crates/shared/src/types.rs) crate.

## Usage

Although, server can be directly interacted with normal `reqwest` or `x402-reqwest`, but it is preferred to use the `enigma_api` crate we [published](https://github.com/shubhexists/enigma/tree/main/pkgs/rust), with the sample usage here (https://github.com/shubhexists/enigma/tree/main/example/rust) which is created just for interacted with Enigma.