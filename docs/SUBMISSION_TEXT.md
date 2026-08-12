# Superteam Submission Text

## Title

Terminal3 ADK — Comprehensive SDK Audit with Custom Contract Deployment and 12 Bug Discoveries

## Description

I deployed a custom agent-attestation contract on the Terminal3 testnet and conducted a systematic deep audit of the Terminal3 ADK SDK (v4.36.0), documentation, and WIT toolchain. The audit uncovered 12 bugs across 4 severity levels — including a CRITICAL silent version fallback issue where the server executes the wrong contract version without any error.

## What I Built

- **Custom contract (agent-attest):** Deployed as Contract ID 650 on testnet. Implements agent registration, verification, and attestation listing with KV persistence. Built in Rust, compiled to wasm32-wasip2.
- **2 agents registered and verified** across sessions, proving KV data persistence.
- **Reference contract (terminal3-dx-demo):** Also registered (ID 648) and audited.

## Bugs Found (12 total)

**CRITICAL (1):**
1. Silent version fallback — requesting version "99.99.99" silently executes v0.1.0 with no error

**HIGH (3):**
2. No WASM validation at registration — empty bytes and random garbage accepted as valid contracts
3. trustAnchor required by SDK but missing from Quickstart documentation
4. "list" is a reserved WIT keyword — not documented anywhere

**MEDIUM (5):**
5. Reference contract error uses literal <tid> instead of actual tenant ID
6. All server errors are generic RpcError — no typed error subclasses
7. maps.create without readers silently creates an unreadable map
8. Reference contract has zero input validation
9. 17+ SDK methods undocumented (contracts.logs, contracts.disable, maps.entrySet, etc.)

**LOW/INFO (3):**
10. SDK README uses T3N_DEMO_KEY while docs use T3N_API_KEY
11. SDK README uses "sandbox" while docs use "testnet"
12. Complete WIT reserved keyword list (22 words) not documented

## Reproducibility

All bugs include exact reproduction steps, live test logs, and suggested fixes. The repository contains runnable test scripts that verify each bug against the live testnet.

## Links

- GitHub: https://github.com/Stan-lee13/terminal3-adk-bounty
- Full bug report: docs/BUGS.md in the repository
- Test logs: logs/ directory in the repository
- Screenshots: screenshots/ directory (8 screenshots from live execution)

## Differentiator

This submission goes beyond following the tutorial — it deploys a custom contract with live testnet execution AND provides a professional-grade SDK audit with 12 reproducible bugs, suggested fixes, and complete documentation. The CRITICAL version fallback bug (BUG-001) is a real safety issue that could affect production deployments.
