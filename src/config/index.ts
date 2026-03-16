import { AppConfig } from "../domain/types.js";
import { asBoolean, asNumber, asString } from "../utils/parse.js";

export function loadConfig(): AppConfig {
  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: asNumber(process.env.PORT, 3000),
    host: process.env.HOST ?? "0.0.0.0",
    logLevel: (asString(process.env.LOG_LEVEL) ?? "info") as AppConfig["logLevel"],
    scanIntervalMs: asNumber(process.env.SCAN_INTERVAL_MS, 300000),
    requestTimeoutMs: asNumber(process.env.REQUEST_TIMEOUT_MS, 12000),
    autoScanEnabled: asBoolean(process.env.ENABLE_AUTO_SCAN, true),
    polymarket: {
      gammaBaseUrl: process.env.POLYMARKET_GAMMA_BASE_URL ?? "https://gamma-api.polymarket.com",
      marketsPath: process.env.POLYMARKET_MARKETS_PATH ?? "/markets",
      eventsPath: process.env.POLYMARKET_EVENTS_PATH ?? "/events",
      marketLimit: asNumber(process.env.POLYMARKET_MARKET_LIMIT, 150),
    },
    thresholds: {
      minLiquidityUsd: asNumber(process.env.MIN_LIQUIDITY_USD, 15000),
      minVolume24hUsd: asNumber(process.env.MIN_VOLUME_24H_USD, 2500),
      maxSpreadBps: asNumber(process.env.MAX_SPREAD_BPS, 1200),
      minDaysToClose: asNumber(process.env.MIN_DAYS_TO_CLOSE, 1),
      maxDaysToClose: asNumber(process.env.MAX_DAYS_TO_CLOSE, 45),
      minNetEdgeBps: asNumber(process.env.MIN_NET_EDGE_BPS, 150),
      familySoftCap: asNumber(process.env.FAMILY_SOFT_CAP, 2),
      familyHardCap: asNumber(process.env.FAMILY_HARD_CAP, 3),
    },
  };
}

export function sanitizedConfig(config: AppConfig): AppConfig {
  return config;
}

