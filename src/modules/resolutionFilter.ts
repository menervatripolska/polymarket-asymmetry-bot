import { AppConfig, Market, ModuleDecision } from "../domain/types.js";
import { diffDays, nowIso } from "../utils/time.js";

export function runResolutionFilter(market: Market, config: AppConfig): ModuleDecision {
  const daysToClose = diffDays(nowIso(), market.closeTime ?? market.endDate);
  if (daysToClose !== undefined && daysToClose < config.thresholds.minDaysToClose) {
    return {
      module: "resolution-filter",
      status: "reject",
      scoreDelta: -35,
      reason: `Market closes too soon (${daysToClose.toFixed(2)} days)`,
    };
  }
  if (daysToClose !== undefined && daysToClose > config.thresholds.maxDaysToClose) {
    return {
      module: "resolution-filter",
      status: "warn",
      scoreDelta: -8,
      reason: `Market horizon too long for MVP (${daysToClose.toFixed(1)} days)`,
    };
  }
  const wording = `${market.question} ${market.description ?? ""}`.toLowerCase();
  const ambiguitySignals = ["according to", "or equivalent", "subjective", "committee", "review"];
  const ambiguous = ambiguitySignals.some((token) => wording.includes(token));
  if (ambiguous && !market.resolutionSource) {
    return {
      module: "resolution-filter",
      status: "reject",
      scoreDelta: -30,
      reason: "Resolution wording looks ambiguous and no source is provided",
    };
  }
  return {
    module: "resolution-filter",
    status: ambiguous ? "warn" : "pass",
    scoreDelta: ambiguous ? -5 : 15,
    reason: ambiguous ? "Resolution requires manual review later" : "Resolution profile acceptable for MVP",
    meta: { daysToClose },
  };
}

