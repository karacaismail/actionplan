#!/usr/bin/env node
/**
 * Stage 0/2 app kimliği kapısı.
 *
 * Bu denetleyici mevcut generated WBS snapshot'ının app-catalog-decisions kayıt
 * defterinde eksiksiz kapsandığını doğrular. Kayıt defteri runtime implementasyonu
 * veya enterprise-ready kanıtı değildir; yalnız kimlik/disposition karar katmanıdır.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const REGISTRY_PATH = path.join(ROOT, "src", "data", "app-catalog-decisions.json");
const NODE_DIR = path.join(ROOT, "src", "data", "generated", "nodes");

const EXACT_MERGES = [
  ["s-clinic", "dist-clinic"],
  ["s-education", "dist-education"],
  ["s-legaltech", "dist-legal"],
  ["s-membership", "dist-membership"],
  ["s-restaurant", "dist-restaurant"],
];

const MANDATORY_APP_CANDIDATES = [
  "dist-agritech",
  "dist-clinic",
  "dist-construction",
  "dist-education",
  "dist-legal",
  "dist-membership",
  "dist-ngo",
  "dist-realestate",
  "dist-restaurant",
  "dist-sahibinden",
  "dist-site",
  "dist-travel",
  "dist-veteriner",
  "s-clinic",
  "s-education",
  "s-incentive",
  "s-legaltech",
  "s-membership",
  "s-property",
  "s-restaurant",
  "stack-builder",
  "stack-channel",
  "stack-compliance",
  "stack-messaging",
  "stack-service",
  "stack-workspace",
  "edition-storefront",
  "edition-salescrm",
  "edition-onmuhasebe",
  "edition-people",
  "edition-creator",
  "edition-randevu",
  "edition-departman-copilot",
  "s-esign",
  "s-iot",
  "s-isg",
  "s-kvkk",
  "s-mail",
  "s-comms",
  "s-channel-hub",
  "s-scheduling",
];

const SYNTHETIC_PROGRAM_ROOTS = [
  "app-kernel",
  "app-atomic",
  "app-layer0",
  "app-scale",
  "app-layer1",
  "app-backend",
  "app-frontend",
  "app-build",
  "app-sus",
  "app-crosscut",
  "app-dx",
  "app-aday",
  "app-vertical",
  "app-egitim",
  "app-edu",
  "app-genel",
  "app-meta",
  "app-kararlar",
];

const SYNTHETIC_SUITE_ROOTS = [
  "app-data-intelligence",
  "app-platform-horizontal",
  "app-core-operations",
  "app-customer-revenue",
  "app-finance",
  "app-supply-chain",
  "app-hr",
  "app-content-collaboration",
];

const violations = [];

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    violations.push(`${path.relative(ROOT, file)}: JSON okunamadı — ${error.message}`);
    return null;
  }
};

const registry = readJson(REGISTRY_PATH);
if (!registry) {
  console.log("App identity kapısı — registry okunamadı.");
  console.log(`\nSONUÇ: KIRMIZI — ${violations.length} ihlal`);
  for (const violation of violations) console.log(`  - ${violation}`);
  process.exit(1);
}

const nodeIds = [];
if (!fs.existsSync(NODE_DIR)) {
  violations.push("src/data/generated/nodes: dizin yok");
} else {
  for (const file of fs
    .readdirSync(NODE_DIR)
    .filter((name) => name.endsWith(".json"))
    .sort()) {
    const node = readJson(path.join(NODE_DIR, file));
    if (typeof node?.id !== "string" || node.id.trim() === "") {
      violations.push(`src/data/generated/nodes/${file}: id zorunlu`);
      continue;
    }
    nodeIds.push(node.id);
  }
}

const nodeIdSet = new Set(nodeIds);
if (nodeIdSet.size !== nodeIds.length)
  violations.push("generated node id listesinde duplicate var");
if (registry.sourceSnapshot?.expectedNodeCount !== 496) {
  violations.push(
    `sourceSnapshot.expectedNodeCount 496 olarak sabit kalmalı: ${registry.sourceSnapshot?.expectedNodeCount}`,
  );
}
if (registry.materializedSnapshot?.expectedNodeCount !== nodeIds.length)
  violations.push(
    `materializedSnapshot.expectedNodeCount generated node sayısına eşit olmalı: ${registry.materializedSnapshot?.expectedNodeCount}/${nodeIds.length}`,
  );

const profiles = registry.decisionProfiles ?? {};
const entries = registry.entries ?? {};
const registryIds = Object.keys(entries);

for (const id of nodeIds) if (!entries[id]) violations.push(`${id}: karar kaydı yok`);
for (const id of registryIds)
  if (!nodeIdSet.has(id)) violations.push(`${id}: snapshot'ta olmayan kayıt`);
if (registryIds.length !== nodeIds.length) {
  violations.push(`registry/node sayımı farklı: ${registryIds.length}/${nodeIds.length}`);
}

const canonicalSlugs = new Set();
const aliasOwners = new Map();
const resolve = (id) => {
  const entry = entries[id];
  const profile = entry ? profiles[entry.profile] : null;
  return entry && profile ? { ...profile, ...entry, reason: entry.reason ?? profile.reason } : null;
};

for (const id of nodeIds) {
  const entry = entries[id];
  if (!entry) continue;
  const profile = profiles[entry.profile];
  if (!profile) {
    violations.push(`${id}: bilinmeyen profile ${entry.profile}`);
    continue;
  }
  for (const field of ["disposition", "proposedArtifactKind", "decisionStatus", "reason"]) {
    const value = entry[field] ?? profile[field];
    if (typeof value !== "string" || value.trim() === "")
      violations.push(`${id}: çözümlenmiş ${field} zorunlu`);
  }
  if (!nodeIdSet.has(entry.canonicalId))
    violations.push(`${id}: dangling canonicalId ${entry.canonicalId}`);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(entry.canonicalSlug ?? ""))
    violations.push(`${id}: geçersiz canonicalSlug ${JSON.stringify(entry.canonicalSlug)}`);
  if (!Array.isArray(entry.aliases)) {
    violations.push(`${id}: aliases dizi olmalı`);
  } else {
    for (const alias of entry.aliases) {
      if (aliasOwners.has(alias))
        violations.push(`${alias}: birden çok alias sahibi (${aliasOwners.get(alias)}, ${id})`);
      aliasOwners.set(alias, id);
    }
  }
  if (entry.canonicalId === id) {
    if (canonicalSlugs.has(entry.canonicalSlug))
      violations.push(`${id}: duplicate canonicalSlug ${entry.canonicalSlug}`);
    canonicalSlugs.add(entry.canonicalSlug);
  }
}

for (const [canonicalId, legacyId] of EXACT_MERGES) {
  const canonical = resolve(canonicalId);
  const legacy = resolve(legacyId);
  if (canonical?.disposition !== "PROMOTE_APP")
    violations.push(`${canonicalId}: canonical merge disposition PROMOTE_APP olmalı`);
  if (canonical?.proposedArtifactKind !== "app-definition")
    violations.push(`${canonicalId}: canonical merge app-definition olmalı`);
  if (!canonical?.aliases?.includes(legacyId))
    violations.push(`${canonicalId}: legacy alias eksik ${legacyId}`);
  if (legacy?.canonicalId !== canonicalId)
    violations.push(`${legacyId}: canonicalId ${canonicalId} olmalı`);
  if (legacy?.canonicalSlug !== canonical?.canonicalSlug)
    violations.push(`${legacyId}: canonical slug canonical kayıtla aynı olmalı`);
  if (legacy?.disposition !== "MERGE_APP_ALIAS")
    violations.push(`${legacyId}: MERGE_APP_ALIAS olmalı`);
  if (legacy?.proposedArtifactKind !== "app-alias")
    violations.push(`${legacyId}: app-alias olmalı`);
}

for (const id of MANDATORY_APP_CANDIDATES) {
  const decision = resolve(id);
  if (!decision) {
    violations.push(`${id}: mandatory app kararı çözülemedi`);
    continue;
  }
  if (!["app-definition", "app-alias"].includes(decision.proposedArtifactKind))
    violations.push(`${id}: mandatory app module/archetype bırakılamaz`);
  if (decision.decisionStatus !== "accepted")
    violations.push(`${id}: mandatory app kararı accepted olmalı`);
}

const governance = resolve("stack-editions");
if (
  governance?.disposition !== "RECLASSIFY_GOVERNANCE" ||
  governance?.proposedArtifactKind !== "governance" ||
  governance?.decisionStatus !== "accepted"
) {
  violations.push("stack-editions: accepted governance disposition zorunlu");
}

const productizedApps = nodeIds.filter((id) => resolve(id)?.profile === "productized-app");
if (productizedApps.length !== 84)
  violations.push(`productized s-* app sayısı 84 olmalı: ${productizedApps.length}`);
for (const id of productizedApps) {
  const decision = resolve(id);
  if (
    decision?.disposition !== "PROMOTE_APP" ||
    decision?.proposedArtifactKind !== "app-definition" ||
    decision?.decisionStatus !== "accepted"
  ) {
    violations.push(`${id}: productized çözüm accepted app olmalı`);
  }
}

for (const id of SYNTHETIC_PROGRAM_ROOTS) {
  const decision = resolve(id);
  if (
    decision?.profile !== "synthetic-program" ||
    decision?.disposition !== "RECLASSIFY_PROGRAM" ||
    decision?.proposedArtifactKind !== "program"
  ) {
    violations.push(`${id}: sentetik program kökü disposition'ı yanlış`);
  }
}
for (const id of SYNTHETIC_SUITE_ROOTS) {
  const decision = resolve(id);
  if (
    decision?.profile !== "portfolio" ||
    decision?.disposition !== "RECLASSIFY_PORTFOLIO" ||
    decision?.proposedArtifactKind !== "portfolio" ||
    decision?.decisionStatus !== "accepted"
  ) {
    violations.push(`${id}: sentetik suite kökü accepted portfolio olmalı`);
  }
}
const landx = resolve("app-landx");
if (landx?.disposition !== "PROMOTE_APP" || landx?.proposedArtifactKind !== "app-definition")
  violations.push("app-landx: accepted app disposition zorunlu");
const platformFactory = resolve("platform-factory");
if (
  platformFactory?.disposition !== "RECLASSIFY_FOUNDATION" ||
  platformFactory?.proposedArtifactKind !== "platform-foundation"
)
  violations.push("platform-factory: platform-foundation disposition zorunlu");

const expectedAliases = EXACT_MERGES.map(([, legacyId]) => legacyId).sort();
const actualAliases = [...aliasOwners.keys()].sort();
if (JSON.stringify(actualAliases) !== JSON.stringify(expectedAliases))
  violations.push(`merge alias seti farklı: ${actualAliases.join(", ")}`);

finish();

function finish() {
  console.log(
    `App identity kapısı — ${nodeIds?.length ?? 0} generated node, ${Object.keys(entries ?? {}).length} karar, ${MANDATORY_APP_CANDIDATES.length} mandatory app adayı, ${EXACT_MERGES.length} exact merge.`,
  );
  if (violations.length === 0) {
    console.log("\nSONUÇ: YEŞİL ✓");
    process.exit(0);
  }
  console.log(`\nSONUÇ: KIRMIZI — ${violations.length} ihlal`);
  for (const violation of violations.slice(0, 80)) console.log(`  - ${violation}`);
  process.exit(1);
}
