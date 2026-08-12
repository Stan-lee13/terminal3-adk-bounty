# Developer Experience Audit

## Summary

The core authenticated path is workable after corrections that are not present in the current public walkthrough. The strongest positive result is that the platform returns a useful DID and usage response, and the Rust contract can be compiled and registered with a conventional Cargo workflow. The strongest negative result is that the first-run documentation is not aligned with SDK 4.36.0 at multiple blocking API points, and a CRITICAL silent version fallback bug was discovered.

| Area | Assessment | Evidence |
| --- | --- | --- |
| Documentation accuracy | Mixed — 12 bugs found across 4 severity levels | `docs/BUGS.md` |
| Installation | Good after Rust target setup; standard npm/Cargo | `logs/contract_build.log` |
| Authentication | Works with signed trust manifest (but trustAnchor missing from docs) | `logs/quickstart_retry_sanitized.log` |
| SDK ergonomics | Good concepts, but namespace drift and no typed errors | `logs/edge_case_tests.log` |
| Contract build | Successful and deterministic | 194 KB + 145 KB WASM artifacts |
| Registration | Successful; returns numeric contract ID | Contract IDs 648, 650 |
| Runtime setup | Requires explicit map ACL and third-party secret | Invocation logs |
| Error recovery | Errors are generic RpcError — no typed subclasses | `logs/edge_case_tests.log` |
| Version safety | CRITICAL — silent fallback to latest version | `logs/version_fallback_test.log` |
| WASM validation | HIGH — no validation at registration time | `logs/invalid_wasm_invoke.log` |
| WIT toolchain | Undocumented reserved keywords (22 words tested) | wit-bindgen 0.49.0 |

## Time-to-first-success

The first successful authenticated call required installing the SDK, adding the signed trust manifest, and running the script. The first contract registration required installing Rust, adding `wasm32-wasip2`, compiling the reference repository, adapting the TenantClient verification namespace, and running registration. The first runtime invocation required a private secrets map and a separate Duffel API key; the latter was intentionally not supplied.

## Recommendations

1. **Pin documentation to SDK types** — the Quickstart should be generated from or validated against the SDK's public TypeScript types to prevent drift
2. **Validate WASM at registration** — check the WASM magic number before accepting a contract (BUG-002)
3. **Validate version at execution** — reject non-existent versions instead of silently falling back (BUG-001)
4. **Add typed error classes** — VersionConflictError, ContractNotFoundError, MapExistsError (BUG-006)
5. **Document WIT reserved keywords** — 22 words that cannot be used as function names (BUG-004)
6. **Make `readers` required** on MapCreateInput to prevent deny-all maps (BUG-007)
7. **Add input validation** to reference contract functions (BUG-008)
8. **Document the full TenantClient API** — 17+ methods are undocumented (BUG-009)

## Custom contract validation

The custom Agent Attestation Registry under `contracts/z-tenant-attest/` exports `list-attestations` (not `list`, which is a reserved WIT keyword). The Rust implementation and `app/attest-demo.ts` use the corrected name consistently.

- **9 unit tests** — all pass, 0 failures
- **145 KB WASI Preview 2** release build
- **Live deployment** — Contract ID 650 on Terminal3 testnet
- **Live invocation** — all 3 functions (register, verify, list-attestations) succeeded
- **KV persistence** — data verified across sessions
- **Multi-agent** — 2 agents registered and verified

Results recorded in `logs/attest_tests.log`, `logs/attest_build.log`, `logs/attest_live_demo.log`, `logs/verify_persistence.log`, and `logs/multi_agent_demo.log`.
