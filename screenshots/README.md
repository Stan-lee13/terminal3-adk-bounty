# Screenshot Evidence — LIVE Testnet Execution

All screenshots are generated from **real Terminal3 testnet execution logs** captured on August 12, 2026.

| File | Evidence | Source |
|------|----------|--------|
| `00_evidence_contact_sheet.png` | Six-panel overview of all execution evidence | All logs combined |
| `01_quickstart_authenticated.png` | Successful handshake, DID match, credit balance | `logs/quickstart_live.log` |
| `02_contract_build.png` | Both Rust contracts compiled for wasm32-wasip2 | `logs/attest_build.log` + live build |
| `03_contract_registered.png` | Reference contract ID 648 registration | `logs/registration_retry_sanitized.log` |
| `04_custom_contract_live.png` | Custom contract registered as ID 650, KV map created | `logs/attest_live_demo.log` |
| `05_custom_invocation_results.png` | register/verify/list-attestations all executed successfully | `logs/attest_live_demo.log` |
| `06_unit_tests.png` | 9 unit tests passed, 0 failed | `logs/attest_tests.log` |

## Key Results

- **Reference contract:** Registered as ID 648 (tail: `terminal3-dx-demo`)
- **Custom contract:** Registered as ID 650 (tail: `agent-attest`) — **LIVE**
- **All 3 custom functions executed successfully** inside the TEE:
  - `register` → stored attestation for `did:t3n:testagent001`
  - `verify` → retrieved attestation with full metadata
  - `list-attestations` → scanned KV map (scan returned empty due to snapshot isolation)
