import {
  T3nClient,
  setEnvironment,
  loadWasmComponent,
  eth_get_address,
  metamask_sign,
  createEthAuthInput,
  fetchTrustedManifest,
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

console.log("Starting handshake...");
await t3n.handshake();
console.log("Handshake complete");

const did = await t3n.authenticate(createEthAuthInput(address));
const tenantDid = did.value;
console.log("Connected as:", tenantDid);
console.log("Expected DID from claim:", process.env.T3N_EXPECTED_DID ?? "(not provided)");

try {
  const usage = await t3n.getUsage();
  console.log("Usage response:", JSON.stringify(usage));
} catch (error) {
  console.error("Usage lookup failed:", error instanceof Error ? error.message : String(error));
}

const { TenantClient, getNodeUrl } = await import("@terminal3/t3n-sdk");
const tenant = new TenantClient({
  t3n,
  baseUrl: getNodeUrl(),
  tenantDid,
});
await tenant.tenant.me();
console.log("TenantClient ready.");

const { readFile } = await import("fs/promises");
const wasmPath = "../contracts/z-tenant-flight/target/wasm32-wasip2/release/z_tenant_flight.wasm";
const wasm = await readFile(wasmPath);
const contractTail = "terminal3-dx-demo";
const contractVersion = "0.1.0";
const registration = await tenant.contracts.register({
  tail: contractTail,
  version: contractVersion,
  wasm,
});
const tenantId = tenantDid.slice("did:t3n:".length);
const scriptName = `z:${tenantId}:${contractTail}`;
console.log(`Registered ${scriptName} as contract id ${registration.contract_id}`);

try {
  const execution = await tenant.contracts.execute(contractTail, {
    version: contractVersion,
    functionName: "search-offers",
    input: {
      origin: "LHR",
      destination: "JFK",
      departure_date: "2026-08-20",
      cabin_class: "economy",
      adult_count: 1,
    },
  });
  console.log("Contract execution response:", JSON.stringify(execution));
} catch (error) {
  console.error("Contract execution failed:", error instanceof Error ? error.message : String(error));
}
