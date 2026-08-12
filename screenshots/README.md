# Screenshot Evidence Inventory

This directory contains the credential-safe screenshot evidence currently tracked on the repository’s `main` branch. The images were generated from verified sanitized execution logs and are labeled accordingly; they are not fabricated Terminal3 dashboard captures.

| File | Evidence | Provenance |
|---|---|---|
| `00_evidence_contact_sheet.png` | Four-panel overview of the execution evidence | Generated from the four evidence cards |
| `01_quickstart_authenticated.png` | Successful handshake, authenticated DID match, and test-credit balance | `logs/quickstart_retry_sanitized.log` |
| `02_contract_build.png` | Reference Rust contract compiled for `wasm32-wasip2` | `logs/contract_build.log` |
| `03_contract_registered.png` | TenantClient readiness and reference contract ID 648 | `logs/registration_retry_sanitized.log` |
| `04_invocation_blocker.png` | Reference contract reached runtime and stopped at the missing Duffel secret | Verified invocation result summarized without credentials |

The custom Agent Attestation Registry has separate current-state evidence in `logs/attest_tests.log` and `logs/attest_build.log`. A dashboard screenshot of the user’s private claim page is not included because it was not available for safe publication.

## Viewing the images

Open the [GitHub screenshots directory](https://github.com/Stan-lee13/terminal3-adk-bounty/tree/main/screenshots) to view the files directly. The images are also linked from the root README and the submission report.
