/**
 * Verify that the attestation persisted across transactions.
 * Runs list-attestations in a fresh session to confirm KV-store persistence.
 */
import {
  T3nClient,
  TenantClient,
  setEnvironment,
  loadWasmComponent,
  eth_get_address,
  metamask_sign,
  createEthAuthInput,
  fetchTrustedManifest,
  getNodeUrl,
} from "@terminal3/t3n-sdk";

setEnvironment("testnet");

const apiKey = process.env.T3N_API_KEY;
if (!apiKey) throw new Error("T3N_API_KEY is not set");

const wasmComponent = await loadWasmComponent();
const address = eth_get_address(apiKey);
const trustAnchor = await fetchTrustedManifest("testnet");
const t3n = new T3nClient({
  trustAnchor,
  wasmComponent,
  handlers: { EthSign: metamask_sign(address, undefined, apiKey) },
});

await t3n.handshake();
const did = await t3n.authenticate(createEthAuthInput(address));
const tenantDid = did.value;
console.log("Connected as:", tenantDid);

const tenant = new TenantClient({ t3n, baseUrl: getNodeUrl(), tenantDid });
await tenant.tenant.me();
console.log("TenantClient ready");

// List all attestations (fresh transaction — should see persisted data)
console.log("\n=== List Attestations (fresh tx) ===");
const listResult = await tenant.contracts.execute("agent-attest", {
  version: "0.1.0",
  functionName: "list-attestations",
  input: {},
});
console.log("List result:", JSON.stringify(listResult));

// Verify the specific attestation
console.log("\n=== Verify Attestation ===");
const verifyResult = await tenant.contracts.execute("agent-attest", {
  version: "0.1.0",
  functionName: "verify",
  input: { agent_did: "did:t3n:testagent001" },
});
console.log("Verify result:", JSON.stringify(verifyResult));
