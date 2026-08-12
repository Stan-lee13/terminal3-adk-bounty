# Terminal3 ADK Testnet — Developer Experience Audit & Integration Report

> A reproducible Terminal3 ADK testnet execution: authenticated Quickstart, Rust→WASM contract build, tenant-local registration, KV-map setup, and a custom **Agent Attestation Registry** contract that runs end-to-end without external API dependencies.

## What This Demonstrates

This submission goes beyond following the tutorial. It:

1. **Completed the full authenticated Quickstart** on the Terminal3 testnet
2. **Compiled the reference Rust contract** to a WASI Preview 2 component (194 KB)
3. **Registered the contract** under the authenticated tenant (contract ID 648)
4. **Created and configured KV maps** with correct ACLs
5. **Built a custom contract** (Agent Attestation Registry) that uses only KV-store — no external API key needed
6. **Documented 2 confirmed bugs** and 2 observations about documentation/SDK drift
7. **Performed a systematic DX audit** of the entire developer workflow

## Terminal3 Components Used

| Component | Usage |
|-----------|-------|
| T3nClient | Authenticated session, handshake, DID resolution |
| TenantClient | Contract registration, KV map management |
| KV-store (host interface) | Attestation storage in private z-namespace |
| Logging (host interface) | Audit trail inside TEE |
| WASM component model | Rust → wasm32-wasip2 → T3N registration |
| Tenant context | Dynamic z-namespace map name construction |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Developer Machine                                          │
│  ├── app/quickstart.ts     ← T3nClient auth + TenantClient   │
│  ├── app/attest-demo.ts    ← Custom contract end-to-end demo │
│  └── app/setup-secrets-map.ts  ← KV map ACL provisioning     │
│                                                             │
│  contracts/z-tenant-flight/  ← Reference contract (Duffel)    │
│  contracts/z-tenant-attest/  ← Custom contract (KV-only)      │
└─────────────────────────────────────────────────────────────┘
         │
         │ @terminal3/t3n-sdk (WebSocket + WASM)
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Terminal3 Testnet (T3N)                                    │
│  ├── TEE Node                                               │
│  │   ├── Contract execution (WASM in enclave)              │
│  │   ├── KV-store (z:<tid>:attestations)                    │
│  │   └── Logging (audit trail)                              │
│  └── Tenant registry (contract ID 648)                      │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | v22.13.0+ |
| npm | 10.9.2+ |
| Rust | 1.85+ (rustup) |
| WASM target | wasm32-wasip2 |
| Terminal3 SDK | @terminal3/t3n-sdk ^4.36.0 |
| Terminal3 API key | From [claim page](https://www.terminal3.io/claim-page) |

## Installation

```bash
git clone https://github.com/Stan-lee13/terminal3-adk-bounty.git
cd terminal3-adk-bounty

# Install SDK dependencies
cd app
npm install

# Install Rust + WASM target (if not already installed)
rustup target add wasm32-wasip2
```

## Environment Variables

```bash
# Required: your Terminal3 API key from the claim page
export T3N_API_KEY="<your-key>"
```

Never commit `.env` files. See `.env.example` for the template.

## Running the Example

### Quickstart (authenticated connection)

```bash
cd app
export T3N_API_KEY="<your-key>"
npx tsx quickstart.ts
```

Expected output:
```
Starting handshake...
Handshake complete
Connected as: did:t3n:...
TenantClient ready.
Registered z:...:terminal3-dx-demo as contract id 648
```

### Custom contract (Agent Attestation Registry)

First, build the custom contract:
```bash
cd contracts/z-tenant-attest
cargo build --target wasm32-wasip2 --release
ls -lh target/wasm32-wasip2/release/*.wasm
```

Then run the end-to-end demo:
```bash
cd ../../app
export T3N_API_KEY="<your-key>"
npx tsx attest-demo.ts
```

## Contract Deployment

### Reference contract (z-tenant-flight)

```bash
cd contracts/z-tenant-flight
rustup target add wasm32-wasip2
cargo build --target wasm32-wasip2 --release
# Output: target/wasm32-wasip2/release/z_tenant_flight.wasm (194 KB)
```

Registration is handled programmatically in `quickstart.ts`.

### Custom contract (z-tenant-attest)

```bash
cd contracts/z-tenant-attest
rustup target add wasm32-wasip2
cargo build --target wasm32-wasip2 --release
# Output: target/wasm32-wasip2/release/z_tenant_attest.wasm
```

Registration is handled programmatically in `attest-demo.ts`.

## Test Results

| Test | Result |
|------|--------|
| Quickstart authentication | ✅ Passed |
| Contract compilation | ✅ 194 KB WASM, clean build |
| Contract registration | ✅ Contract ID 648 |
| KV map creation | ✅ Private map with correct ACL |
| Reference contract invocation | ⚠️ Blocked by missing Duffel API key |
| Custom contract unit tests | ✅ 9 tests pass (input validation) |
| DX audit | ✅ 2 confirmed bugs, 2 observations |

## Known Issues

### Confirmed Bugs

1. **BUG-001: Quickstart omits mandatory `trustAnchor`** — The official Quickstart code does not include `fetchTrustedManifest()`, but SDK 4.36.0 requires it. [Details](docs/BUGS.md#bug-001)
2. **BUG-002: Setup guide uses obsolete `tenant.me()` namespace** — The docs say `tenant.me()` but SDK 4.36.0 exposes it at `tenant.tenant.me()`. [Details](docs/BUGS.md#bug-002)

### Observations

3. **OBS-003: Reference contract requires unlisted third-party secret** — The Duffel API key prerequisite is not prominently documented in the main walkthrough.
4. **OBS-004: Environment naming inconsistency** — Quickstart uses "testnet" while product pages use "sandbox".

See [docs/BUGS.md](docs/BUGS.md) for full bug reports.

## DX Findings

See [docs/DX_AUDIT.md](docs/DX_AUDIT.md) for the full developer experience audit.

**Key findings:**
- Documentation is not aligned with SDK 4.36.0 at two blocking API points
- The core authenticated path works after applying the two corrections
- Rust contract compilation is clean and deterministic
- The walkthrough should distinguish tenant identity, agent identity, and user authorization more clearly

## Use Case: Agent Attestation Registry

See [docs/USE_CASE.md](docs/USE_CASE.md) for the full use case document.

A custom TEE contract that lets AI agents register and verify identity attestations using only Terminal3's KV-store — no external API key needed. This demonstrates understanding of Terminal3's core value proposition: verifiable agent identity in a TEE environment.

## Screenshots

Screenshots are in the `screenshots/` directory:
- `01-claim-page.png` — API key claim page with DID
- `02-quickstart-output.png` — Quickstart terminal output
- `03-contract-build.png` — Rust contract compilation
- `04-registration-result.png` — Contract registration success

## Reproduction

1. Clone this repo
2. Install dependencies (`cd app && npm install`)
3. Install Rust + WASM target
4. Get your API key from [Terminal3 claim page](https://www.terminal3.io/claim-page)
5. `export T3N_API_KEY="<your-key>"`
6. `npx tsx quickstart.ts` — authenticated connection + reference contract
7. `cd contracts/z-tenant-attest && cargo build --target wasm32-wasip2 --release` — build custom contract
8. `cd ../../app && npx tsx attest-demo.ts` — custom contract end-to-end

## Repository Structure

```
terminal3-adk-bounty/
├── README.md
├── .env.example
├── .gitignore
├── app/
│   ├── package.json
│   ├── quickstart.ts          ← Quickstart + reference contract registration
│   ├── attest-demo.ts         ← Custom contract end-to-end demo
│   ├── invoke.ts             ← Reference contract invocation
│   └── setup-secrets-map.ts   ← KV map ACL setup
├── contracts/
│   ├── z-tenant-flight/       ← Reference contract (Duffel flight booking)
│   │   ├── src/
│   │   ├── wit/
│   │   └── Cargo.toml
│   └── z-tenant-attest/       ← Custom contract (Agent Attestation Registry)
│       ├── src/
│       ├── wit/
│       └── Cargo.toml
├── docs/
│   ├── QUICKSTART.md
│   ├── WALKTHROUGH.md
│   ├── BUGS.md
│   ├── DX_AUDIT.md
│   ├── USE_CASE.md
│   └── REPORT.md
├── logs/
│   ├── contract_build.log
│   ├── quickstart_sanitized.log
│   └── ...
└── screenshots/
```

## Sources

- [Terminal3 Documentation](https://docs.terminal3.io/developers/adk/get-started/quickstart)
- [Superteam Earn Bounty](https://superteam.fun/earn/listing/ai-id)
- [Terminal3 Claim Page](https://www.terminal3.io/claim-page)

---

**Author:** Victor Stanley ([@Stan-lee13](https://github.com/Stan-lee13))
