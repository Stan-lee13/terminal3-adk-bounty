/**
 * Multi-agent attestation demo — registers a second agent and verifies both.
 */
import {
  T3nClient, TenantClient, setEnvironment, loadWasmComponent,
  eth_get_address, metamask_sign, createEthAuthInput, fetchTrustedManifest, getNodeUrl,
} from "@terminal3/t3n-sdk";

setEnvironment("testnet");
const apiKey = process.env.T3N_API_KEY;
if (!apiKey) throw new Error("T3N_API_KEY is not set");

const wasmComponent = await loadWasmComponent();
const address = eth_get_address(apiKey);
const trustAnchor = await fetchTrustedManifest("testnet");
const t3n = new T3nClient({
  trustAnchor, wasmComponent,
  handlers: { EthSign: metamask_sign(address, undefined, apiKey) },
});
await t3n.handshake();
const tenantDid = (await t3n.authenticate(createEthAuthInput(address))).value;
console.log("Connected as:", tenantDid);

const tenant = new TenantClient({ t3n, baseUrl: getNodeUrl(), tenantDid });
await tenant.tenant.me();

// Register a second agent
console.log("\n=== Register Agent 2 ===");
const reg2 = await tenant.contracts.execute("agent-attest", {
  version: "0.1.0",
  functionName: "register",
  input: {
    agent_did: "did:t3n:graphite-verifier-01",
    capability: "solana_transaction_verification",
    issued_at: Date.now(),
    signature: "0xgraphite_sig_abc123",
  },
});
console.log("Register result:", JSON.stringify(reg2));

// Verify both agents
console.log("\n=== Verify Agent 1 (testagent001) ===");
const v1 = await tenant.contracts.execute("agent-attest", {
  version: "0.1.0",
  functionName: "verify",
  input: { agent_did: "did:t3n:testagent001" },
});
console.log("Verify result:", JSON.stringify(v1));

console.log("\n=== Verify Agent 2 (graphite-verifier-01) ===");
const v2 = await tenant.contracts.execute("agent-attest", {
  version: "0.1.0",
  functionName: "verify",
  input: { agent_did: "did:t3n:graphite-verifier-01" },
});
console.log("Verify result:", JSON.stringify(v2));
