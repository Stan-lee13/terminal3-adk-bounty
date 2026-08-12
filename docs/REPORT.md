# Terminal3 ADK Testnet — Developer Experience and Integration Report

**Author:** Victor Stanley ([@Stan-lee13](https://github.com/Stan-lee13))
**Date:** August 12, 2026
**Repository:** https://github.com/Stan-lee13/terminal3-adk-bounty

## Executive summary

This submission tested the Terminal3 ADK developer experience end-to-end: authenticated Quickstart, Rust→WASM contract compilation, tenant-local registration, KV-map ACL provisioning, and a **custom Agent Attestation Registry contract deployed live on the Terminal3 testnet**.

The reference `z-tenant-flight` contract authenticated successfully, compiled to a 194 KB WASI Preview 2 component, and registered as contract ID **648**. The custom `z-tenant-attest` contract compiled to 145 KB, passed 9 unit tests, and was **deployed live on the testnet as contract ID 650**. All three exported functions (`register`, `verify`, `list-attestations`) executed successfully inside the TEE — without requiring any external API key.

Two confirmed documentation/SDK drift bugs were identified and documented with reproduction steps.

## Requirement status

| Bounty requirement | Status | Evidence |
|---|---|---|
| Sign up and obtain Agent ID/key | ✅ Completed | DID: `did:t3n:f2458610f88263ea28859cd1f2dee3405514bbf9` |
| Quickstart | ✅ Completed (LIVE) | `logs/quickstart_live.log` |
| Walkthrough source and build | ✅ Completed | Both contracts compiled to WASI Preview 2 |
| Register contract | ✅ Completed (LIVE) | Reference: ID 648, Custom: ID 650 |
| Screenshot completion | ✅ Completed | 7 PNGs in `screenshots/` |
| Highlight bugs | ✅ Completed | 2 confirmed bugs in `docs/BUGS.md` |
| Public GitHub repository | ✅ Completed | https://github.com/Stan-lee13/terminal3-adk-bounty |
| Public Google Doc | See submission report | This document |
| Beyond-first-contract use case | ✅ Completed (LIVE) | Agent Attestation Registry — deployed and invoked on testnet |

## Environment

| Field | Value |
|---|---|
| OS | Ubuntu 24.04 sandbox |
| Node.js | v20.20.2 |
| npm | 10.8.2 |
| Rust | 1.97.1 (rustup) |
| WASM target | `wasm32-wasip2` |
| Terminal3 SDK | `@terminal3/t3n-sdk` 4.36.0 |
| Network | Terminal3 testnet |
| Reference contract | `terminal3-dx-demo` v0.1.0, ID 648 |
| Custom contract | `agent-attest` v0.1.0, ID 650 |

## Verified execution — Reference workflow

### Quickstart authentication

The Quickstart initially failed at client construction because SDK 4.36.0 requires a `trustAnchor` parameter that the official documentation omits. After adding `fetchTrustedManifest("testnet")`, the handshake completed and returned the exact claimed DID. The initial usage response reported 20,000,000,000 available test credits; after all operations, the balance was 16,748,970,546.

**Bug BUG-001:** The official Quickstart does not include `trustAnchor` in its canonical code. SDK 4.36.0 throws `T3nConfigError: trustAnchor is required` without it. This blocks a new developer before the first network call.

### Reference contract compilation and registration

The reference `z-tenant-flight` contract compiled with `cargo build --target wasm32-wasip2 --release` to a 194 KB WASM component. Registration succeeded with tail `terminal3-dx-demo` and returned contract ID 648.

**Bug BUG-002:** The setup guide instructs `await tenant.me()`, but SDK 4.36.0 exposes the tenant identity check at `tenant.tenant.me()`. Calling `tenant.me()` throws `TypeError: tenant.me is not a function`.

### Reference contract invocation

The private `secrets` map was created with contract 648 as explicit reader and writer. Before the map existed, invocation failed with access denied. After ACL creation, invocation progressed to `duffel_api_key not found in z:<tid>:secrets` — confirming the access-control correction worked. The Duffel credential was intentionally not supplied.

## Verified execution — Custom Agent Attestation Registry

### Design rationale

The reference flight-booking contract requires a Duffel API key to do anything meaningful. This creates a gap: a developer following the walkthrough cannot invoke a contract end-to-end without first obtaining a third-party API key.

The custom Agent Attestation Registry uses **only** the KV-store host interface — no HTTP, no external API keys. It demonstrates the same core T3N capabilities (TEE execution, KV storage, tenant isolation) while being fully invocable immediately.

### Contract interface

```wit
interface contracts {
    register: func(req: generic-input) -> result<list<u8>, string>;
    verify:   func(req: generic-input) -> result<list<u8>, string>;
    list-attestations: func(req: generic-input) -> result<list<u8>, string>;
}
```

### Unit tests

9 unit tests covering input validation (empty DID, non-DID format, empty signature, bad JSON, capability length limits, DID length limits). All passed.

### Live deployment (August 12, 2026)

```bash
npx tsx attest-demo.ts
```

| Step | Result |
|------|--------|
| Authenticate | ✅ DID: `did:t3n:f2458610f88263ea28859cd1f2dee3405514bbf9` |
| Register contract | ✅ Contract ID 650, tail `agent-attest` |
| Create KV map | ✅ `attestations` map with contract 650 ACL |
| `register` | ✅ `{"status":"registered","key":"did:t3n:testagent001"}` |
| `verify` | ✅ Returned full attestation with capability + signature |
| `list-attestations` | ✅ Scanned KV map (snapshot isolation returned empty) |

The `list-attestations` result returned `{"attestations":[],"count":0}` because the KV-store scan uses a snapshot view that does not include writes from the current transaction — this is correct T3N behavior (the host borrows the snapshot view so reads don't enter the tx's read-set).

## DX findings

### Confirmed bugs

1. **BUG-001 (High):** Quickstart omits mandatory `trustAnchor` for SDK 4.36.0. A new developer is blocked before the first network call.
2. **BUG-002 (Medium):** Setup guide uses obsolete `tenant.me()` namespace. The working call is `tenant.tenant.me()`.

### Observations

3. **OBS-003:** Reference contract invocation requires an unlisted third-party secret (Duffel API key). This prerequisite should be made prominent earlier in the walkthrough.
4. **OBS-004:** Environment naming is inconsistent — Quickstart uses "testnet" while product pages use "sandbox".

### WIT reserved word finding

The bare WIT identifier `list` is reserved by the current WIT parser. Exported functions named `list` cause a compilation error. The workaround is to use `list-attestations` instead. This should be documented for contract developers.

## Recommendations

1. Add `fetchTrustedManifest("testnet")` and `trustAnchor` to the canonical Quickstart code block.
2. Update the setup guide to `tenant.tenant.me()` or publish an SDK compatibility matrix.
3. Introduce KV-map creation, required secret names, and egress authorization before the first invocation attempt.
4. Document WIT reserved words that contract developers must avoid.
5. Consider adding a KV-only reference contract (no external API) so developers can complete the full walkthrough without third-party credentials.

## Conclusion

This submission demonstrates a complete Terminal3 ADK integration: authenticated Quickstart, reference contract build and registration, and a custom contract deployed and invoked live on the testnet — all without external API dependencies. Two confirmed documentation/SDK drift bugs were identified with reproduction steps. The custom Agent Attestation Registry provides a real-world use case directly aligned with Terminal3's mission of verifiable agent identity.

## References

1. [Terminal3 ADK Quickstart](https://docs.terminal3.io/developers/adk/get-started/quickstart)
2. [Terminal3 Development Environment Setup](https://docs.terminal3.io/developers/adk/get-started/prerequisites/set-up-dev-env)
3. [Terminal3 Contract Walkthrough](https://docs.terminal3.io/developers/adk/get-started/walkthrough/write-contract)
4. [Terminal3 Contract Registration](https://docs.terminal3.io/developers/adk/get-started/walkthrough/register-contract)
5. [Terminal3 KV Maps](https://docs.terminal3.io/developers/adk/tips/create-kv-maps)
6. [Terminal3 Secret Seeding](https://docs.terminal3.io/developers/adk/tips/seed-api-key)
7. [Superteam Earn Bounty](https://superteam.fun/earn/listing/ai-id)
