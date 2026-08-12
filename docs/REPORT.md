# Terminal3 ADK Testnet — Current Developer Experience and Integration Report

**Author:** Victor Stanley

## Executive summary

This repository evaluates the current Terminal3 ADK developer experience through a verified testnet Quickstart, a reference Rust contract build and registration, a contract-scoped secrets-map setup, and a custom Agent Attestation Registry implementation. The reference contract authenticated successfully, compiled to a 194 KB WASI Preview 2 component, and registered as contract ID **648** under the tenant-local name `terminal3-dx-demo`.

The custom contract is now syntactically compatible with the current WIT parser, passes **9 unit tests**, and builds successfully to a 145 KB WASI Preview 2 component. Its live registration and invocation are prepared in `app/attest-demo.ts` but are not claimed as completed in the current evidence set. This distinction corrects the earlier report, which described the custom path as designed or end-to-end without separating local validation from live deployment.

## Current status

| Requirement or deliverable | Current status | Evidence |
|---|---|---|
| Agent credential and DID | Completed by user; credential excluded | Authenticated DID in sanitized logs |
| Quickstart | Completed | `logs/quickstart_retry_sanitized.log` |
| Reference Rust build | Completed; approximately 194 KB | `logs/contract_build.log` |
| Reference contract registration | Completed; contract ID 648 | `logs/registration_retry_sanitized.log` |
| Reference secrets-map ACL | Completed | `app/setup-secrets-map.ts` and invocation progression |
| Reference invocation | Partial; blocked by missing Duffel secret | `screenshots/04_invocation_blocker.png` |
| Custom contract implementation | Completed | `contracts/z-tenant-attest/` |
| Custom unit tests | Completed; 9 passed | `logs/attest_tests.log` |
| Custom WASI release build | Completed; approximately 145 KB | `logs/attest_build.log` |
| Custom live registration/demo | Prepared, not yet evidenced | `app/attest-demo.ts` |
| Screenshot evidence | Completed as credential-safe evidence cards | `screenshots/` |
| DX audit | Completed | `docs/BUGS.md`, `docs/DX_AUDIT.md` |
| GitHub synchronization | Current files committed and pushed to `main` | Repository commit history |
| Public Google Doc | Not completed | Workspace connection was unavailable |

## Verified reference workflow

The Quickstart initially exposed a documentation/SDK mismatch: SDK 4.36.0 requires a signed `trustAnchor`, but the public Quickstart omits it. Adding `fetchTrustedManifest("testnet")` allowed the handshake to complete. The returned DID matched the user-provided claimed DID, and the initial usage response reported 20,000,000,000 available test-credit units.

The reference contract compiled with `cargo build --target wasm32-wasip2 --release`. It registered successfully as contract ID 648 with tail `terminal3-dx-demo` and version `0.1.0`. The current SDK also exposed a second documentation mismatch: the setup guide calls `tenant.me()`, while the working current namespace is `tenant.tenant.me()`.

The private `secrets` map was created with contract 648 as explicit reader and writer. Invocation first failed at the map ACL boundary; after the ACL was corrected, it reached the contract and returned `duffel_api_key not found in z:<tid>:secrets`. This confirms that the access-control correction worked. The separate Duffel credential was intentionally not supplied, and no external booking or payment was attempted.

## Custom Agent Attestation Registry

The custom contract is a KV-only registry for agent attestations. It stores a DID, capability, issue timestamp, and signature in a private tenant-local `attestations` map. It uses no external HTTP API or third-party secret.

| Export | Behavior |
|---|---|
| `register` | Validates and stores an attestation |
| `verify` | Retrieves an attestation by agent DID |
| `list-attestations` | Scans and returns up to 50 attestations |

The export is named `list-attestations` because bare `list` is reserved by the current WIT parser. The code and demo were updated together. Local validation now reports 9 passing unit tests and a successful 145 KB WASI release build. The end-to-end live demo remains a prepared next step rather than an asserted result.

## Screenshot evidence

The repository contains five tracked PNG assets. They are credential-safe evidence cards generated from sanitized execution logs, not fabricated Terminal3 dashboard screenshots.

| File | Evidence |
|---|---|
| `00_evidence_contact_sheet.png` | Four-panel overview |
| `01_quickstart_authenticated.png` | Authenticated Quickstart and DID match |
| `02_contract_build.png` | Reference Rust/WASI build |
| `03_contract_registered.png` | Reference registration and contract ID 648 |
| `04_invocation_blocker.png` | Reference runtime missing-secret result |

The screenshot inventory is maintained in `screenshots/README.md`.

## DX findings

Two confirmed documentation/SDK issues remain central. First, the Quickstart omits the signed trust-manifest configuration required by SDK 4.36.0. Second, the setup guide uses the obsolete `tenant.me()` namespace. Two additional observations concern the late disclosure of the reference contract’s third-party Duffel prerequisite and inconsistent use of `testnet` versus `sandbox` across public surfaces.

## Recommendations

The official Quickstart should include `fetchTrustedManifest` and `trustAnchor` in its canonical code block. The setup guide should use `tenant.tenant.me()` or publish an SDK compatibility matrix. The walkthrough should introduce KV-map creation, required secret names, egress authorization, and third-party credentials before the first invocation attempt. Finally, the custom-contract guide should specify that WIT reserved words such as `list` must be avoided in exported function names.

## Conclusion

The current repository is synchronized with the latest source and evidence state. It demonstrates a completed authenticated reference workflow, a completed reference registration, a correctly bounded missing-secret result, and a custom contract that passes local tests and builds as WASI Preview 2. It does not overstate the custom contract as live-deployed, and it does not claim a public Google Doc that was not created.

## References

[1]: https://docs.terminal3.io/developers/adk/get-started/quickstart "Terminal3 ADK Quickstart"
[2]: https://docs.terminal3.io/developers/adk/get-started/prerequisites/set-up-dev-env "Terminal3 development environment setup"
[3]: https://docs.terminal3.io/developers/adk/get-started/walkthrough/build-contract "Terminal3 contract build"
[4]: https://docs.terminal3.io/developers/adk/get-started/walkthrough/register-contract "Terminal3 contract registration"
[5]: https://docs.terminal3.io/developers/adk/tips/create-kv-maps "Terminal3 tenant KV maps"
[6]: https://docs.terminal3.io/developers/adk/tips/seed-api-key "Terminal3 secrets map"
[7]: https://superteam.fun/earn/listing/ai-id "Superteam bounty listing"
