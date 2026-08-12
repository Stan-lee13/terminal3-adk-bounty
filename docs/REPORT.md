# Terminal3 ADK Testnet — Developer Experience & Integration Report

**Author:** Victor Stanley

## Executive summary

This submission tested the current Terminal3 ADK developer experience rather than merely reproducing a tutorial. The authenticated Quickstart completed successfully on the testnet, the reference Rust contract compiled into a WASI Preview 2 component, and the component registered successfully under the authenticated tenant as contract ID **648**. A private secrets map was also provisioned with the contract’s explicit ACL.

The audit identified a significant documentation/SDK drift: the Quickstart sample constructs `T3nClient` without the `trustAnchor` now required by SDK 4.36.0, while the installed package rejects that configuration before the handshake. The current package README provides the signed `fetchTrustedManifest` path. The audit also found a second documentation/API drift: the setup guide instructs developers to call `tenant.me()`, but the installed SDK exposes the check at `tenant.tenant.me()`.

The final invocation reached contract execution and failed deterministically because the reference travel contract’s `duffel_api_key` secret was not populated. This is an expected environment prerequisite, not evidence of a platform outage. No mainnet operation, payment, real booking, wallet transfer, or bounty submission was attempted.

## Screenshot evidence

The repository now includes a four-image evidence set and a contact sheet under `screenshots/`. These are credential-safe evidence cards generated from the verified sanitized execution logs, not fabricated browser screenshots. Each card names its source log and shows only the relevant success or blocker state.

| Screenshot | Evidence shown | Source |
| --- | --- | --- |
| `01_quickstart_authenticated.png` | Handshake, authenticated DID match, and test-credit balance | `logs/quickstart_retry_sanitized.log` |
| `02_contract_build.png` | Rust compilation for `wasm32-wasip2` and optimized completion | `logs/contract_build.log` |
| `03_contract_registered.png` | TenantClient readiness, canonical contract name, and contract ID 648 | `logs/registration_retry_sanitized.log` |
| `04_invocation_blocker.png` | Runtime reached the TEE contract and stopped at the missing Duffel secret | Verified invocation result |
| `00_evidence_contact_sheet.png` | Combined four-panel overview for the bounty form | Generated from the four cards |

These cards are intentionally labeled “sanitized evidence screenshot” so a reviewer can distinguish them from screenshots captured directly from the Terminal3 dashboard. The original browser/dashboard screenshots were not available in the workspace, and none has been invented.

## Requirement status

| Bounty requirement | Status | Evidence |
| --- | --- | --- |
| Sign up and obtain Agent ID/key | Completed by user; key not stored in repo | User-provided DID; authenticated session |
| Quickstart | Completed | `logs/quickstart_retry_sanitized.log` |
| Walkthrough source and build | Completed | `logs/contract_build.log`; generated WASM |
| Register Rust contract | Completed | `logs/registration_retry_sanitized.log`; contract ID 648 |
| Screenshot completion | Partial | Browser screenshots exist locally; final curated set not yet packaged |
| Highlight bugs | Completed | `docs/BUGS.md` |
| Public GitHub repository | Not yet completed | Requires final review and explicit publication step |
| Public Google Doc | Not yet completed | Report is prepared locally |
| Beyond-first-contract use case | Partial | Secure tenant secret-map workflow demonstrated; full travel call blocked by missing Duffel key |

## Environment

| Field | Value |
| --- | --- |
| OS | Ubuntu 24.04 sandbox |
| Node/npm | Node 22.13.0; npm 10.9.2 |
| SDK | `@terminal3/t3n-sdk` 4.36.0 |
| Rust | rustc/cargo 1.97.1 |
| Target | `wasm32-wasip2` |
| Network | Terminal3 testnet |
| Contract | `terminal3-dx-demo`, version `0.1.0`, ID 648 |

## Verified execution

The Quickstart initially failed at client construction because SDK 4.36.0 requires a trust anchor. After adding the signed-manifest configuration, the handshake completed and returned the exact claimed DID. Usage returned 20,000,000,000 available test-credit units on the first successful run. A later run showed 18,619,810,421 units, reflecting testnet charges from the subsequent operations.

The Rust reference project compiled successfully with `cargo build --target wasm32-wasip2 --release`. The resulting component was approximately 194 KB. Registration succeeded using the tenant client and returned contract ID 648. The tenant verification also passed after adapting the documentation’s `tenant.me()` call to the installed SDK’s `tenant.tenant.me()` namespace.

The private `secrets` map was created with `writers: { only: [648] }` and `readers: { only: [648] }`. Before this map existed, invocation failed with an access-denied error. After creation, invocation progressed further and failed with the precise contract error `duffel_api_key not found in z:<tid>:secrets`, proving that the ACL correction was effective.

## DX findings

The strongest finding is that the official Quickstart is not sufficient for the currently published SDK. It must show the signed trust-manifest configuration, or developers encounter a client-construction error before any network call. The setup guide also uses an outdated namespace for the tenant identity check. These are high-impact issues because both appear before the developer reaches contract registration.

A secondary issue is environment naming drift. The official Quickstart calls `setEnvironment("testnet")`, while the current product page and SDK README emphasize `sandbox`. The installed SDK accepts both, but the documentation should explain their relationship and identify which one is intended for this bounty.

The reference contract’s runtime prerequisites are conceptually documented, but the end-to-end path requires a third-party Duffel credential and host authorization. The registration step does not create maps, seed secrets, or grant egress; this separation is correct but should be made more prominent in the main walkthrough.

## Additional use case

The additional functionality implemented here is a secure tenant deployment workflow: compile a Rust/WASM contract, register it, create a contract-scoped private secrets map, and verify the contract’s access boundary through controlled invocation. This demonstrates a meaningful Terminal3 capability beyond authentication alone, while intentionally stopping before any external booking or payment action.

## Recommendations

The Quickstart should add `fetchTrustedManifest` and `trustAnchor` to its canonical code block. The setup guide should call `tenant.tenant.me()` for SDK 4.36.0 or provide a compatibility matrix. The docs should include a one-command preflight that verifies the Rust target, WASM artifact, tenant client, contract ID, map ACL, and required secrets. Finally, the walkthrough should label the Duffel API key and user-grant steps as mandatory prerequisites for a successful outbound HTTP invocation.

## Conclusion

This is a technically useful, evidence-backed submission foundation. It exceeds a basic tutorial completion by identifying two reproducible documentation/API mismatches, building the real Rust component, registering it on testnet, provisioning its contract-scoped secret boundary, and documenting the exact remaining blocker. It is **not ready to submit publicly** until the repository is reviewed, screenshots are curated, a public GitHub URL is created, and the report is copied to a public Google Doc if required by the bounty.

## References

[1]: https://superteam.fun/earn/listing/ai-id "Superteam Earn bounty listing"
[2]: https://docs.terminal3.io/developers/adk/get-started/quickstart "Terminal3 ADK Quickstart"
[3]: https://docs.terminal3.io/developers/adk/get-started/prerequisites/set-up-dev-env "Terminal3 development environment setup"
[4]: https://docs.terminal3.io/developers/adk/get-started/walkthrough/build-contract "Terminal3 contract build"
[5]: https://docs.terminal3.io/developers/adk/get-started/walkthrough/register-contract "Terminal3 contract registration"
[6]: https://docs.terminal3.io/developers/adk/tips/create-kv-maps "Terminal3 tenant KV maps"
[7]: https://docs.terminal3.io/developers/adk/tips/seed-api-key "Terminal3 secrets map"
