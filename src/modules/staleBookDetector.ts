import { Market, ModuleDecision } from "../domain/types.js";

export function runStaleBookDetectorStub(market: Market): ModuleDecision {
  if (!market.updatedAt) {
    return {
      module: "stale-book-detector-stub",
      status: "warn",
      scoreDelta: -8,
      reason: "No update timestamp in public metadata; CLOB freshness still required later",
    };
  }
  const ageMs = Date.now() - new Date(market.updatedAt).getTime();
  if (!Number.isFinite(ageMs)) {
    return {
      module: "stale-book-detector-stub",
      status: "warn",
      scoreDelta: -6,
      reason: "Unparseable update timestamp",
    };
  }
  if (ageMs > 1000 * 60 * 60 * 12) {
    return {
      module: "stale-book-detector-stub",
      status: "warn",
      scoreDelta: -10,
      reason: "Public metadata appears old; treat as low confidence",
      meta: { ageMs },
    };
  }
  return {
    module: "stale-book-detector-stub",
    status: "pass",
    scoreDelta: 3,
    reason: "Metadata freshness acceptable for MVP stub",
    meta: { ageMs },
  };
}

