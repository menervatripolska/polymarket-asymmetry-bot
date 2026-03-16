export interface OrderIntent {
  marketId: string;
  familyKey: string;
  side: "yes" | "no";
  limitPrice: number;
  maxNotionalUsd: number;
  rationale: string;
}

export interface ExecutionDecision {
  action: "allow" | "reduce" | "reject";
  reason: string;
  intent?: OrderIntent;
}

