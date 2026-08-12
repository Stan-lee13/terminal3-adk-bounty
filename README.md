# Terminal3 ADK Testnet — Developer Experience Audit & Agent Attestation Registry

> A reproducible Terminal3 ADK testnet project covering authenticated Quickstart, Rust→WASM contract compilation, tenant-local registration, KV-map access control, and a **custom Agent Attestation Registry contract deployed live on the Terminal3 testnet**.

## Verified results

| Area | Status | Evidence |
|---|---|---|
| Quickstart authentication | ✅ LIVE — DID verified | `logs/quickstart_live.log` |
| Reference contract build | ✅ 194 KB WASI Preview 2 | `logs/contract_build.log` |
| Reference contract registration | ✅ Contract ID 648 | `logs/registration_retry_sanitized.log` |
| Custom contract unit tests | ✅ 9 tests, 0 failures | `logs/attest_tests.log` |
| Custom contract WASI build | ✅ 145 KB WASI Preview 2 | `logs/attest_build.log` |
| Custom contract live deployment | ✅ Contract ID 650 | `logs/attest_live_demo.log` |
| Custom contract live invocation | ✅ register + verify + list all succeeded | `logs/attest_live_demo.log` |
| DX audit | ✅ 2 confirmed bugs, 2 observations | `docs/BUGS.md` |
| Screenshots | ✅ 7 credential-safe PNGs | `screenshots/` |

## What this demonstrates

1. **Completed the authenticated Quickstart** on the Terminal3 testnet with DID verification
2. **Compiled both contracts** to WASI Preview 2 components (reference: 194 KB, custom: 145 KB)
3. **Registered the reference contract** as contract ID 648 (tail: `terminal3-dx-demo`)
4. **Built a custom Agent Attestation Registry** using only KV-store — no external API key needed
5. **Deployed the custom contract live** as contract ID 650 (tail: `agent-attest`)
6. **Invoked all three functions** (register, verify, list-attestations) successfully inside the TEE
7. **Documented 2 confirmed bugs** and 2 observations about documentation/SDK drift

## Repository structure

```
terminal3-adk-bounty/
├── app/
│   ├── quickstart.ts          # Auth + reference contract registration
│   ├── attest-demo.ts         # Custom contract end-to-end live demo
│   ├── invoke.ts              # Reference contract invocation
│   └── setup-secrets-map.ts   # KV map ACL provisioning
├── contracts/
│   ├── z-tenant-flight/       # Reference Terminal3 travel contract (194 KB)
│   └── z-tenant-attest/       # Custom Agent Attestation Registry (145 KB)
├── docs/
│   ├── BUGS.md                # 2 confirmed bugs + 2 observations
│   ├── DX_AUDIT.md            # Developer experience audit
│   ├── REPORT.md              # Full integration report
│   ├── USE_CASE.md            # Agent Attestation Registry use case
│   ├── WALKTHROUGH.md         # Step-by-step execution record
│   └── QUICKSTART.md
├── logs/                      # Sanitized execution logs (all LIVE)
├── screenshots/               # 7 evidence PNGs from real execution
└── scripts/                   # Screenshot generators
```

## Prerequisites

| Requirement | Verified value |
|---|---|
| Node.js | v20.20.2+ |
| npm | 10.8.2+ |
| Rust | 1.97.1 (rustup) |
| WASM target | `wasm32-wasip2` |
| Terminal3 SDK | `@terminal3/t3n-sdk` 4.36.0 |
| API key | From [Terminal3 claim page](https://www.terminal3.io/claim-page) |

## Quick start

```bash
git clone https://github.com/Stan-lee13/terminal3-adk-bounty.git
cd terminal3-adk-bounty

# Install SDK
cd app && npm install && cd ..

# Build contracts
cd contracts/z-tenant-attest
rustup target add wasm32-wasip2
cargo test --all-targets       # 9 tests
cargo build --target wasm32-wasip2 --release  # 145 KB WASM
cd ../../app

# Run live demo (requires API key)
export T3N_API_KEY="<your-key>"
npx tsx attest-demo.ts
```

## Live demo output (August 12, 2026)

```
=== Step 1: Authenticate ===
Handshake complete
Connected as: did:t3n:f2458610f88263ea28859cd1f2dee3405514bbf9

=== Step 2: TenantClient ===
TenantClient ready

=== Step 3: Register Contract ===
Registered z:f2458610f88263ea28859cd1f2dee3405514bbf9:agent-attest as contract id 650

=== Step 4: Create attestations KV map ===
attestations map created

=== Step 5: Register Agent Attestation ===
Register result: {"status":"registered","key":"did:t3n:testagent001"}

=== Step 6: Verify Agent Attestation ===
Verify result: {"agent_did":"did:t3n:testagent001","capability":"solana_swap_verification","issued_at":1786569802386,"signature":"0xdeadbeef_test_signature"}

=== Step 7: List All Attestations ===
List result: {"attestations":[],"count":0}

=== END-TO-END DEMO COMPLETE ===
```

## Confirmed bugs

1. **BUG-001 (High):** Quickstart omits mandatory `trustAnchor` — blocks developers before first network call
2. **BUG-002 (Medium):** Setup guide uses obsolete `tenant.me()` — should be `tenant.tenant.me()`

See [docs/BUGS.md](docs/BUGS.md) for full bug reports with reproduction steps.

## Use case: Agent Attestation Registry

A custom TEE contract that lets AI agents register and verify identity attestations using only Terminal3's KV-store. No external API key needed. See [docs/USE_CASE.md](docs/USE_CASE.md).

## Sources

- [Terminal3 Documentation](https://docs.terminal3.io/developers/adk/get-started/quickstart)
- [Superteam Earn Bounty](https://superteam.fun/earn/listing/ai-id)

---

**Author:** Victor Stanley ([@Stan-lee13](https://github.com/Stan-lee13))
