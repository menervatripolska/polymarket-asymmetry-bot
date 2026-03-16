import { AppConfig, Market, ModuleDecision } from "../domain/types.js";

export function runFeeAwarePlaceholder(market: Market, config: AppConfig): ModuleDecision {
  const anchor = market.lastTradePrice ?? market.yesPrice ?? 0.5;
  const midpointPenalty = 1 - Math.abs(anchor - 0.5) * 2;
  const penaltyBps = Math.round(midpointPenalty * 110);
  const netPass = config.thresholds.minNetEdgeBps - penaltyBps > 0;

  return {
    module: "fee-aware-placeholder",
    status: netPass ? "pass" : "warn",
    scoreDelta: netPass ? 5 : -12,
    reason: netPass
      ? "Placeholder fee drag acceptable"
      : "Placeholder fee drag elevated near midpoint pricing",
    meta: {
      estimatedFeePenaltyBps: penaltyBps,
    },
  };
}

