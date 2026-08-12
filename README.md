# Terminal3 ADK Testnet: Developer Experience Audit

This repository records a reproducible Terminal3 ADK testnet execution, including the authenticated Quickstart, Rust-to-WASM contract build, tenant-local contract registration, map ACL setup, and a controlled invocation audit. It deliberately separates verified results from blocked or unverified steps.

## What this demonstrates

The execution verified that the current `@terminal3/t3n-sdk` package can authenticate a tenant against the testnet when configured with the SDK’s signed trust manifest. It also compiled the reference Rust contract to a WASI Preview 2 component and registered it under the authenticated tenant.

## Verified stack

| Component | Verified value |
| --- | --- |
| Node | v22.13.0 |
| npm | 10.9.2 |
| SDK | `@terminal3/t3n-sdk` 4.36.0 |
| Rust | 1.97.1 via rustup |
| WASM target | `wasm32-wasip2` |
| Network | Terminal3 testnet |
| Contract artifact | `z_tenant_flight.wasm`, 194 KB |
| Contract ID | 648 |
| Contract tail | `terminal3-dx-demo` |

## Quickstart

From `app/`, install dependencies and export the API key only in the current shell:

```bash
npm install
export T3N_API_KEY="<your-key>"
npx tsx quickstart.ts
```

The script uses `setEnvironment("testnet")`, fetches the signed trust manifest, performs the handshake, authenticates, prints the returned DID, and queries usage. Never commit the key or a `.env` file.

## Rust contract build

```bash
cd contracts/z-tenant-flight
rustup target add wasm32-wasip2
cargo build --target wasm32-wasip2 --release
ls -lh target/wasm32-wasip2/release/*.wasm
```

## Registration and map setup

The working registration path uses `TenantClient`, registers the artifact under a short tail, and records the numeric contract ID. The private `secrets` map was then created with contract `648` as its explicit reader and writer. The map was not populated because the reference contract requires a separate Duffel API key, which was not supplied.

## Evidence

The `screenshots/` directory contains a four-image credential-safe evidence set and a contact sheet generated from the verified sanitized execution logs. These are explicitly labeled evidence screenshots rather than original dashboard/browser captures. Sanitized execution logs are in `logs/`. Raw logs are intentionally excluded because the SDK or shell may echo sensitive material. The source scripts read secrets from process environment variables and contain no API key.

## Known limitations

The reference contract is a travel-booking example and expects `duffel_api_key` in the tenant’s private secrets map. Without that separate credential, invocation correctly fails with a missing-secret error. No real booking, payment, mainnet transaction, or irreversible bounty submission was attempted.

## Sources

[1]: https://superteam.fun/earn/listing/ai-id "Superteam Earn bounty listing"
[2]: https://docs.terminal3.io/developers/adk/get-started/quickstart "Terminal3 ADK Quickstart"
[3]: https://docs.terminal3.io/developers/adk/get-started/walkthrough/write-contract "Terminal3 ADK contract walkthrough"
[4]: https://docs.terminal3.io/developers/adk/get-started/walkthrough/build-contract "Terminal3 ADK contract build"
[5]: https://docs.terminal3.io/developers/adk/get-started/walkthrough/register-contract "Terminal3 ADK contract registration"
[6]: https://docs.terminal3.io/developers/adk/tips/create-kv-maps "Terminal3 tenant KV maps"
[7]: https://docs.terminal3.io/developers/adk/tips/seed-api-key "Terminal3 secret seeding"
