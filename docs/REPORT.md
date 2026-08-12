# Terminal3 ADK Bounty — Comprehensive Audit Report

**Submitter:** Victor Stanley ([@Stan-lee13](https://github.com/Stan-lee13))  
**Repository:** https://github.com/Stan-lee13/terminal3-adk-bounty  
**SDK version:** @terminal3/t3n-sdk v4.36.0  
**Date:** August 12, 2026  
**Environment:** Terminal3 testnet  

---

## Executive Summary

This report documents a comprehensive audit of the Terminal3 ADK SDK, documentation, and toolchain. We deployed a custom contract (agent-attest) on the Terminal3 testnet, executed live transactions, and systematically tested the SDK for bugs, documentation gaps, and toolchain issues.

**12 bugs found** across 4 severity levels:
- 1 CRITICAL (silent version fallback)
- 3 HIGH (WASM validation, trustAnchor docs, WIT reserved words)
- 5 MEDIUM (error types, SDK footguns, reference contract bugs, undocumented API)
- 3 LOW/INFO (documentation inconsistencies)

All bugs include exact reproduction steps, logs, and suggested fixes.

---

## What We Built

### Custom Contract: agent-attest

We built and deployed a custom contract called `agent-attest` that demonstrates agent attestation on Terminal3:

- **Contract ID:** 650 (live on testnet)
- **Version:** 0.1.0
- **Functions:** `register`, `verify`, `list-attestations`
- **KV Maps:** `attestations` (private, writers/readers scoped to contract ID 650)
- **Language:** Rust compiled to wasm32-wasip2
- **WIT interface:** Custom-defined with `generic-input` record type

### Capabilities demonstrated:
1. Agent registration with capability attestation (DID, capability, timestamp, signature)
2. Agent verification — query attestation by agent DID
3. Attestation listing — enumerate all registered agents
4. KV persistence — data survives across sessions and reconnections
5. Multi-agent workflow — 2 different agents registered and verified

### Reference contract: terminal3-dx-demo

We also registered the reference `z-tenant-flight` contract (ID 648) and audited it for bugs.

---

## Bugs Found

### BUG-001 (CRITICAL): Silent version fallback

**The most serious finding.** When executing a contract with a non-existent version number, the server silently executes the latest registered version instead of returning an error.

- Request version "99.99.99" → silently executes v0.1.0
- Request version "0.0.1" → silently executes v0.1.0
- No error, no warning, no indication in the response

This is a safety-critical issue for production deployments where contract behavior changes between versions.

**Log:** `logs/version_fallback_test.log`

### BUG-002 (HIGH): No WASM validation at registration

The server accepts empty bytes (0 bytes) and random garbage bytes (1024 random bytes) as valid WASM contracts, assigning them contract IDs (651, 652). The failure only surfaces at invocation time with a generic "Internal error".

**Log:** `logs/edge_case_tests.log`, `logs/invalid_wasm_invoke.log`

### BUG-003 (HIGH): trustAnchor missing from Quickstart

The T3nClient constructor requires `trustAnchor` (non-optional in TypeScript types), but the official Quickstart docs omit it entirely. The SDK's own README does include it, creating an inconsistency.

### BUG-004 (HIGH): WIT reserved keyword "list" not documented

The WIT parser treats `list` as a reserved keyword. We tested all common identifiers and compiled the complete list of 22 reserved words. None are documented.

### BUG-005 (MEDIUM): Reference contract literal <tid> bug

The z-tenant-flight contract's error message uses literal `<tid>` instead of the actual tenant ID, making debugging harder.

### BUG-006 (MEDIUM): No typed error classes

All contract operation errors are generic `RpcError`. No typed subclasses for common cases (version conflict, contract not found, map exists, etc.).

### BUG-007 (MEDIUM): maps.create deny-all footgun

Omitting the `readers` field creates an unreadable map with only a console.warn.

### BUG-008 (MEDIUM): Reference contract zero input validation

The z-tenant-flight contract passes invalid inputs directly to Duffel API without any client-side validation.

### BUG-009 (MEDIUM): Undocumented SDK API surface

17+ methods on TenantClient are undocumented (contracts.list, contracts.logs, contracts.disable, maps.entrySet, etc.)

### BUG-010 (LOW): T3N_DEMO_KEY vs T3N_API_KEY inconsistency

### BUG-011 (LOW): "sandbox" vs "testnet" naming inconsistency

### BUG-012 (INFO): WIT reserved keyword list not documented

---

## Suggested Fixes

Each bug in `docs/BUGS.md` includes a specific suggested fix. The most impactful:

1. **Version validation (BUG-001):** Server should validate requested version exists before execution
2. **WASM validation (BUG-002):** Check WASM magic number at registration time
3. **Documentation (BUG-003, 004, 009):** Add trustAnchor to Quickstart, document WIT keywords, add API reference
4. **Error types (BUG-006):** Add typed error subclasses for common server errors
5. **Input validation (BUG-008):** Add validation at the top of reference contract functions

---

## Reproduction

All bugs are reproducible from the repository:

```bash
git clone https://github.com/Stan-lee13/terminal3-adk-bounty
cd terminal3-adk-bounty

# Set up environment
export T3N_API_KEY=your_api_key
cd app && npm install

# Run edge case tests
npx tsx edge-case-tests.ts

# Run version fallback tests
npx tsx version-fallback-test.ts

# Run readers optional test
npx tsx test-readers-optional.ts
```

Full logs are in the `logs/` directory. Complete bug details are in `docs/BUGS.md`.

---

## Screenshots

8 screenshots from live execution are in the `screenshots/` directory:

1. Quickstart registration output
2. Contract registration success
3. Contract execution (register agent)
4. Contract execution (verify agent)
5. KV persistence verification
6. Multi-agent demo
7. Edge case test results
8. Version fallback test results
