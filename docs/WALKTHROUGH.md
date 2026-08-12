# Terminal3 ADK Walkthrough — Current Execution Record

## Scope and status model

This document distinguishes actions verified against the Terminal3 testnet from local source validation and prepared-but-not-yet-executed live operations. It is synchronized with the current repository tree and commit history.

## Step 1: Claim API key and credits

**Status: Completed by the user.** The user obtained a Terminal3 API key and a DID in the `did:t3n:...` format. The credential is not stored in the repository. Because it was later pasted into chat, it should be rotated or regenerated before reuse.

## Step 2: Run the authenticated Quickstart

**Status: Completed.** The working script is `app/quickstart.ts`.

```bash
cd app
npm install
export T3N_API_KEY="<your-key>"
npx tsx quickstart.ts
```

The installed SDK is `@terminal3/t3n-sdk` 4.36.0. The public Quickstart required a correction: the client must receive a signed trust manifest.

```typescript
const trustAnchor = await fetchTrustedManifest("testnet");
const t3n = new T3nClient({ trustAnchor, wasmComponent, handlers });
```

The handshake completed, the authenticated DID matched the claimed DID, and the initial usage response reported 20,000,000,000 available test-credit units. Evidence is in `logs/quickstart_retry_sanitized.log` and `screenshots/01_quickstart_authenticated.png`.

## Step 3: Set up the development environment

**Status: Completed.** Rust and the `wasm32-wasip2` target were installed. The setup guide contained a second SDK drift: `tenant.me()` is not present on the current client; the working call is `tenant.tenant.me()`.

## Step 4: Build the reference contract

**Status: Completed.** The reference `z-tenant-flight` contract was built with:

```bash
cd contracts/z-tenant-flight
cargo build --target wasm32-wasip2 --release
```

The optimized artifact was approximately 194 KB. Evidence is in `logs/contract_build.log` and `screenshots/02_contract_build.png`.

## Step 5: Register the reference contract

**Status: Completed on the testnet.** `app/quickstart.ts` registered the reference artifact with tail `terminal3-dx-demo`, version `0.1.0`, and returned contract ID **648**. The canonical name was:

```text
z:f2458610f88263ea28859cd1f2dee3405514bbf9:terminal3-dx-demo
```

Evidence is in `logs/registration_retry_sanitized.log` and `screenshots/03_contract_registered.png`.

## Step 6: Configure the reference contract’s secrets map

**Status: Map completed; secret intentionally not populated.** `app/setup-secrets-map.ts` created a private `secrets` map with contract ID 648 as the only reader and writer. The separate `duffel_api_key` was not supplied, so no third-party credential was written.

## Step 7: Invoke the reference contract

**Status: Partially completed.** `app/invoke.ts` reached the registered TEE contract. Before the map existed, the call failed with access denied. After the correct ACL was created, the call progressed to the expected missing-secret error:

```text
duffel_api_key not found in z:<tid>:secrets
```

No external booking, payment, or personal-data flow was attempted. Evidence is in `screenshots/04_invocation_blocker.png`.

## Step 8: Implement the custom Agent Attestation Registry

**Status: Source implementation completed; live deployment not yet evidenced.** The custom contract is under `contracts/z-tenant-attest/` and uses only the tenant context, logging, and KV-store host interfaces. It exposes:

| Function | Purpose |
|---|---|
| `register` | Store a DID, capability, issue time, and signature |
| `verify` | Retrieve an attestation by DID |
| `list-attestations` | Scan and return up to 50 stored attestations |

The WIT export is intentionally named `list-attestations`; the bare WIT identifier `list` is reserved by the current parser. `app/attest-demo.ts` matches this export name.

## Step 9: Test and build the custom contract

**Status: Completed locally.** The current repository was validated with:

```bash
cd contracts/z-tenant-attest
cargo test --all-targets
cargo build --target wasm32-wasip2 --release
```

The result was **9 tests passed, 0 failed**, followed by a successful 145 KB release WASM build. The build emits one non-blocking dead-code warning for the unused `VerifyResp` type. Logs are in `logs/attest_tests.log` and `logs/attest_build.log`.

## Step 10: Custom live demo boundary

**Status: Prepared, not yet executed on the live tenant.** `app/attest-demo.ts` registers the custom artifact, creates the private `attestations` map, and invokes `register`, `verify`, and `list-attestations`. The current evidence proves source correctness, unit tests, and release compilation; it does not claim that this custom artifact has already been registered or invoked on the live tenant.

## Screenshot evidence

The tracked files are listed in `screenshots/README.md`. The five PNGs are credential-safe evidence cards generated from sanitized logs. They are not private Terminal3 dashboard captures.

## Summary

| Step | Current status | Evidence |
|---|---|---|
| Claim credential | Completed by user | Authenticated DID in sanitized logs |
| Quickstart | Completed | Quickstart log and screenshot |
| Reference build | Completed | Build log and screenshot |
| Reference registration | Completed; contract ID 648 | Registration log and screenshot |
| Reference secrets map | Completed | `setup-secrets-map.ts` execution |
| Reference invocation | Partial; missing Duffel key | Invocation screenshot |
| Custom source implementation | Completed | `contracts/z-tenant-attest/` |
| Custom unit tests | Completed; 9 passed | `logs/attest_tests.log` |
| Custom WASI build | Completed; 145 KB | `logs/attest_build.log` |
| Custom live deployment | Not yet evidenced | `app/attest-demo.ts` prepared |
| DX audit | Completed | `docs/BUGS.md`, `docs/DX_AUDIT.md` |
