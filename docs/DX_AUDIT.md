# Developer Experience Audit

## Summary

The core authenticated path is workable after two corrections that are not present in the current public walkthrough. The strongest positive result is that the platform returns a useful DID and usage response, and the Rust contract can be compiled and registered with a conventional Cargo workflow. The strongest negative result is that the first-run documentation is not aligned with SDK 4.36.0 at two blocking API points.

| Area | Assessment | Evidence |
| --- | --- | --- |
| Documentation accuracy | Mixed; two blocking mismatches confirmed | `docs/BUGS.md` |
| Installation | Good after Rust target setup; standard npm/Cargo | `logs/contract_build.log` |
| Authentication | Works with signed trust manifest | `logs/quickstart_retry_sanitized.log` |
| SDK ergonomics | Good concepts, but namespace drift | `tenant.tenant.me()` correction |
| Contract build | Successful and deterministic | 194 KB WASM artifact |
| Registration | Successful; returns numeric contract ID | Contract ID 648 |
| Runtime setup | Requires explicit map ACL and third-party secret | Invocation logs |
| Error recovery | Errors are actionable once reached, but prerequisites are late | Missing-secret and access-denied errors |

## Time-to-first-success

The first successful authenticated call required installing the SDK, adding the signed trust manifest, and running the script. The first contract registration required installing Rust, adding `wasm32-wasip2`, compiling the reference repository, adapting the TenantClient verification namespace, and running registration. The first runtime invocation required a private secrets map and a separate Duffel API key; the latter was intentionally not supplied.

## Recommendations

The documentation should be version-pinned or generated from the SDK’s public types. A preflight command should validate trust-anchor configuration, tenant namespace, Rust target, WASM artifact, map ACL, and required secret names before charging a contract execution. The walkthrough should also distinguish tenant identity, agent identity, and user authorization in a single diagram.

## Current custom-contract validation

The latest repository state includes a custom Agent Attestation Registry under `contracts/z-tenant-attest/`. Its WIT interface now exports `list-attestations` rather than bare `list`, because `list` is reserved by the current WIT parser. The Rust implementation and `app/attest-demo.ts` use the corrected name consistently.

The current validation run passed **9 unit tests** and produced a successful `wasm32-wasip2` release build of approximately **145 KB**. The build emits one non-blocking dead-code warning for `VerifyResp`. These results are recorded in `logs/attest_tests.log` and `logs/attest_build.log`. Live registration and invocation of the custom artifact remain prepared but not evidenced.
