/**
 * Agent Attestation Registry — End-to-end Demo
 *
 * This script demonstrates a complete Terminal3 workflow:
 *   1. Authenticate as tenant
 *   2. Build TenantClient
 *   3. Register the z-tenant-attest WASM contract
 *   4. Create the `attestations` KV map with contract ACL
 *   5. Invoke register() — store an agent attestation
 *   6. Invoke verify() — retrieve the attestation
 *   7. Invoke list() — list all attestations
 *
 * No external API key (Duffel, etc.) needed — this uses only KV-store.
 *
 * Usage:
 *   export T3N_API_KEY="<your-key>"
 *   npx tsx attest-demo.ts
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
import { readFile } from "fs/promises";

setEnvironment("testnet");

const apiKey = process.env.T3N_API_KEY;
if (!apiKey) throw new Error("T3N_API_KEY is not set");

// --- 1. Authenticate ---
console.log("\n=== Step 1: Authenticate ===");
const wasmComponent = await loadWasmComponent();
const address = eth_get_address(apiKey);
const trustAnchor = await fetchTrustedManifest("testnet");
const t3n = new T3nClient({
  trustAnchor,
  wasmComponent,
  handlers: { EthSign: metamask_sign(address, undefined, apiKey) },
});

await t3n.handshake();
console.log("Handshake complete");

const did = await t3n.authenticate(createEthAuthInput(address));
const tenantDid = did.value;
console.log("Connected as:", tenantDid);

// --- 2. Build TenantClient ---
console.log("\n=== Step 2: TenantClient ===");
const tenant = new TenantClient({
  t3n,
  baseUrl: getNodeUrl(),
  tenantDid,
});
await tenant.tenant.me();
console.log("TenantClient ready");

// --- 3. Register the attest contract ---
console.log("\n=== Step 3: Register Contract ===");
const WASM_PATH = "../contracts/z-tenant-attest/target/wasm32-wasip2/release/z_tenant_attest.wasm";

try {
  const wasmBytes = await readFile(WASM_PATH);
  const CONTRACT_TAIL = "agent-attest";
  const CONTRACT_VERSION = "0.1.0";

  const result = await tenant.contracts.register({
    tail: CONTRACT_TAIL,
    version: CONTRACT_VERSION,
    wasm: wasmBytes,
  });

  const contractId = result.contract_id;
  const tenantId = tenantDid.slice("did:t3n:".length);
  const scriptName = `z:${tenantId}:${CONTRACT_TAIL}`;
  console.log(`Registered ${scriptName} as contract id ${contractId}`);

  // --- 4. Create KV map for attestations ---
  console.log("\n=== Step 4: Create attestations KV map ===");
  try {
    await tenant.maps.create({
      tail: "attestations",
      visibility: "private",
      writers: { only: [contractId] },
      readers: { only: [contractId] },
    });
    console.log("attestations map created");
  } catch (e: any) {
    if (e?.message?.includes("already exists")) {
      console.log("attestations map already exists (idempotent)");
    } else {
      throw e;
    }
  }

  // --- 5. Invoke: register an attestation ---
  console.log("\n=== Step 5: Register Agent Attestation ===");
  const testAgentDid = "did:t3n:testagent001";
  const registerResult = await tenant.contracts.execute(CONTRACT_TAIL, {
    version: CONTRACT_VERSION,
    functionName: "register",
    input: {
      agent_did: testAgentDid,
      capability: "solana_swap_verification",
      issued_at: Date.now(),
      signature: "0xdeadbeef_test_signature",
    },
  });
  console.log("Register result:", JSON.stringify(registerResult));

  // --- 6. Invoke: verify the attestation ---
  console.log("\n=== Step 6: Verify Agent Attestation ===");
  const verifyResult = await tenant.contracts.execute(CONTRACT_TAIL, {
    version: CONTRACT_VERSION,
    functionName: "verify",
    input: {
      agent_did: testAgentDid,
    },
  });
  console.log("Verify result:", JSON.stringify(verifyResult));

  // --- 7. Invoke: list all attestations ---
  console.log("\n=== Step 7: List All Attestations ===");
  const listResult = await tenant.contracts.execute(CONTRACT_TAIL, {
    version: CONTRACT_VERSION,
    functionName: "list",
    input: {},
  });
  console.log("List result:", JSON.stringify(listResult));

  console.log("\n=== END-TO-END DEMO COMPLETE ===");
  console.log("Contract:", scriptName, "v" + CONTRACT_VERSION);
  console.log("Attestation registered and verified for:", testAgentDid);

} catch (error) {
  console.error("Demo failed:", error instanceof Error ? error.message : String(error));
  console.error("\nMake sure the contract WASM is built:");
  console.error("  cd contracts/z-tenant-attest");
  console.error("  rustup target add wasm32-wasip2");
  console.error("  cargo build --target wasm32-wasip2 --release");
  process.exit(1);
}
