import aiGovernance from "@/data/standards/ai-governance.json";
import architecture from "@/data/standards/architecture.json";
import codingStandards from "@/data/standards/coding-standards.json";
import dataApiContract from "@/data/standards/data-api-contract.json";
import dependencyPolicy from "@/data/standards/dependency-policy.json";
import designSystem from "@/data/standards/design-system.json";
import observability from "@/data/standards/observability.json";
import qualityGates from "@/data/standards/quality-gates.json";
import releaseVersioning from "@/data/standards/release-versioning.json";
import shortCode from "@/data/standards/short-code.json";
import stateManagement from "@/data/standards/state-management.json";
import testingStrategy from "@/data/standards/testing-strategy.json";
import uiComponents from "@/data/standards/ui-components.json";
import uxInteraction from "@/data/standards/ux-interaction.json";
import {
  DIMENSION_FAMILIES,
  DIMENSION_FAMILY,
  DIMENSION_KEYS,
  type DimensionFamily,
  type DimensionKey,
  type StandardContract,
  StandardContractSchema,
  type TaskNode,
} from "@/schemas";

/**
 * Standards motoru (ADR-0027) — 14 tek-kaynak sözleşmeyi yükler, boyut aile gruplaması ve
 * düğüm standardRefs kapsamını türetir. UI (StandardsView + TaskDetailView) bunu okur.
 */
const RAW = [
  architecture,
  codingStandards,
  shortCode,
  qualityGates,
  designSystem,
  uiComponents,
  uxInteraction,
  dataApiContract,
  stateManagement,
  observability,
  testingStrategy,
  releaseVersioning,
  aiGovernance,
  dependencyPolicy,
];
export const STANDARDS: StandardContract[] = RAW.map((r) => StandardContractSchema.parse(r)).sort(
  (a, b) => a.id.localeCompare(b.id),
);
const BY_ID = new Map(STANDARDS.map((s) => [s.id, s]));
export const standardById = (id: string): StandardContract | undefined => BY_ID.get(id);

/** Boyutları ailelerine göre kümeler (ontoloji görünümü). */
export function dimensionsByFamily(): { family: DimensionFamily; keys: DimensionKey[] }[] {
  return DIMENSION_FAMILIES.map((family) => ({
    family,
    keys: DIMENSION_KEYS.filter((k) => DIMENSION_FAMILY[k] === family),
  }));
}

export interface StandardCoverage {
  id: string;
  name: string;
  family: string;
  rules: number;
  refCount: number;
}

/** Her standardın kaç düğüm tarafından referans verildiğini sayar (kapsam). */
export function coverageByStandard(nodes: TaskNode[]): StandardCoverage[] {
  const counts = new Map<string, number>();
  for (const n of nodes) {
    const sr = n.standardRefs;
    if (!sr) continue;
    for (const v of Object.values(sr))
      if (v && BY_ID.has(v)) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return STANDARDS.map((s) => ({
    id: s.id,
    name: s.name,
    family: s.family,
    rules: s.rules.length,
    refCount: counts.get(s.id) ?? 0,
  }));
}

export interface NodeStandard {
  key: string;
  id: string;
  name: string;
}

/** Bir düğümün çözülmüş standardRefs'leri (boş olmayanlar). */
export function nodeStandards(node: TaskNode): NodeStandard[] {
  const out: NodeStandard[] = [];
  const sr = node.standardRefs;
  if (!sr) return out;
  for (const [key, id] of Object.entries(sr)) {
    if (!id) continue;
    const s = BY_ID.get(id);
    if (s) out.push({ key, id, name: s.name });
    else if (key === "techProfileRef") out.push({ key, id, name: id });
  }
  return out;
}
