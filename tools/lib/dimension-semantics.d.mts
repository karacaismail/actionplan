// Tip bildirimi — dimension-semantics.mjs'in TS yüzü (score.d.mts deseni).
export interface SemanticRule {
  min: number;
  concepts: Record<string, RegExp>;
}
export declare const SEMANTIC_RULES: Record<
  "dataLifecycle" | "observability" | "reliability",
  SemanticRule
>;
export declare const SEMANTIC_KEYS: string[];
export interface SemanticEvaluation {
  ok: boolean;
  found: string[];
  missing: string[];
}
export declare function evaluateDimensionSemantics(
  key: string,
  dim: { items?: string[]; notes?: string },
): SemanticEvaluation;
export declare function nodeSemanticViolations(node: {
  id?: string;
  dimensions?: Record<string, { status?: string; items?: string[]; notes?: string } | undefined>;
}): string[];
