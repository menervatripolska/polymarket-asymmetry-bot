export type LogLevel = "debug" | "info" | "warn" | "error";

export interface AppConfig {
  nodeEnv: string;
  port: number;
  host: string;
  logLevel: LogLevel;
  scanIntervalMs: number;
  requestTimeoutMs: number;
  autoScanEnabled: boolean;
  polymarket: {
    gammaBaseUrl: string;
    marketsPath: string;
    eventsPath: string;
    marketLimit: number;
  };
  thresholds: {
    minLiquidityUsd: number;
    minVolume24hUsd: number;
    maxSpreadBps: number;
    minDaysToClose: number;
    maxDaysToClose: number;
    minNetEdgeBps: number;
    familySoftCap: number;
    familyHardCap: number;
  };
}

export interface MarketEvent {
  id: string;
  title: string;
  slug?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}

export interface Market {
  id: string;
  question: string;
  slug?: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  category?: string;
  eventId?: string;
  eventTitle?: string;
  familyKey: string;
  liquidityUsd: number;
  volume24hUsd: number;
  volumeTotalUsd: number;
  bestBid?: number;
  bestAsk?: number;
  lastTradePrice?: number;
  yesPrice?: number;
  noPrice?: number;
  spreadBps?: number;
  closeTime?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
  resolutionSource?: string;
  description?: string;
  outcomes?: string[];
  raw: Record<string, unknown>;
}

export interface ModuleDecision {
  module: string;
  status: "pass" | "warn" | "reject";
  scoreDelta: number;
  reason: string;
  meta?: Record<string, unknown>;
}

export interface CandidateScore {
  marketId: string;
  marketQuestion: string;
  familyKey: string;
  score: number;
  netEdgeBps: number;
  confidence: number;
  status: "candidate" | "watch" | "blocked";
  decisions: ModuleDecision[];
  metrics: {
    liquidityUsd: number;
    volume24hUsd: number;
    spreadBps?: number;
    daysToClose?: number;
  };
}

export interface ScanStats {
  marketsFetched: number;
  eventsFetched: number;
  candidates: number;
  watchlist: number;
  blocked: number;
}

export interface ScanResult {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  stats: ScanStats;
  topCandidates: CandidateScore[];
  watchlist: CandidateScore[];
  blocked: CandidateScore[];
  warnings: string[];
}

export interface HealthSnapshot {
  status: "ok" | "degraded";
  uptimeSec: number;
  lastScanAt?: string;
  lastScanDurationMs?: number;
  autoScanEnabled: boolean;
}

