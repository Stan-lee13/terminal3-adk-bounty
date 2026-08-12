import {
  T3nClient,
  TenantClient,
  setEnvironment,
  loadWasmComponent,
  fetchTrustedManifest,
  eth_get_address,
  metamask_sign,
  createEthAuthInput,
  getNodeUrl,
} from "@terminal3/t3n-sdk";

setEnvironment("testnet");
const apiKey = process.env.T3N_API_KEY!;

async function makeClient() {
  const wasmComponent = await loadWasmComponent();
  const trustAnchor = await fetchTrustedManifest("testnet");
  const address = eth_get_address(apiKey);
  const t3n = new T3nClient({
    trustAnchor,
    wasmComponent,
    handlers: { EthSign: metamask_sign(address, undefined, apiKey) },
  });
  await t3n.handshake();
  const did = await t3n.authenticate(createEthAuthInput(address));
  return { t3n, tenantDid: did.value };
}

async function main() {
  const { t3n, tenantDid } = await makeClient();
  const baseUrl = getNodeUrl();

  console.log("=== TEST B1: No t3n ===");
  try {
    const tenant = new TenantClient({
      baseUrl,
      tenantDid,
    } as any);
    console.log("TenantClient constructor succeeded without t3n!");
    console.log("Testing tenant.tenant.me()...");
    await tenant.tenant.me();
    console.log("tenant.me() succeeded without t3n!");
  } catch (e: any) {
    console.log("Threw error:");
    console.log("Error type:", e?.constructor?.name);
    console.log("Error message:", e?.message);
  }

  console.log("\n=== TEST B2: No baseUrl ===");
  try {
    const tenant = new TenantClient({
      t3n,
      tenantDid,
    } as any);
    console.log("TenantClient constructor succeeded without baseUrl!");
    console.log("Testing tenant.tenant.me()...");
    const res = await tenant.tenant.me();
    console.log("tenant.me() succeeded without baseUrl!", res);
  } catch (e: any) {
    console.log("Threw error:");
    console.log("Error type:", e?.constructor?.name);
    console.log("Error message:", e?.message);
  }

  console.log("\n=== TEST B3: No tenantDid ===");
  try {
    const tenant = new TenantClient({
      t3n,
      baseUrl,
    } as any);
    console.log("TenantClient constructor succeeded without tenantDid!");
    console.log("Testing tenant.tenant.me()...");
    const res = await tenant.tenant.me();
    console.log("tenant.me() succeeded without tenantDid!", res);
    console.log("Testing tenant.contracts.list()...");
    const contracts = await tenant.contracts.list();
    console.log("tenant.contracts.list() succeeded without tenantDid!", contracts);
  } catch (e: any) {
    console.log("Threw error:");
    console.log("Error type:", e?.constructor?.name);
    console.log("Error message:", e?.message);
  }

  console.log("\n=== TEST B4: No tenantDid when running contracts.register ===");
  try {
    const tenant = new TenantClient({
      t3n,
      baseUrl,
    } as any);
    console.log("Testing tenant.contracts.register without tenantDid...");
    const res = await tenant.contracts.register({
      tail: "some-tail",
      version: "0.1.0",
      wasm: new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]),
    });
    console.log("tenant.contracts.register succeeded without tenantDid!", res);
  } catch (e: any) {
    console.log("Threw error:");
    console.log("Error type:", e?.constructor?.name);
    console.log("Error message:", e?.message);
  }
}

main().catch(console.error);
