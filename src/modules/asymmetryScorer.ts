import { AppConfig, CandidateScore, Market, ModuleDecision } from "../domain/types.js";
import { diffDays, nowIso } from "../utils/time.js";

export function buildCandidate(
  market: Market,
  config: AppConfig,
  decisions: ModuleDecision[],
): CandidateScore {
  const baseScore = computeBaseScore(market, config);
  const score = Math.max(0, Math.min(100, baseScore + decisions.reduce((sum, item) => sum + item.scoreDelta, 0)));
  const rejected = decisions.some((item) => item.status === "reject");
  const warned = decisions.some((item) => item.status === "warn");
  const feePenalty = Number(decisions.find((item) => item.module === "fee-aware-placeholder")?.meta?.estimatedFeePenaltyBps ?? 0);
  const netEdgeBps = Math.max(0, Math.round(score * 3 - feePenalty));
  const status: CandidateScore["status"] = rejected
    ? "blocked"
    : score >= 70 && netEdgeBps >= config.thresholds.minNetEdgeBps
      ? "candidate"
      : warned || score < 55
        ? "watch"
        : "candidate";

  return {
    marketId: market.id,
    marketQuestion: market.question,
    familyKey: market.familyKey,
    score,
    netEdgeBps,
    confidence: Math.max(0.05, Number((score / 100).toFixed(2))),
    status,
    decisions,
    metrics: {
      liquidityUsd: market.liquidityUsd,
      volume24hUsd: market.volume24hUsd,
      spreadBps: market.spreadBps,
      daysToClose: diffDays(nowIso(), market.closeTime ?? market.endDate),
    },
  };
}

function computeBaseScore(market: Market, config: AppConfig): number {
  const liquidityComponent = clamp((market.liquidityUsd / config.thresholds.minLiquidityUsd) * 20, 0, 30);
  const volumeComponent = clamp((market.volume24hUsd / config.thresholds.minVolume24hUsd) * 15, 0, 20);
  const spreadComponent = market.spreadBps
    ? clamp(((config.thresholds.maxSpreadBps - market.spreadBps) / config.thresholds.maxSpreadBps) * 20, 0, 20)
    : 4;
  const daysToClose = diffDays(nowIso(), market.closeTime ?? market.endDate);
  const horizonComponent =
    daysToClose === undefined ? 5 : clamp(15 - Math.abs(daysToClose - 7), 0, 15);
  const activityComponent = market.active && !market.closed && !market.archived ? 10 : -20;

  return liquidityComponent + volumeComponent + spreadComponent + horizonComponent + activityComponent;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

