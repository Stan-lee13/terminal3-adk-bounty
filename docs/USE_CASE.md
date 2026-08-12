# Bonus Use Case: Contract-Scoped Secret Boundary

The bonus demonstration is a secure deployment workflow for a tenant-owned Rust/WASM contract. The workflow registers the contract, creates a private `secrets` map, scopes both readers and writers to the returned contract ID, and verifies that invocation cannot proceed until the required secret exists.

This is intentionally smaller than a full travel application. It demonstrates a core Terminal3 capability: tenant-controlled confidential execution with explicit storage permissions and a clear boundary between control-plane setup and contract runtime. The test reached the reference contract’s secret lookup and produced the expected missing-secret error without exposing or fabricating a Duffel credential.

A complete external travel search would require a separate Duffel API key and user egress authorization. Those were not supplied, so no external booking, payment, or personal-data flow was attempted.
