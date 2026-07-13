/**
 * Tip bildirimi — tools/lib/ui-impact.mjs (vitest/TS tüketimi için).
 * Davranış kuralları .mjs'te; şema karşılığı src/schemas/ui-delivery.ts +
 * src/schemas/storybook-registry.ts (SB-ROOT v3 alanları dahil).
 */

export interface UiImpactSignal {
  impact: "none" | "indirect" | "direct" | "master-component" | "surface";
  match: string;
}

export interface UiImpactResult {
  impact: "none" | "indirect" | "direct" | "master-component" | "surface";
  signals: UiImpactSignal[];
}

/** SB-ROOT-2 — beş kanonik uiArtifactRole değeri (gap-report §3). */
export type UiArtifactRoleValue =
  | "produces-ui"
  | "changes-ui-contract"
  | "governs-ui"
  | "consumes-ui"
  | "no-ui";

/** deriveUiArtifactRole dönüşü: rol + karar kaynağı + classifyUiImpact teşhis sinyalleri. */
export interface UiArtifactRoleDecision {
  role: UiArtifactRoleValue;
  source: "declared" | "registry" | "heuristic";
  signals: UiImpactSignal[];
}

/** Ratchet baseline (hedef biçim: LegacyRatchetSchema; eski biçimde yalnız allowedWarnings). */
export interface UiDeliveryGateBaseline {
  allowedWarnings?: string[];
  /** SB-ROOT-4 origin kilidi: sha256(JSON.stringify(originAllowedWarnings)). */
  originChecksum?: string;
  originAllowedWarnings?: string[];
  owner?: string;
  deadline?: string;
  wave?: string | number;
}

/** Gate v3 opsiyonları (SB-ROOT-3/5). */
export interface UiDeliveryGateOptions {
  /** ui-artifact-roles.json aynası: {nodeId: rol} açık karar haritası. */
  roleRegistry?: Record<string, UiArtifactRoleValue | string>;
  /** master-components.json kimlik seti; verilirse masterComponentRefs FK denetlenir. */
  masterComponents?: Set<string>;
}

/** Migration sayacı: decided = açık karar (beyan/uiDelivery/registry); undecided = karar borcu. */
export interface UiDeliveryGateMigration {
  decided: number;
  undecided: number;
}

export interface UiDeliveryGateResult {
  result: "PASS" | "FAIL" | "NO_CANDIDATES" | "REVIEW_REQUIRED" | "MIGRATION_INCOMPLETE";
  candidates: number;
  violations: string[];
  warnings: string[];
  reviewPending: string[];
  /** SB-ROOT-3 — kararsız corpus / susturulmuş baseline PASS'e aklanamaz. */
  migration: UiDeliveryGateMigration;
  /** SB-GOV §11 — violation/warning mesajlarındaki governance etiketlerinden türetilen sinyaller. */
  signals: string[];
}

/** verifyBaselineIntegrity dönüşü (SB-ROOT-4). */
export interface BaselineIntegrityResult {
  ok: boolean;
  problems: string[];
}

export declare const UI_IMPACT_ORDER: readonly string[];
export declare function classifyUiImpact(node: Record<string, unknown>): UiImpactResult;
export declare function deriveUiArtifactRole(
  node: Record<string, unknown>,
  roleRegistry?: Record<string, UiArtifactRoleValue | string>,
): UiArtifactRoleDecision;
export declare function validateUiDelivery(
  node: Record<string, unknown>,
  registries?: { masterComponents?: Set<string> },
): string[];
export declare function evaluateUiDeliveryGate(
  nodes: Array<Record<string, unknown>>,
  baseline?: UiDeliveryGateBaseline,
  opts?: UiDeliveryGateOptions,
): UiDeliveryGateResult;
export declare function verifyBaselineIntegrity(
  baseline: UiDeliveryGateBaseline | Record<string, unknown>,
): BaselineIntegrityResult;
