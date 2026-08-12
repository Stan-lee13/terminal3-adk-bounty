# Use Case: Agent Attestation Registry

## What it does

The Agent Attestation Registry is a custom TEE contract that lets AI agents register and verify identity attestations on the Terminal3 network. It demonstrates a real-world use case for Terminal3's TEE infrastructure: **verifiable agent identity for autonomous agent-to-agent trust**.

## Why this matters

Terminal3's core value proposition is verifiable identity and programmable authorization for AI agents. The Agent Attestation Registry builds directly on this:

1. **Register:** An agent registers its DID with a capability claim (e.g., "solana_swap_verification") and a cryptographic signature
2. **Verify:** Any other agent or tenant can look up the attestation by DID to verify what the agent claims it can do
3. **List:** Enumerate all registered agents and their capabilities

## How it uses Terminal3

| Terminal3 capability | How it's used |
|---------------------|---------------|
| TEE contract execution | Attestation logic runs inside the enclave — tamper-proof |
| KV-store | Attestations persisted in the tenant's private z-namespace |
| Tenant isolation | Each tenant has its own attestation registry |
| WASM component | Compiled from Rust, runs as a WASI Preview 2 component |

## Architecture

```
Agent (with API key)
    ↓
Terminal3 SDK (T3nClient)
    ↓
T3N Network (TEE node)
    ↓
z-tenant-attest contract (WASM, in enclave)
    ↓
KV-store: z:<tid>:attestations
    ↓
Attestation records (DID → capability + signature)
```

## Contract interface

```wit
interface contracts {
    register: func(req: generic-input) -> result<list<u8>, string>;
    verify:   func(req: generic-input) -> result<list<u8>, string>;
    list:     func(req: generic-input) -> result<list<u8>, string>;
}
```

### register
**Input:** `{ agent_did: string, capability: string, issued_at: u64, signature: string }`
**Output:** `{ status: "registered", key: string }`

### verify
**Input:** `{ agent_did: string }`
**Output:** `{ agent_did: string, capability: string, issued_at: u64, signature: string }`

### list
**Input:** `{}`
**Output:** `{ attestations: [...], count: number }`

## Why this is better than the reference contract

The reference flight-booking contract (z-tenant-flight) requires a Duffel API key to do anything meaningful. Without it, invocation fails. This creates a gap in the developer experience: a new developer who follows the walkthrough end-to-end cannot actually invoke a contract without first obtaining a third-party API key.

The Agent Attestation Registry uses **only** the KV-store host interface — no HTTP, no external API keys. This means:
- A developer can run the full end-to-end flow immediately after claiming test credits
- The contract demonstrates the same core T3N capabilities (TEE execution, KV storage, tenant isolation)
- The use case is directly relevant to Terminal3's mission (agent identity)

## Running the demo

```bash
# 1. Build the contract
cd contracts/z-tenant-attest
rustup target add wasm32-wasip2
cargo build --target wasm32-wasip2 --release

# 2. Run the demo
cd ../../app
export T3N_API_KEY="<your-key>"
npx tsx attest-demo.ts
```

The demo script:
1. Authenticates with the T3N testnet
2. Registers the contract
3. Creates the attestations KV map
4. Registers a test attestation
5. Verifies the attestation
6. Lists all attestations

## Connection to Graphite

This use case connects to the broader Solana AI agent ecosystem. Graphite (our transaction verification engine for Solana AI agents) needs exactly this kind of attestation registry: agents that claim to perform transaction verification should be able to register verifiable identity attestations on a neutral, tamper-proof platform. Terminal3's TEE infrastructure provides the trust layer; the attestation registry provides the registry layer; Graphite provides the verification layer.
