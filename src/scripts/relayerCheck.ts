import { loadEnvFile } from "../config/loadEnv.js";
import { runRelayerIntegrityCheck } from "../services/relayerIntegrityService.js";

async function main(): Promise<void> {
  loadEnvFile();

  try {
    const result = await runRelayerIntegrityCheck();
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(
      JSON.stringify({
        status: "error",
        message: error instanceof Error ? error.message : String(error),
      }),
    );
    process.exitCode = 1;
  }
}

main();
