import { GammaClient } from "../clients/gammaClient.js";
import { AppConfig, HealthSnapshot, Market, ScanResult } from "../domain/types.js";
import { Logger } from "../logging/logger.js";
import { buildCandidate } from "../modules/asymmetryScorer.js";
import { runDuplicateSuppressorStub } from "../modules/duplicateSuppressor.js";
import { runFamilyCap } from "../modules/familyCap.js";
import { runFeeAwarePlaceholder } from "../modules/feeAware.js";
import { runLiquidityGate } from "../modules/liquidityGate.js";
import { runResolutionFilter } from "../modules/resolutionFilter.js";
import { runStaleBookDetectorStub } from "../modules/staleBookDetector.js";
import { nowIso } from "../utils/time.js";

export class ScanService {
  private latestScan?: ScanResult;
  private scanInFlight?: Promise<ScanResult>;
  private intervalHandle?: NodeJS.Timeout;

  constructor(
    private readonly config: AppConfig,
    private readonly gammaClient: GammaClient,
    private readonly logger: Logger,
  ) {}

  start(): void {
    if (!this.config.autoScanEnabled) {
      this.logger.info("Auto-scan disabled");
      return;
    }
    void this.runScan("startup").catch((error: unknown) => {
      this.logger.error("Initial scan failed", { error: error instanceof Error ? error.message : String(error) });
    });
    this.intervalHandle = setInterval(() => {
      void this.runScan("interval").catch((error: unknown) => {
        this.logger.error("Scheduled scan failed", { error: error instanceof Error ? error.message : String(error) });
      });
    }, this.config.scanIntervalMs);
  }

  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
    }
  }

  getLatestScan(): ScanResult | undefined {
    return this.latestScan;
  }

  getHealthSnapshot(startedAtMs: number): HealthSnapshot {
    return {
      status: this.latestScan ? "ok" : "degraded",
      uptimeSec: Math.round((Date.now() - startedAtMs) / 1000),
      lastScanAt: this.latestScan?.finishedAt,
      lastScanDurationMs: this.latestScan?.durationMs,
      autoScanEnabled: this.config.autoScanEnabled,
    };
  }

  async runScan(trigger: string): Promise<ScanResult> {
    if (this.scanInFlight) {
      return this.scanInFlight;
    }

    this.scanInFlight = this.executeScan(trigger).finally(() => {
      this.scanInFlight = undefined;
    });
    return this.scanInFlight;
  }

  private async executeScan(trigger: string): Promise<ScanResult> {
    const started = Date.now();
    const startedAt = nowIso();
    this.logger.info("Starting market scan", { trigger });

    const [markets, events] = await Promise.all([
      this.gammaClient.fetchMarkets(),
      this.gammaClient.fetchEvents(),
    ]);

    const candidateResult = this.scoreMarkets(markets);
    const finishedAt = nowIso();
    const result: ScanResult = {
      startedAt,
      finishedAt,
      durationMs: Date.now() - started,
      stats: {
        marketsFetched: markets.length,
        eventsFetched: events.length,
        candidates: candidateResult.topCandidates.length,
        watchlist: candidateResult.watchlist.length,
        blocked: candidateResult.blocked.length,
      },
      topCandidates: candidateResult.topCandidates,
      watchlist: candidateResult.watchlist,
      blocked: candidateResult.blocked,
      warnings: candidateResult.warnings,
    };

    this.latestScan = result;
    this.logger.info("Completed market scan", {
      trigger,
      durationMs: result.durationMs,
      candidates: result.stats.candidates,
      watchlist: result.stats.watchlist,
      blocked: result.stats.blocked,
    });
    return result;
  }

  private scoreMarkets(markets: Market[]) {
    const familyCounts = new Map<string, number>();
    const seenQuestionKeys = new Set<string>();
    const warnings: string[] = [];

    const scored = markets.map((market) => {
      const decisions = [
        runStaleBookDetectorStub(market),
        runDuplicateSuppressorStub(market, seenQuestionKeys),
        runFamilyCap(market, familyCounts, this.config),
        runLiquidityGate(market, this.config),
        runResolutionFilter(market, this.config),
        runFeeAwarePlaceholder(market, this.config),
      ];
      return buildCandidate(market, this.config, decisions);
    });

    const topCandidates = scored
      .filter((item) => item.status === "candidate")
      .sort((a, b) => b.score - a.score)
      .slice(0, 25);
    const watchlist = scored
      .filter((item) => item.status === "watch")
      .sort((a, b) => b.score - a.score)
      .slice(0, 25);
    const blocked = scored
      .filter((item) => item.status === "blocked")
      .sort((a, b) => a.score - b.score)
      .slice(0, 25);

    if (topCandidates.length === 0) {
      warnings.push("No candidate markets passed current conservative thresholds.");
    }

    return { topCandidates, watchlist, blocked, warnings };
  }
}

