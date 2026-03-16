import { AppConfig, Market, ModuleDecision } from "../domain/types.js";

export function runLiquidityGate(market: Market, config: AppConfig): ModuleDecision {
  const spreadBps = market.spreadBps ?? config.thresholds.maxSpreadBps + 1;
  if (market.liquidityUsd < config.thresholds.minLiquidityUsd) {
    return {
      module: "liquidity-gate",
      status: "reject",
      scoreDelta: -35,
      reason: `Liquidity ${market.liquidityUsd.toFixed(0)} below threshold`,
    };
  }
  if (market.volume24hUsd < config.thresholds.minVolume24hUsd) {
    return {
      module: "liquidity-gate",
      status: "warn",
      scoreDelta: -10,
      reason: `24h volume ${market.volume24hUsd.toFixed(0)} below preferred threshold`,
    };
  }
  if (spreadBps > config.thresholds.maxSpreadBps) {
    return {
      module: "liquidity-gate",
      status: "reject",
      scoreDelta: -30,
      reason: `Spread proxy ${spreadBps.toFixed(0)} bps above cap`,
    };
  }
  return {
    module: "liquidity-gate",
    status: "pass",
    scoreDelta: 15,
    reason: "Liquidity and spread proxy acceptable",
    meta: {
      spreadBps,
    },
  };
}

