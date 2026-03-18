import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { sanitizedConfig } from "../config/index.js";
import { AppConfig } from "../domain/types.js";
import { Logger } from "../logging/logger.js";
import { runRelayerIntegrityCheck } from "../services/relayerIntegrityService.js";
import { ScanService } from "../services/scanService.js";

interface ServerDeps {
  config: AppConfig;
  logger: Logger;
  scanService: ScanService;
  startedAtMs: number;
}

export function createHttpServer(deps: ServerDeps) {
  const server = createServer(async (req, res) => {
    try {
      await routeRequest(req, res, deps);
    } catch (error) {
      deps.logger.error("Unhandled request error", {
        error: error instanceof Error ? error.message : String(error),
      });
      sendJson(res, 500, { error: "internal_error" });
    }
  });

  return server;
}

async function routeRequest(
  req: IncomingMessage,
  res: ServerResponse,
  deps: ServerDeps,
): Promise<void> {
  const method = req.method ?? "GET";
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  if (method === "GET" && url.pathname === "/") {
    return sendJson(res, 200, {
      name: "polymarket-asymmetry-bot",
      mode: deps.config.nodeEnv,
      endpoints: ["/health", "/config", "/scan", "/scan/run", "/relayer-check"],
    });
  }

  if (method === "GET" && url.pathname === "/health") {
    return sendJson(res, 200, deps.scanService.getHealthSnapshot(deps.startedAtMs));
  }

  if (method === "GET" && url.pathname === "/config") {
    return sendJson(res, 200, sanitizedConfig(deps.config));
  }

  if (method === "GET" && url.pathname === "/scan") {
    const latest = deps.scanService.getLatestScan();
    return sendJson(res, latest ? 200 : 503, latest ?? { error: "scan_not_ready" });
  }

  if (method === "POST" && url.pathname === "/scan/run") {
    const result = await deps.scanService.runScan("manual");
    return sendJson(res, 200, result);
  }

  if (method === "GET" && url.pathname === "/relayer-check") {
    const expectedToken = process.env.RELAYER_CHECK_TOKEN;
    if (expectedToken) {
      const providedToken = url.searchParams.get("token") ?? getBearerToken(req.headers["authorization"]);
      if (!providedToken || providedToken !== expectedToken) {
        return sendJson(res, 401, { error: "unauthorized" });
      }
    }

    try {
      const result = await runRelayerIntegrityCheck();
      return sendJson(res, 200, result);
    } catch (error) {
      return sendJson(res, 500, {
        status: "error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return sendJson(res, 404, { error: "not_found" });
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  const payload = JSON.stringify(body, null, 2);
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(payload);
}

function getBearerToken(header?: string): string | null {
  if (!header) {
    return null;
  }
  const [scheme, token] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    return null;
  }
  return token.trim();
}

