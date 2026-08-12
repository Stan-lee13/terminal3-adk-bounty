/**
 * Test: Does the SDK silently fall back to a different version when requested version doesn't exist?
 * This is a serious bug if true — it means a developer could think they're running v2.0.0
 * but actually running v0.1.0 without any warning.
 */
import {
  T3nClient, TenantClient, setEnvironment, loadWasmComponent,
  eth_get_address, metamask_sign, createEthAuthInput, fetchTrustedManifest, getNodeUrl,
} from "@terminal3/t3n-sdk";
import { readFile } from "fs/promises";

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
console.log("Connected as:", tenantDid);

const tenant = new TenantClient({ t3n, baseUrl: getNodeUrl(), tenantDid });
await tenant.tenant.me();

// Test 1: Execute with completely wrong version
console.log("\n=== Test 1: Execute with version '99.99.99' ===");
try {
  const result = await tenant.contracts.execute("agent-attest", {
    version: "99.99.99",
    functionName: "verify",
    input: { agent_did: "did:t3n:testagent001" },
  });
  console.log("RESULT: SUCCEEDED with version 99.99.99 (BUG!)");
  console.log("Response:", JSON.stringify(result));
  console.log("INTERPRETATION: SDK silently fell back to registered v0.1.0");
} catch (e: any) {
  console.log("RESULT: Failed as expected");
  console.log("Error:", e.message);
}

// Test 2: Execute with empty string version
console.log("\n=== Test 2: Execute with version '' (empty string) ===");
try {
  const result = await tenant.contracts.execute("agent-attest", {
    version: "",
    functionName: "verify",
    input: { agent_did: "did:t3n:testagent001" },
  });
  console.log("RESULT: SUCCEEDED with empty version (BUG!)");
  console.log("Response:", JSON.stringify(result));
} catch (e: any) {
  console.log("RESULT: Failed");
  console.log("Error:", e.message);
}

// Test 3: Execute with undefined version
console.log("\n=== Test 3: Execute with undefined version ===");
try {
  const result = await tenant.contracts.execute("agent-attest", {
    version: undefined as any,
    functionName: "verify",
    input: { agent_did: "did:t3n:testagent001" },
  });
  console.log("RESULT: SUCCEEDED with undefined version");
  console.log("Response:", JSON.stringify(result));
} catch (e: any) {
  console.log("RESULT: Failed");
  console.log("Error:", e.message);
}

// Test 4: Execute with version '0.0.1' (lower than registered 0.1.0)
console.log("\n=== Test 4: Execute with version '0.0.1' (lower than 0.1.0) ===");
try {
  const result = await tenant.contracts.execute("agent-attest", {
    version: "0.0.1",
    functionName: "verify",
    input: { agent_did: "did:t3n:testagent001" },
  });
  console.log("RESULT: SUCCEEDED with version 0.0.1 (BUG!)");
  console.log("Response:", JSON.stringify(result));
} catch (e: any) {
  console.log("RESULT: Failed as expected");
  console.log("Error:", e.message);
}

// Test 5: Execute with version '0.1.0' (correct version)
console.log("\n=== Test 5: Execute with version '0.1.0' (correct) ===");
try {
  const result = await tenant.contracts.execute("agent-attest", {
    version: "0.1.0",
    functionName: "verify",
    input: { agent_did: "did:t3n:testagent001" },
  });
  console.log("RESULT: SUCCEEDED with correct version");
  console.log("Response:", JSON.stringify(result));
} catch (e: any) {
  console.log("RESULT: Failed");
  console.log("Error:", e.message);
}
