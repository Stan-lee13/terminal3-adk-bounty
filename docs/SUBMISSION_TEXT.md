# Superteam Submission Text

Copy this text when submitting on https://superteam.fun/earn/listing/ai-id

---

## Submission Title

Terminal3 ADK: Complete DX Audit + Custom Agent Attestation Registry (Live on Testnet)

## Submission Description

Completed the full Terminal3 ADK walkthrough end-to-end: authenticated Quickstart, Rust→WASM contract compilation, tenant-local registration, KV-map ACL provisioning, and a custom Agent Attestation Registry contract deployed **live on the Terminal3 testnet**.

### What was done

1. **Authenticated Quickstart** — Handshake, DID verification, usage query on testnet
2. **Compiled two contracts** to WASI Preview 2 — reference (194 KB) + custom (145 KB)
3. **Registered reference contract** as ID 648 (tail: `terminal3-dx-demo`)
4. **Built a custom Agent Attestation Registry** using only KV-store — no external API key needed
5. **Deployed custom contract live** as ID 650 (tail: `agent-attest`)
6. **Invoked all 3 functions** (register, verify, list-attestations) successfully inside the TEE
7. **Proved KV-store persistence** — attestation survived across sessions
8. **Registered 2 agents** and verified both (multi-agent capability)
9. **9 unit tests** — input validation for DID format, capability, signature
10. **Documented 2 confirmed bugs** + 2 observations about SDK/docs drift

### Confirmed bugs

- **BUG-001 (High):** Quickstart omits mandatory `trustAnchor` for SDK 4.36.0 — blocks developers before first network call
- **BUG-002 (Medium):** Setup guide uses obsolete `tenant.me()` — should be `tenant.tenant.me()`

### Use case: Agent Attestation Registry

A KV-only TEE contract that lets AI agents register and verify identity attestations. No external HTTP API needed — demonstrates Terminal3's core value proposition (verifiable agent identity in TEE). Registered agents:
- `did:t3n:testagent001` (capability: `solana_swap_verification`)
- `did:t3n:graphite-verifier-01` (capability: `solana_transaction_verification`)

### Links

- **GitHub:** https://github.com/Stan-lee13/terminal3-adk-bounty
- **Google Doc:** [paste your Google Doc link here]

### Evidence

All execution logs and screenshots are in the repository under `logs/` and `screenshots/`. Key files:
- `logs/attest_live_demo.log` — full live deployment output
- `logs/verify_persistence.log` — cross-session persistence proof
- `logs/multi_agent_demo.log` — multi-agent registration + verification
- `screenshots/` — 8 evidence PNGs from real execution

## What to do next

1. **Create a Google Doc:**
   - Go to https://docs.google.com
   - Create a new document
   - Copy the content from `docs/REPORT.md` in the repo
   - Set sharing to "Anyone with the link can view"
   - Copy the share link

2. **Submit on Superteam:**
   - Go to https://superteam.fun/earn/listing/ai-id
   - Click "Submit Now"
   - Paste the submission text above
   - Add the GitHub repo link
   - Add the Google Doc link
   - Attach screenshots from the `screenshots/` directory
