/**
 * Tip bildirimi — tools/lib/url-policy-rules.mjs v2 (vitest/TS tüketimi için).
 * Kural aynası: docs/url-policy.md kanonik kararlarının koruma seti (check-url-policy kapısı).
 * v2: bütün-dosya muafiyeti (EXEMPT_FILES) kaldırıldı; scope'lu muafiyet + granular probe.
 */

export interface UrlPolicyForbiddenPattern {
  id: string;
  pattern: RegExp;
  reason: string;
}

export interface UrlPolicyRequiredProbe {
  missingId: string;
  pattern: RegExp;
}

export interface UrlPolicyRequiredDecision {
  id: string;
  description: string;
  probes: readonly UrlPolicyRequiredProbe[];
}

export type UrlPolicyExemptionScope =
  | { kind: "inline-marker" }
  | { kind: "section"; heading: string };

export interface UrlPolicyExemption {
  file: string;
  scope: UrlPolicyExemptionScope;
  patternIds: readonly string[] | "all";
  reason: string;
}

export interface UrlPolicyViolation {
  file: string;
  line: number;
  patternId: string;
  excerpt: string;
}

export interface UrlPolicyCanonicalResult {
  ok: boolean;
  missing: string[];
}

export declare const INLINE_EXEMPT_MARKER: "url-policy-exempt";
export declare const FORBIDDEN_PATTERNS: readonly UrlPolicyForbiddenPattern[];
export declare const EXEMPTIONS: readonly UrlPolicyExemption[];
export declare const REQUIRED_DECISIONS: readonly UrlPolicyRequiredDecision[];
export declare function collectMarkdownFiles(docsDir: string): string[];
export declare function scanContentForViolations(
  content: string,
  fileName: string,
): UrlPolicyViolation[];
export declare function scanDocsForViolations(docsDir: string): UrlPolicyViolation[];
export declare function scanSourceForViolations(srcDir: string): UrlPolicyViolation[];
export declare function verifyCanonicalDecisionsContent(content: string): UrlPolicyCanonicalResult;
export declare function verifyCanonicalDecisions(urlPolicyPath: string): UrlPolicyCanonicalResult;
