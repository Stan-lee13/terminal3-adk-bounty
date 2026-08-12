import {
  T3nClient,
  setEnvironment,
  loadWasmComponent,
  fetchTrustedManifest,
  eth_get_address,
  metamask_sign,
  createEthAuthInput,
} from "@terminal3/t3n-sdk";

setEnvironment("testnet");
const apiKey = process.env.T3N_API_KEY!;

async function main() {
  const wasmComponent = await loadWasmComponent();
  const trustAnchor = await fetchTrustedManifest("testnet");
  const address = eth_get_address(apiKey);
  const validHandlers = { EthSign: metamask_sign(address, undefined, apiKey) };

  console.log("=== TEST A1: No trustAnchor ===");
  try {
    const client = new T3nClient({
      wasmComponent,
      handlers: validHandlers,
    } as any);
    console.log("Constructor succeeded without trustAnchor!");
    console.log("Attempting handshake...");
    await client.handshake();
    console.log("Handshake succeeded without trustAnchor!");
  } catch (e: any) {
    console.log("Threw error:");
    console.log("Error type:", e?.constructor?.name);
    console.log("Error message:", e?.message);
  }

  console.log("\n=== TEST A2: No wasmComponent ===");
  try {
    const client = new T3nClient({
      trustAnchor,
      handlers: validHandlers,
    } as any);
    console.log("Constructor succeeded without wasmComponent!");
    console.log("Attempting handshake...");
    await client.handshake();
    console.log("Handshake succeeded without wasmComponent!");
  } catch (e: any) {
    console.log("Threw error:");
    console.log("Error type:", e?.constructor?.name);
    console.log("Error message:", e?.message);
  }

  console.log("\n=== TEST A3: No handlers ===");
  try {
    const client = new T3nClient({
      trustAnchor,
      wasmComponent,
    } as any);
    console.log("Constructor succeeded without handlers!");
    console.log("Attempting handshake...");
    await client.handshake();
    console.log("Handshake succeeded without handlers!");
    console.log("Attempting authenticate...");
    await client.authenticate(createEthAuthInput(address));
    console.log("Authenticate succeeded without handlers!");
  } catch (e: any) {
    console.log("Threw error:");
    console.log("Error type:", e?.constructor?.name);
    console.log("Error message:", e?.message);
  }

  console.log("\n=== TEST A4: Empty handlers object ===");
  try {
    const client = new T3nClient({
      trustAnchor,
      wasmComponent,
      handlers: {},
    } as any);
    console.log("Constructor succeeded with empty handlers object!");
    console.log("Attempting handshake...");
    await client.handshake();
    console.log("Handshake succeeded with empty handlers object!");
    console.log("Attempting authenticate...");
    await client.authenticate(createEthAuthInput(address));
    console.log("Authenticate succeeded with empty handlers object!");
  } catch (e: any) {
    console.log("Threw error:");
    console.log("Error type:", e?.constructor?.name);
    console.log("Error message:", e?.message);
  }
}

main().catch(console.error);
