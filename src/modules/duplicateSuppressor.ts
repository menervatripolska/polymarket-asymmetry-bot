import { Market, ModuleDecision } from "../domain/types.js";

export function runDuplicateSuppressorStub(
  market: Market,
  seenQuestionKeys: Set<string>,
): ModuleDecision {
  const normalized = market.question.trim().toLowerCase().replace(/\s+/g, " ");
  if (seenQuestionKeys.has(normalized)) {
    return {
      module: "duplicate-suppressor-stub",
      status: "reject",
      scoreDelta: -40,
      reason: "Duplicate question key detected in current scan",
    };
  }
  seenQuestionKeys.add(normalized);
  return {
    module: "duplicate-suppressor-stub",
    status: "pass",
    scoreDelta: 2,
    reason: "No duplicate detected in current scan window",
  };
}

