import standardsApplicability from "@/data/standards-applicability.json";
import techProfilesJson from "@/data/tech-profiles.json";
import {
  DIMENSION_FAMILIES,
  DIMENSION_FAMILY,
  DIMENSION_KEYS,
  type DimensionFamily,
  type DimensionKey,
  type StandardContract,
  StandardContractSchema,
  type StandardRefs,
  StandardRefsSchema,
  type TaskNode,
} from "@/schemas";

/**
 * Standards motoru (ADR-0027) — tüm tek-kaynak sözleşmeleri yükler, boyut aile gruplaması ve
 * düğüm standardRefs kapsamını türetir. UI (StandardsView + TaskDetailView) bunu okur.
 */
const RAW_MODULES = import.meta.glob("../data/standards/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;
const RAW = Object.values(RAW_MODULES);
export const STANDARDS: StandardContract[] = RAW.map((r) => StandardContractSchema.parse(r)).sort(
  (a, b) => a.id.localeCompare(b.id),
);
const BY_ID = new Map(STANDARDS.map((s) => [s.id, s]));
export const standardById = (id: string): StandardContract | undefined => BY_ID.get(id);

const REQUIRED_BY_LEVEL = standardsApplicability.requiredByLevel as Record<
  TaskNode["level"],
  string[]
>;
const CANONICAL_REF_VALUES = standardsApplicability.canonicalRefValues as Record<string, string>;
const UI_ROLES = new Set(standardsApplicability.surfaceOverlays.frontendUi.uiArtifactRoles);
const SEMANTIC_OVERLAYS = standardsApplicability.semanticOverlays as unknown as Array<{
  levels?: string[];
  uiArtifactRoles?: string[];
  match: string;
  requiredRefs: Record<string, string>;
}>;
interface TechProfile {
  id: string;
  name: string;
  surface: string;
  runtime: string[];
  primitive: string;
  headless: boolean;
  css: string;
  dataGrid: string;
  form: string;
  state: string;
  router: string;
  viz: string[];
  banned: string[];
  notes: string;
}
const TECH_PROFILES = (techProfilesJson.profiles as TechProfile[]).map(
  (profile) => [profile.id, profile] as const,
);
const TECH_BY_ID = new Map(TECH_PROFILES);
const TECH_REFERENCES = (techProfilesJson as { references?: string[] }).references ?? [];

/**
 * Korumalı app/module JSON'larını değiştirmeden seviye sözleşmelerini sayfaya yansıtır.
 * Executable düğümlerde aynı değerler ayrıca raw JSON'a materyalize edilir.
 */
export function effectiveStandardRefs(node: TaskNode): StandardRefs {
  const refs = StandardRefsSchema.parse(node.standardRefs ?? {});
  const mutable = refs as StandardRefs & Record<string, string | undefined>;
  for (const key of REQUIRED_BY_LEVEL[node.level] ?? []) {
    if (!mutable[key]) mutable[key] = CANONICAL_REF_VALUES[key];
  }
  if (node.uiArtifactRole && UI_ROLES.has(node.uiArtifactRole)) {
    for (const key of standardsApplicability.surfaceOverlays.frontendUi.requiredRefs) {
      if (key === "techProfileRef") continue;
      if (!mutable[key]) mutable[key] = CANONICAL_REF_VALUES[key];
    }
  }
  const text = [node.id, node.title, node.summary, ...node.tags].join(" ");
  for (const overlay of SEMANTIC_OVERLAYS) {
    if (overlay.levels && !overlay.levels.includes(node.level)) continue;
    if (overlay.uiArtifactRoles && !overlay.uiArtifactRoles.includes(node.uiArtifactRole ?? ""))
      continue;
    if (!new RegExp(overlay.match, "i").test(text)) continue;
    for (const [key, value] of Object.entries(overlay.requiredRefs)) {
      if (!mutable[key]) mutable[key] = value;
    }
  }
  return refs;
}

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
    const sr = effectiveStandardRefs(n);
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
  summary: string;
  source: string;
  references: string[];
  rules: StandardContract["rules"];
}

/** Bir düğümün çözülmüş standardRefs'leri (boş olmayanlar). */
export function nodeStandards(node: TaskNode): NodeStandard[] {
  const out: NodeStandard[] = [];
  const sr = effectiveStandardRefs(node);
  for (const [key, id] of Object.entries(sr)) {
    if (!id) continue;
    const s = BY_ID.get(id);
    if (s)
      out.push({
        key,
        id,
        name: s.name,
        summary: s.summary,
        source: `src/data/standards/${s.id}.json`,
        references: s.references,
        rules: s.rules,
      });
    else if (key === "techProfileRef") {
      const profile = TECH_BY_ID.get(id);
      if (!profile) continue;
      const banned = [...techProfilesJson.bannedGlobal, ...profile.banned];
      out.push({
        key,
        id,
        name: profile.name,
        summary: `${profile.surface}: runtime=${profile.runtime.join(", ")}; primitive=${profile.primitive}; css=${profile.css}; state=${profile.state || "none"}; router=${profile.router || "none"}. ${profile.notes}`,
        source: "src/data/tech-profiles.json",
        references: TECH_REFERENCES,
        rules: [
          {
            id: `tech-${id}-runtime`,
            rule: `Runtime yalnız ${profile.runtime.join(", ")} profilini kullanır; surface=${profile.surface}.`,
            rationale: "Görev, seçilmiş ve sürümlü teknoloji profilinden sapmadan üretilir.",
            severity: "must",
            check: "check-tech-profile",
          },
          {
            id: `tech-${id}-ui-stack`,
            rule: `Headless=${profile.headless}; primitive=${profile.primitive}; css=${profile.css}; form=${profile.form || "none"}; data-grid=${profile.dataGrid || "none"}; viz=${profile.viz.join(", ") || "none"}.`,
            rationale: "UI yapı taşları ve stil hattı aynı canonical profil tarafından yönetilir.",
            severity: "must",
            check: "check-tech-profile + check-ui-standards",
          },
          {
            id: `tech-${id}-banned`,
            rule: `Yasak bağımlılıklar: ${banned.join(", ")}.`,
            rationale: "Global ve profile özel yasaklar stack drift'ini engeller.",
            severity: "must",
            check: "check-tech-profile + dependency audit",
          },
        ],
      });
    }
  }
  return out;
}
