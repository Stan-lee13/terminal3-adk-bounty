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
import { readFile } from "fs/promises";

setEnvironment("testnet");
const apiKey = process.env.T3N_API_KEY!;

async function makeTenant() {
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
  const tenant = new TenantClient({ t3n, baseUrl: getNodeUrl(), tenantDid: did.value });
  return tenant;
}

async function main() {
  const tenant = await makeTenant();
  const validWasm = await readFile("../contracts/z-tenant-attest/target/wasm32-wasip2/release/z_tenant_attest.wasm");

  console.log("=== TEST C1: Empty WASM Bytes ===");
  const freshTail1 = `empty-wasm-${Date.now()}`;
  try {
    const res = await tenant.contracts.register({
      tail: freshTail1,
      version: "0.1.0",
      wasm: new Uint8Array(0),
    });
    console.log("Empty WASM register result:", res);
  } catch (e: any) {
    console.log("Empty WASM register failed:");
    console.log("Error type:", e?.constructor?.name);
    console.log("Error message:", e?.message);
    console.log("Error code:", e?.code || e?.errorCode);
  }

  console.log("\n=== TEST C2: Invalid WASM (Random Bytes) ===");
  const freshTail2 = `invalid-wasm-${Date.now()}`;
  const randomBytes = new Uint8Array(1024);
  for (let i = 0; i < 1024; i++) randomBytes[i] = Math.floor(Math.random() * 256);
  try {
    const res = await tenant.contracts.register({
      tail: freshTail2,
      version: "0.1.0",
      wasm: randomBytes,
    });
    console.log("Invalid WASM register result:", res);
  } catch (e: any) {
    console.log("Invalid WASM register failed:");
    console.log("Error type:", e?.constructor?.name);
    console.log("Error message:", e?.message);
    console.log("Error code:", e?.code || e?.errorCode);
  }

  console.log("\n=== TEST C3: Duplicate Version Registration (same tail + same version) ===");
  const duplicateTail = `dup-test-${Date.now()}`;
  console.log("First registration...");
  const reg1 = await tenant.contracts.register({
    tail: duplicateTail,
    version: "0.1.0",
    wasm: validWasm,
  });
  console.log("First registration succeeded:", reg1);

  console.log("Attempting second registration with SAME version (0.1.0)...");
  try {
    const reg2 = await tenant.contracts.register({
      tail: duplicateTail,
      version: "0.1.0",
      wasm: validWasm,
    });
    console.log("Second registration result:", reg2);
  } catch (e: any) {
    console.log("Second registration failed as expected:");
    console.log("Error type:", e?.constructor?.name);
    console.log("Error message:", e?.message);
  }

  console.log("\n=== TEST C4: Very Long Tail Name ===");
  const longTail = "a".repeat(300);
  try {
    const res = await tenant.contracts.register({
      tail: longTail,
      version: "0.1.0",
      wasm: validWasm,
    });
    console.log("Long tail register result:", res);
  } catch (e: any) {
    console.log("Long tail register failed:");
    console.log("Error type:", e?.constructor?.name);
    console.log("Error message:", e?.message);
  }

  console.log("\n=== TEST C4b: Special Characters in Tail Name ===");
  const specialTail = "tail/with/slashes/or#spaces?and=query";
  try {
    const res = await tenant.contracts.register({
      tail: specialTail,
      version: "0.1.0",
      wasm: validWasm,
    });
    console.log("Special char tail register result:", res);
  } catch (e: any) {
    console.log("Special char tail register failed:");
    console.log("Error type:", e?.constructor?.name);
    console.log("Error message:", e?.message);
  }
}

main().catch(console.error);
