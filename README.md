# Terminal3 ADK Testnet — Developer Experience Audit and Agent Attestation Registry

> A reproducible Terminal3 ADK testnet project covering authenticated Quickstart execution, Rust-to-WASM contract compilation, tenant-local registration, KV-map access control, and a custom KV-only Agent Attestation Registry.

## Current repository state

The repository contains two contracts. The reference `z-tenant-flight` contract was built and registered on the Terminal3 testnet as `terminal3-dx-demo`, contract ID **648**. The custom `z-tenant-attest` contract is now WIT-compatible, passes **9 unit tests**, and builds successfully to a 145 KB WASI Preview 2 component. Its end-to-end registration and invocation script is included, but that custom contract has not been registered on the live tenant in the current evidence set.

| Area | Current verified state |
|---|---|
| Quickstart authentication | Passed with signed trust-manifest configuration |
| Reference contract build | Passed; `z_tenant_flight.wasm`, approximately 194 KB |
| Reference registration | Passed; contract ID 648, tail `terminal3-dx-demo` |
| Reference invocation | Reached runtime; blocked by missing `duffel_api_key` |
| Custom contract unit tests | Passed; 9 tests |
| Custom contract WASI build | Passed; `z_tenant_attest.wasm`, approximately 145 KB |
| Custom contract live deployment | Script prepared; live registration/invocation not yet evidenced |
| Screenshots | Five credential-safe PNG assets tracked under `screenshots/` |
| DX audit | Two confirmed documentation/SDK mismatches and two observations |

## What the project demonstrates

The project uses `T3nClient` for signed authentication, `TenantClient` for tenant control-plane operations, Rust and WIT for WASI Preview 2 components, private KV maps for contract state, and logging inside the TEE. The custom registry stores agent attestations keyed by DID and exposes the functions `register`, `verify`, and `list-attestations`. It does not require Duffel or another external API key.

## Repository structure

```text
terminal3-adk-bounty/
├── app/
│   ├── quickstart.ts          # Auth, usage, reference registration, reference invocation
│   ├── invoke.ts              # Reference contract invocation only
│   ├── setup-secrets-map.ts   # Reference secrets-map ACL provisioning
│   └── attest-demo.ts         # Custom contract registration and register/verify/list demo
├── contracts/
│   ├── z-tenant-flight/       # Reference Terminal3 travel contract
│   └── z-tenant-attest/       # Custom Agent Attestation Registry
├── docs/
│   ├── QUICKSTART.md
│   ├── WALKTHROUGH.md
│   ├── BUGS.md
│   ├── DX_AUDIT.md
│   ├── USE_CASE.md
│   └── REPORT.md
├── logs/                      # Sanitized execution, test, and build logs
├── screenshots/               # Current credential-safe evidence PNGs
└── scripts/                   # Evidence screenshot generator
```

## Prerequisites

| Requirement | Verified/current value |
|---|---|
| Node.js | v22.13.0 or later |
| npm | 10.9.2 or later |
| Rust | 1.97.1 via rustup in the verified run |
| WASI target | `wasm32-wasip2` |
| Terminal3 SDK | `@terminal3/t3n-sdk` 4.36.0 |
| Credential | `T3N_API_KEY` from the Terminal3 claim page |

## Installation

```bash
git clone https://github.com/Stan-lee13/terminal3-adk-bounty.git
cd terminal3-adk-bounty
cd app
npm install
cd ../contracts/z-tenant-flight
rustup target add wasm32-wasip2
cd ../z-tenant-attest
rustup target add wasm32-wasip2
```

Keep the API key in the current shell only:

```bash
export T3N_API_KEY="<your-key>"
```

Never commit `.env` files, API keys, or raw execution logs.

## Run the verified reference workflow

```bash
cd app
npx tsx quickstart.ts
```

The working script uses `setEnvironment("testnet")`, fetches the signed trust manifest, authenticates, verifies the DID, queries usage, registers `terminal3-dx-demo` version `0.1.0`, and attempts the reference function. Registration is idempotency-sensitive: a previously registered version must not be registered again with the same version.

The reference contract requires a private `secrets` map with contract ID 648 as reader and writer. The separate `duffel_api_key` was not supplied, so the reference invocation correctly stops with a missing-secret error.

## Build and test the custom contract

```bash
cd contracts/z-tenant-attest
cargo test --all-targets
cargo build --target wasm32-wasip2 --release
```

The current verified result is **9 tests passed** and a successful 145 KB release WASM build. The corrected WIT export is `list-attestations`, because `list` is reserved in the current WIT parser. The demo calls `register`, `verify`, and `list-attestations` through `TenantClient`.

To run the custom demo after registering the custom artifact on a tenant:

```bash
cd ../../app
npx tsx attest-demo.ts
```

The script creates a private `attestations` map with the returned custom contract ID as explicit reader and writer, then registers, verifies, and lists a test attestation. The current repository proves compilation and unit tests; it does not claim a completed live custom-contract deployment.

## Screenshots and evidence

The exact tracked screenshot assets are documented in [`screenshots/README.md`](screenshots/README.md):

| File | Evidence |
|---|---|
| `00_evidence_contact_sheet.png` | Four-panel overview |
| `01_quickstart_authenticated.png` | Authenticated Quickstart |
| `02_contract_build.png` | Reference WASI build |
| `03_contract_registered.png` | Contract ID 648 registration |
| `04_invocation_blocker.png` | Reference runtime missing-secret result |

The images are credential-safe evidence cards generated from sanitized logs. They are not private dashboard screenshots and do not contain the API key.

## Developer-experience findings

The audit confirmed that the public Quickstart omits the signed `trustAnchor` required by SDK 4.36.0, and that the setup guide uses `tenant.me()` even though the current SDK exposes `tenant.tenant.me()`. The reference travel contract also requires a third-party secret and user egress authorization that should be surfaced earlier in the walkthrough.

See [`docs/BUGS.md`](docs/BUGS.md), [`docs/DX_AUDIT.md`](docs/DX_AUDIT.md), and [`docs/REPORT.md`](docs/REPORT.md) for the detailed evidence and recommendations.

## Security note

The API key used during the original test was exposed in chat and should be rotated or regenerated before reuse. It is not present in this repository, its screenshots, or its sanitized logs.

## References

[1]: https://docs.terminal3.io/developers/adk/get-started/quickstart "Terminal3 ADK Quickstart"
[2]: https://docs.terminal3.io/developers/adk/get-started/prerequisites/set-up-dev-env "Terminal3 development environment setup"
[3]: https://docs.terminal3.io/developers/adk/get-started/walkthrough/build-contract "Terminal3 contract build"
[4]: https://docs.terminal3.io/developers/adk/get-started/walkthrough/register-contract "Terminal3 contract registration"
[5]: https://docs.terminal3.io/developers/adk/tips/create-kv-maps "Terminal3 tenant KV maps"
[6]: https://docs.terminal3.io/developers/adk/tips/seed-api-key "Terminal3 secrets map"
[7]: https://superteam.fun/earn/listing/ai-id "Superteam bounty listing"
