# Screenshots

Place the following screenshots here before submission:

| File | Description |
|------|-------------|
| 01-claim-page.png | Terminal3 claim page showing DID and API key |
| 02-quickstart-output.png | Terminal output of successful Quickstart (handshake + DID + usage) |
| 03-contract-build.png | Rust contract compilation output (cargo build) |
| 04-registration-result.png | Contract registration success (contract ID 648) |
| 05-attest-demo.png | Agent Attestation Registry end-to-end demo output |
| 06-usage-credits.png | Terminal3 portal showing credits balance |

## How to capture

1. Navigate to https://www.terminal3.io/claim-page — capture the claim page
2. Run `npx tsx quickstart.ts` — capture the terminal output
3. Run `cargo build --target wasm32-wasip2 --release` — capture the build
4. Registration output appears in the quickstart terminal — capture it
5. Run `npx tsx attest-demo.ts` — capture the full demo output
6. Check the Terminal3 portal/dashboard for credits balance
