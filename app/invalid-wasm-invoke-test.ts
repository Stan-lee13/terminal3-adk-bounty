/**
 * Test: Can the empty/invalid WASM contracts (IDs 651, 652) be invoked?
 * If yes, this is a critical security issue — the platform accepted garbage as a contract.
 */
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

// Test: Invoke the empty WASM contract (tail: empty-contract-test, ID 651)
console.log("=== Invoke empty WASM contract (ID 651) ===");
try {
  const result = await tenant.contracts.execute("empty-contract-test", {
    version: "0.1.0",
    functionName: "any-function",
    input: {},
  });
  console.log("RESULT: SUCCEEDED (critical bug!)");
  console.log("Response:", JSON.stringify(result));
} catch (e: any) {
  console.log("RESULT: Failed");
  console.log("Error type:", e.constructor.name);
  console.log("Error message:", e.message);
}

// Test: Invoke the invalid WASM contract (tail: invalid-wasm-test, ID 652)
console.log("\n=== Invoke invalid WASM contract (ID 652) ===");
try {
  const result = await tenant.contracts.execute("invalid-wasm-test", {
    version: "0.1.0",
    functionName: "any-function",
    input: {},
  });
  console.log("RESULT: SUCCEEDED (critical bug!)");
  console.log("Response:", JSON.stringify(result));
} catch (e: any) {
  console.log("RESULT: Failed");
  console.log("Error type:", e.constructor.name);
  console.log("Error message:", e.message);
}
