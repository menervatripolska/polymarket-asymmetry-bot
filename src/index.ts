import { GammaClient } from "./clients/gammaClient.js";
import { loadConfig } from "./config/index.js";
import { loadEnvFile } from "./config/loadEnv.js";
import { createHttpServer } from "./http/server.js";
import { Logger } from "./logging/logger.js";
import { ScanService } from "./services/scanService.js";

loadEnvFile();
const config = loadConfig();
const logger = new Logger(config.logLevel);
const gammaClient = new GammaClient(config);
const scanService = new ScanService(config, gammaClient, logger);
const startedAtMs = Date.now();

const server = createHttpServer({
  config,
  logger,
  scanService,
  startedAtMs,
});

scanService.start();

server.listen(config.port, config.host, () => {
  logger.info("HTTP server listening", {
    host: config.host,
    port: config.port,
    autoScanEnabled: config.autoScanEnabled,
  });
});

function shutdown(signal: string): void {
  logger.info("Received shutdown signal", { signal });
  scanService.stop();
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
