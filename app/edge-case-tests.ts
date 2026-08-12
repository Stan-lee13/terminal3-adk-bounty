/**
 * Edge case tests for Terminal3 SDK — testing undocumented behaviors
 */
import {
  T3nClient, TenantClient, setEnvironment, loadWasmComponent,
  eth_get_address, metamask_sign, createEthAuthInput, fetchTrustedManifest, getNodeUrl,
} from "@terminal3/t3n-sdk";

setEnvironment("testnet");
const apiKey = process.env.T3N_API_KEY!;

// Helper: create authenticated client
async function makeClient() {
  const wasmComponent = await loadWasmComponent();
  const address = eth_get_address(apiKey);
  const trustAnchor = await fetchTrustedManifest("testnet");
  const t3n = new T3nClient({
    trustAnchor, wasmComponent,
    handlers: { EthSign: metamask_sign(address, undefined, apiKey) },
  });
  await t3n.handshake();
  const did = await t3n.authenticate(createEthAuthInput(address));
  return { t3n, tenantDid: did.value };
}

// Helper: create tenant
async function makeTenant() {
  const { t3n, tenantDid } = await makeClient();
  const tenant = new TenantClient({ t3n, baseUrl: getNodeUrl(), tenantDid });
  await tenant.tenant.me();
  return { t3n, tenant, tenantDid };
}

console.log("=".repeat(60));
console.log("EDGE CASE TEST 1: Duplicate contract registration (same version)");
console.log("=".repeat(60));
try {
  const { tenant } = await makeTenant();
  const { readFile } = await import("fs/promises");
  const wasm = await readFile("../contracts/z-tenant-attest/target/wasm32-wasip2/release/z_tenant_attest.wasm");
  
  try {
    await tenant.contracts.register({
      tail: "agent-attest",
      version: "0.1.0",  // same version already registered
      wasm,
    });
    console.log("RESULT: Duplicate registration SILENTLY SUCCEEDED (bug?)");
  } catch (e: any) {
    console.log("RESULT: Duplicate registration failed as expected");
    console.log("Error type:", e.constructor.name);
    console.log("Error message:", e.message);
    console.log("Error code:", e.code || e.errorCode || "none");
    // Check if error is helpful
    if (e.message.includes("already") || e.message.includes("exists") || e.message.includes("duplicate")) {
      console.log("ERROR QUALITY: Helpful — mentions duplicate/exists");
    } else {
      console.log("ERROR QUALITY: Unhelpful — no mention of duplicate/exists");
    }
  }
} catch (e: any) {
  console.log("Setup failed:", e.message);
}

console.log("\n" + "=".repeat(60));
console.log("EDGE CASE TEST 2: Execute non-existent contract");
console.log("=".repeat(60));
try {
  const { tenant } = await makeTenant();
  try {
    const result = await tenant.contracts.execute("nonexistent-contract-xyz", {
      version: "0.1.0",
      functionName: "register",
      input: {},
    });
    console.log("RESULT: Execute non-existent contract SUCCEEDED (bug!)");
    console.log("Response:", JSON.stringify(result));
  } catch (e: any) {
    console.log("RESULT: Execute non-existent contract failed as expected");
    console.log("Error type:", e.constructor.name);
    console.log("Error message:", e.message);
  }
} catch (e: any) {
  console.log("Setup failed:", e.message);
}

console.log("\n" + "=".repeat(60));
console.log("EDGE CASE TEST 3: Execute non-existent function");
console.log("=".repeat(60));
try {
  const { tenant } = await makeTenant();
  try {
    const result = await tenant.contracts.execute("agent-attest", {
      version: "0.1.0",
      functionName: "nonexistent-function-xyz",
      input: {},
    });
    console.log("RESULT: Execute non-existent function SUCCEEDED (bug!)");
    console.log("Response:", JSON.stringify(result));
  } catch (e: any) {
    console.log("RESULT: Execute non-existent function failed as expected");
    console.log("Error type:", e.constructor.name);
    console.log("Error message:", e.message);
  }
} catch (e: any) {
  console.log("Setup failed:", e.message);
}

console.log("\n" + "=".repeat(60));
console.log("EDGE CASE TEST 4: Execute with wrong version");
console.log("=".repeat(60));
try {
  const { tenant } = await makeTenant();
  try {
    const result = await tenant.contracts.execute("agent-attest", {
      version: "99.99.99",  // non-existent version
      functionName: "register",
      input: { agent_did: "did:t3n:test", capability: "test", issued_at: 1, signature: "sig" },
    });
    console.log("RESULT: Execute wrong version SUCCEEDED (bug?)");
    console.log("Response:", JSON.stringify(result));
  } catch (e: any) {
    console.log("RESULT: Execute wrong version failed as expected");
    console.log("Error type:", e.constructor.name);
    console.log("Error message:", e.message);
  }
} catch (e: any) {
  console.log("Setup failed:", e.message);
}

console.log("\n" + "=".repeat(60));
console.log("EDGE CASE TEST 5: Register with empty WASM bytes");
console.log("=".repeat(60));
try {
  const { tenant } = await makeTenant();
  try {
    const result = await tenant.contracts.register({
      tail: "empty-contract-test",
      version: "0.1.0",
      wasm: new Uint8Array(0),  // empty
    });
    console.log("RESULT: Empty WASM registration SUCCEEDED (bug!)");
    console.log("Contract ID:", result.contract_id);
  } catch (e: any) {
    console.log("RESULT: Empty WASM registration failed as expected");
    console.log("Error type:", e.constructor.name);
    console.log("Error message:", e.message);
  }
} catch (e: any) {
  console.log("Setup failed:", e.message);
}

console.log("\n" + "=".repeat(60));
console.log("EDGE CASE TEST 6: Register with invalid WASM (random bytes)");
console.log("=".repeat(60));
try {
  const { tenant } = await makeTenant();
  try {
    const randomBytes = new Uint8Array(1024);
    for (let i = 0; i < 1024; i++) randomBytes[i] = Math.floor(Math.random() * 256);
    const result = await tenant.contracts.register({
      tail: "invalid-wasm-test",
      version: "0.1.0",
      wasm: randomBytes,
    });
    console.log("RESULT: Invalid WASM registration SUCCEEDED (bug!)");
    console.log("Contract ID:", result.contract_id);
  } catch (e: any) {
    console.log("RESULT: Invalid WASM registration failed as expected");
    console.log("Error type:", e.constructor.name);
    console.log("Error message:", e.message);
  }
} catch (e: any) {
  console.log("Setup failed:", e.message);
}

console.log("\n" + "=".repeat(60));
console.log("EDGE CASE TEST 7: maps.create with duplicate name");
console.log("=".repeat(60));
try {
  const { tenant } = await makeTenant();
  try {
    await tenant.maps.create({
      tail: "attestations",  // already exists
      visibility: "private",
      writers: { only: [650] },
      readers: { only: [650] },
    });
    console.log("RESULT: Duplicate map creation SILENTLY SUCCEEDED (idempotent?)");
  } catch (e: any) {
    console.log("RESULT: Duplicate map creation failed");
    console.log("Error type:", e.constructor.name);
    console.log("Error message:", e.message);
  }
} catch (e: any) {
  console.log("Setup failed:", e.message);
}

console.log("\n" + "=".repeat(60));
console.log("EDGE CASE TEST 8: Execute with null input");
console.log("=".repeat(60));
try {
  const { tenant } = await makeTenant();
  try {
    const result = await tenant.contracts.execute("agent-attest", {
      version: "0.1.0",
      functionName: "register",
      input: null as any,
    });
    console.log("RESULT: Execute with null input SUCCEEDED");
    console.log("Response:", JSON.stringify(result));
  } catch (e: any) {
    console.log("RESULT: Execute with null input failed");
    console.log("Error type:", e.constructor.name);
    console.log("Error message:", e.message);
  }
} catch (e: any) {
  console.log("Setup failed:", e.message);
}

console.log("\n" + "=".repeat(60));
console.log("ALL EDGE CASE TESTS COMPLETE");
console.log("=".repeat(60));
