// Tip bildirimi — dimension-semantics.mjs'in TS yüzü (score.d.mts deseni).
export interface SemanticRule {
  enforce: "fail" | "warn";
  must: Record<string, RegExp>;
  anyOf: Record<string, RegExp>;
}
export declare const SEMANTIC_RULES: Record<string, SemanticRule>;
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
export declare function nodeSemanticFindings(node: {
  id?: string;
  dimensions?: Record<string, { status?: string; items?: string[]; notes?: string } | undefined>;
}): { violations: string[]; warnings: string[] };
export declare function nodeSemanticViolations(node: {
  id?: string;
  dimensions?: Record<string, { status?: string; items?: string[]; notes?: string } | undefined>;
}): string[];
