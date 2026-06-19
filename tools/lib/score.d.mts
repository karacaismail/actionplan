// tools/lib/score.mjs için tip bildirimi — TS testleri (.mjs import) typecheck'ten geçsin.
// Skorlar toEqual ile karşılaştırıldığından gevşek tipler yeterli (sapma testle korunur).
export function auditNode(node: unknown): unknown;
export function auditAll(nodes: unknown[]): unknown[];
export function summarize(audits: unknown[], weakestN?: number): unknown;
export function scoreDimension(dim: unknown, tokens: Set<string>): unknown;
export function domainTokens(node: unknown): Set<string>;
export const AUDIT_WEIGHTS: { concreteness: number; completeness: number; applicability: number };
export const GENERIC_MARKERS: string[];
export const DIMENSION_KEYS: string[];
