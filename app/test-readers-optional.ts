/**
 * Test: maps.create without readers field — does it create a deny-all map?
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

console.log("=== Test: Create map WITHOUT readers field ===");
try {
  const result = await tenant.maps.create({
    tail: "test-no-readers",
    visibility: "private",
    writers: { only: [650] },
    // readers intentionally omitted
  } as any);
  console.log("Map created WITHOUT readers field");
  console.log("Response:", JSON.stringify(result));
  console.log("INTERPRETATION: Map created with deny-all readers (footgun per SDK JSDoc)");
} catch (e: any) {
  console.log("Map creation failed:", e.message);
}

console.log("\n=== Test: Create map with readers: { only: [] } (empty) ===");
try {
  const result = await tenant.maps.create({
    tail: "test-empty-readers",
    visibility: "private",
    writers: { only: [650] },
    readers: { only: [] },
  });
  console.log("Map created with empty readers");
  console.log("Response:", JSON.stringify(result));
} catch (e: any) {
  console.log("Map creation failed:", e.message);
}
