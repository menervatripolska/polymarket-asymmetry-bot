import { AppConfig, Market, ModuleDecision } from "../domain/types.js";

export function runFamilyCap(
  market: Market,
  familyCounts: Map<string, number>,
  config: AppConfig,
): ModuleDecision {
  const current = familyCounts.get(market.familyKey) ?? 0;
  familyCounts.set(market.familyKey, current + 1);

  if (current >= config.thresholds.familyHardCap) {
    return {
      module: "family-cap",
      status: "reject",
      scoreDelta: -30,
      reason: `Family already has ${current} markets, above hard cap`,
      meta: { familyKey: market.familyKey, count: current },
    };
  }
  if (current >= config.thresholds.familySoftCap) {
    return {
      module: "family-cap",
      status: "warn",
      scoreDelta: -10,
      reason: `Family crowding at ${current} markets`,
      meta: { familyKey: market.familyKey, count: current },
    };
  }
  return {
    module: "family-cap",
    status: "pass",
    scoreDelta: 4,
    reason: "Family exposure within scan cap",
    meta: { familyKey: market.familyKey, count: current },
  };
}

