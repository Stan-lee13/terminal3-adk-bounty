# Terminal3 ADK — Bug Audit Report

**Auditor:** Victor Stanley (Stan-lee13)  
**SDK version:** @terminal3/t3n-sdk v4.36.0  
**Date:** August 12, 2026  
**Environment:** testnet (did:t3n:f2458610f88263ea28859cd1f2dee3405514bbf9)  

All bugs below were discovered through live testing against the Terminal3 testnet.  
Every bug includes exact reproduction steps and suggested fixes.

---

## Summary

| # | Severity | Title | Type |
|---|----------|-------|------|
| 001 | CRITICAL | Silent version fallback — wrong version executes without error | Runtime |
| 002 | HIGH | No WASM validation at contract registration time | Runtime |
| 003 | HIGH | trustAnchor required but missing from Quickstart docs | Documentation |
| 004 | HIGH | list is a reserved WIT keyword — not documented | Toolchain |
| 005 | MEDIUM | Reference contract error message uses literal <tid> instead of actual ID | Reference contract |
| 006 | MEDIUM | All server errors are generic RpcError — no typed error classes | SDK |
| 007 | MEDIUM | maps.create without readers silently creates a deny-all map | SDK |
| 008 | MEDIUM | Reference contract has zero input validation | Reference contract |
| 009 | MEDIUM | Large undocumented SDK API surface | Documentation |
| 010 | LOW | SDK README uses T3N_DEMO_KEY while docs use T3N_API_KEY | Documentation |
| 011 | LOW | SDK README uses "sandbox" while Quickstart uses "testnet" | Documentation |
| 012 | INFO | Complete WIT reserved keyword list not documented | Documentation |

---

## BUG-001: Silent version fallback — wrong version executes without error

**Severity:** CRITICAL  
**Type:** Runtime behavior  

### Description

When calling tenant.contracts.execute(), if the requested version does not match any registered version, the SDK silently falls back to the latest registered version and executes it successfully — with no error, no warning, and no indication that a different version was used.

### Reproduction

```typescript
import {
  T3nClient, TenantClient, setEnvironment, loadWasmComponent,
  eth_get_address, metamask_sign, createEthAuthInput, fetchTrustedManifest, getNodeUrl,
} from "@terminal3/t3n-sdk";

setEnvironment("testnet");
const apiKey = process.env.T3N_API_KEY!;
const wasmComponent = await loadWasmComponent();
const address = eth_get_address(apiKey);
const trustAnchor = await fetchTrustedManifest("testnet");
const t3n = new T3nClient({
  trustAnchor, wasmComponent,
  handlers: { EthSign: metamask_sign(address, undefined, apiKey) },
});
await t3n.handshake();
const tenantDid = (await t3n.authenticate(createEthAuthInput(address))).value;
const tenant = new TenantClient({ t3n, baseUrl: getNodeUrl(), tenantDid });
await tenant.tenant.me();

// Only version 0.1.0 is registered. Request 99.99.99:
const result = await tenant.contracts.execute("agent-attest", {
  version: "99.99.99",  // <-- non-existent version
  functionName: "verify",
  input: { agent_did: "did:t3n:testagent001" },
});
console.log(result);
// {"agent_did":"did:t3n:testagent001","capability":"solana_swap_verification",...}
// SILENT SUCCESS — ran v0.1.0 instead of erroring
```

### Expected behavior

The server should reject the request with an error like "version 99.99.99 not found for contract agent-attest". The developer should know the requested version doesn't exist.

### Actual behavior

The server silently executes the latest registered version (0.1.0) and returns a success response. There is zero indication that version 99.99.99 doesn't exist.

### Also confirmed with version "0.0.1" (lower than registered 0.1.0)

Requesting version "0.0.1" also silently succeeds and runs v0.1.0.

### Impact

A developer deploying v0.1.0 and v0.2.0 with different behavior might execute v0.2.0 when they think they're running v0.3.0 — silently running the wrong contract logic in production. This is a safety-critical issue for any contract that changes behavior between versions.

### Suggested fix

Server-side: validate that the requested script_version matches a registered version. Return a 404 or 400 with "version X not found for contract tail, available: [list]".

Client-side: the SDK should surface the actual executed version in the response metadata.

### Log

See logs/version_fallback_test.log for full execution output.

---

## BUG-002: No WASM validation at contract registration time

**Severity:** HIGH  
**Type:** Runtime behavior  

### Description

tenant.contracts.register() accepts any Uint8Array as WASM bytes without validating that the bytes are a valid WASM module. Empty bytes and random bytes are both accepted and assigned contract IDs.

### Reproduction

```typescript
// Empty WASM bytes (0 bytes)
const result1 = await tenant.contracts.register({
  tail: "empty-contract-test",
  version: "0.1.0",
  wasm: new Uint8Array(0),
});
console.log(result1.contract_id); // 651 — SILENT SUCCESS

// Random garbage bytes (1024 random bytes)
const randomBytes = new Uint8Array(1024);
for (let i = 0; i < 1024; i++) randomBytes[i] = Math.floor(Math.random() * 256);
const result2 = await tenant.contracts.register({
  tail: "invalid-wasm-test",
  version: "0.1.0",
  wasm: randomBytes,
});
console.log(result2.contract_id); // 652 — SILENT SUCCESS
```

### Expected behavior

The server should validate the WASM bytes at registration time by checking the WASM magic number and parsing the module header. Reject with 400 Bad Request if invalid.

### Actual behavior

Both empty and random bytes are accepted and assigned contract IDs (651, 652). The failure only surfaces at invocation time with a generic "Internal error" message.

### Impact

A developer could accidentally register a broken contract (e.g., due to a build error producing an empty file) and only discover the problem at runtime with an unhelpful "Internal error".

### Suggested fix

Validate WASM format at registration time — check for the magic number (\0asm) and minimum module structure.

### Log

See logs/edge_case_tests.log and logs/invalid_wasm_invoke.log.

---

## BUG-003: trustAnchor required but missing from Quickstart docs

**Severity:** HIGH  
**Type:** Documentation gap  

### Description

The T3nClient constructor requires a trustAnchor parameter (TypeScript type: trustAnchor: TrustAnchorOrUnsafe — no ?). But the official Quickstart documentation does not mention trustAnchor anywhere in the code examples.

### Reproduction

1. Follow the Quickstart at docs.terminal3.io
2. The code example omits trustAnchor
3. This throws: T3nConfigError: trustAnchor is required

### Expected behavior

The Quickstart should include trustAnchor: await fetchTrustedManifest("testnet") in all code examples and import fetchTrustedManifest.

### Actual behavior

trustAnchor is omitted entirely. The SDK's own README does include it, creating an inconsistency.

### Suggested fix

Add trustAnchor to all Quickstart code examples and document fetchTrustedManifest.

---

## BUG-004: list is a reserved WIT keyword — not documented

**Severity:** HIGH  
**Type:** Toolchain / Documentation  

### Description

The WIT parser (wit-bindgen 0.49.0) treats list as a reserved keyword. Using list as a function name produces a parse error with no documentation about this limitation.

### Reproduction

Create a WIT file with a function named list:

```wit
package z:tenant-attest;
world tenant-attest {
  export contracts: interface {
    list: func(req: generic-input) -> result<list<u8>, string>;
  }
}
```

Build error: "expected type, resource or func, found keyword list"

### Complete list of WIT reserved keywords (tested with wit-bindgen 0.49.0)

Cannot use as function names:
- Type keywords: list, option, result, bool, string, u8, u16, u32, u64, f32, f64, char, tuple
- Structural: world, package, interface, export, import, include
- Other: async, static, as

Safe to use: get, set, new, delete, create, update, put, read, write, remove, find, query, search, init, drop, fetch, handle

### Suggested fix

Document WIT reserved keywords and improve the parser error message.

---

## BUG-005: Reference contract error message uses literal <tid> instead of actual tenant ID

**Severity:** MEDIUM  
**Type:** Reference contract bug  

### Description

The z-tenant-flight reference contract's get_api_key() function in search.rs (line 185) and booking.rs (line 174) uses the literal string "z:<tid>:secrets" in the error message instead of the actual tenant ID.

### Code (search.rs line 180-186)

```rust
fn get_api_key() -> Result<...> {
    let tid = tenant_context::tenant_did();
    let map_name = alloc::format!("z:{}:secrets", hex::encode(&tid));  // correct
    let bytes = kv_store::get(&map_name, b"duffel_api_key")
        .map_err(|e| alloc::format!("kv read: {e}"))?
        .ok_or("duffel_api_key not found in z:<tid>:secrets ...")?;  // BUG: literal <tid>
}
```

### Expected behavior

Error message should use the actual map name: alloc::format!("duffel_api_key not found in {} ...", map_name)

### Impact

Developer sees <tid> literal instead of their actual tenant ID, making it harder to debug which KV map to populate.

### Suggested fix

Replace literal string with format! using map_name variable.

---

## BUG-006: All server errors are generic RpcError — no typed error classes

**Severity:** MEDIUM  
**Type:** SDK design  

### Description

The SDK defines 15+ error classes but all contract operation errors come back as generic RpcError. No typed subclasses for version conflicts, contract not found, map exists, etc.

### Reproduction

```typescript
// All produce e.constructor.name === "RpcError"
// Version conflict: "contract version invalid: version 0.1.0 is not higher than current version 0.1.0"
// Contract not found: "tenant contract z:...:nonexistent not registered"
// Map exists: "map already exists"
// Function not found: "Function 'xyz' not found in contract"
```

### Impact

Programmatic error handling requires string-matching error messages that may change between versions.

### Suggested fix

Add typed error subclasses: VersionConflictError, ContractNotFoundError, MapExistsError, etc.

---

## BUG-007: maps.create without readers silently creates a deny-all map

**Severity:** MEDIUM  
**Type:** SDK footgun  

### Description

MapCreateInput.readers is optional. When omitted, the map is created with deny-all read policy — no one (including the creator) can read it. SDK emits console.warn but does not throw.

### Reproduction

```typescript
const result = await tenant.maps.create({
  tail: "test-no-readers",
  visibility: "private",
  writers: { only: [650] },
  // readers omitted — map is unreadable
});
// SILENT SUCCESS with only a console.warn
```

### Suggested fix

Make readers a required field, or throw TenantSdkValidationError when omitted.

---

## BUG-008: Reference contract has zero input validation

**Severity:** MEDIUM  
**Type:** Reference contract  

### Description

The z-tenant-flight reference contract accepts any input without validation:

- search_offers: no validation for origin, destination, departure_date, cabin_class, adult_count
- book_offer: no validation for offer_id, passenger_id, total_amount, total_currency

Invalid inputs are passed to Duffel API which rejects them with API-specific errors.

### Suggested fix

Add input validation at the top of each function (IATA code format, date format, enum values, range checks).

---

## BUG-009: Large undocumented SDK API surface

**Severity:** MEDIUM  
**Type:** Documentation gap  

### Description

TenantClient exposes many undocumented methods:

- contracts.list(), contracts.listDetailed(), contracts.disable(), contracts.enable(), contracts.unregister(), contracts.setDescriptor(), contracts.logs()
- maps.update(), maps.delete(), maps.entrySet(), maps.entryGet(), maps.getStatus()
- tenant.claim()

None are mentioned in the official walkthrough documentation.

### Suggested fix

Add a TenantClient API Reference page documenting every method.

---

## BUG-010: SDK README uses T3N_DEMO_KEY while docs use T3N_API_KEY

**Severity:** LOW  
**Type:** Documentation inconsistency  

The SDK README uses process.env.T3N_DEMO_KEY while official docs use process.env.T3N_API_KEY. Standardize on T3N_API_KEY.

---

## BUG-011: SDK README uses "sandbox" while Quickstart uses "testnet"

**Severity:** LOW  
**Type:** Documentation inconsistency  

The SDK type accepts "sandbox" | "testnet" | "production" but docs use different names in different places. SDK README uses "sandbox", Quickstart uses "testnet". Pick one canonical name.

---

## BUG-012: Complete WIT reserved keyword list not documented

**Severity:** INFO  
**Type:** Documentation gap  

See BUG-004 for the complete tested list of WIT reserved keywords.

---

## Appendix: Test logs

All bugs verified through live testing against Terminal3 testnet:
- logs/edge_case_tests.log — Tests 1-8
- logs/version_fallback_test.log — Version fallback tests
- logs/invalid_wasm_invoke.log — Invalid WASM invocation tests
- logs/readers_optional_test.log — Maps.create readers test
