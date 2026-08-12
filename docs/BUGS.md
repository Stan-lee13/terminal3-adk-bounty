# Confirmed Terminal3 ADK Issues

## BUG-001 — Quickstart omits mandatory `trustAnchor` for SDK 4.36.0

| Field | Finding |
| --- | --- |
| Severity | High |
| Environment | Ubuntu 24.04; Node 22.13.0; `@terminal3/t3n-sdk` 4.36.0 |
| Preconditions | Install the official Quickstart dependencies and copy its `T3nClient` constructor |
| Reproduction | 1. Set `T3N_API_KEY`. 2. Use the official constructor without `trustAnchor`. 3. Run `npx tsx quickstart.ts`. |
| Expected | Client constructs and the handshake begins, as implied by the Quickstart |
| Actual | `T3nConfigError`: `trustAnchor` is required |
| Rate | 1/1 |
| Impact | A new developer is blocked before the first network call |
| Fix | Add `fetchTrustedManifest("testnet")` and `trustAnchor` to the canonical Quickstart code |

The installed SDK README documents the signed trust-manifest path. The explicit unsafe opt-out was not used.

## BUG-002 — Setup guide uses obsolete `tenant.me()` namespace

| Field | Finding |
| --- | --- |
| Severity | Medium |
| Environment | Same as BUG-001 |
| Preconditions | Construct a `TenantClient` using the official setup guide |
| Reproduction | 1. Authenticate. 2. Construct `TenantClient`. 3. Execute `await tenant.me()`. |
| Expected | Tenant identity check succeeds |
| Actual | `TypeError: tenant.me is not a function` |
| Rate | 1/1 |
| Impact | Developers cannot verify tenant management before registration |
| Fix | Update the guide for SDK 4.36.0 to `await tenant.tenant.me()` or publish a compatibility table |

## OBS-003 — Reference contract invocation requires an unlisted third-party secret before runtime success

This is recorded as an observed prerequisite rather than a confirmed platform bug. Registration succeeds, but invocation fails until `z:<tid>:secrets` exists, has contract ID 648 as a reader, and contains `duffel_api_key`. The first invocation produced an access-denied map error. After the map was correctly provisioned, the invocation produced the clearer missing-secret error. The walkthrough should make these prerequisites prominent earlier.

## OBS-004 — Environment naming is inconsistent across public surfaces

The Quickstart uses `setEnvironment("testnet")`, while the current product page and SDK README use `sandbox`. The SDK accepts both environment names, but the relationship and bounty-relevant choice are not explained. This is a documentation clarity issue requiring sponsor confirmation before being classified as a bug.
