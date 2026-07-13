#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OWNER_LEAF_DIMENSION_BUILDERS as BUILDERS } from "./lib/owner-leaf-dimension-builders.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NODES_DIR = path.join(ROOT, "src", "data", "generated", "nodes");
const PROFILE_PATH = path.join(ROOT, "src", "data", "owner-leaf-dimension-profiles.json");
const APPLY = process.argv.includes("--apply");
const profileDocument = JSON.parse(fs.readFileSync(PROFILE_PATH, "utf8"));
const VERSION = profileDocument.version;
const PROFILES = profileDocument.profiles;
const nodeById = new Map(
  fs
    .readdirSync(NODES_DIR)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const node = JSON.parse(fs.readFileSync(path.join(NODES_DIR, file), "utf8"));
      return [node.id, node];
    }),
);

const DIMENSION_KEYS = [
  "featureDefs",
  "security",
  "codeOptimization",
  "securityOptimization",
  "performance",
  "mobileApps",
  "wcag",
  "deployment",
  "eca",
  "aiAgents",
  "testing",
  "owasp",
  "integration",
  "moduleUsage",
  "dataLifecycle",
  "observability",
  "reliability",
];

const REQUIRED_PROFILE_FIELDS = [
  "focus",
  "input",
  "output",
  "threat",
  "performance",
  "mobile",
  "deployment",
  "failure",
  "lifecycle",
  "consumer",
];
const DOC_ITEM_MARKER = /^\[DOC-APPLY:[^\]]+\]/;

function materializedDimension(node, key, card, profile) {
  const items = BUILDERS[key](node, profile);
  return {
    ...card,
    status: "filled",
    items,
    notes: `${node.id} görev-özel yükümlülüğüdür; kanonik mühendislik kuralı standardRefs üzerinden çözülür ve actual evidence olmadan passed yapılmaz.`,
    prompt: [
      `${node.id} — ${node.title} için ${card.title} kapsamını JSON görev sözleşmesinde uygula.`,
      `Kapsa: ${items.join(" ")}`,
      "Kısıt: refs ve standardRefs kaynaklarını çöz; standard metnini kopyalama, ürün kodu yazma, traceability veya evidence uydurma.",
      `Çıktı: ${key} kabul maddelerini test, beklenen kanıt türü ve rollback bağıyla güncelle; gerçek çalışma yoksa durum planlı/backlog kalsın.`,
    ].join("\n"),
    provenance: "swarm",
    promptVersion: VERSION,
  };
}

function nearestPlannedSchedule(node) {
  const visited = new Set([node.id]);
  let parentId = node.parentId;
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const parent = nodeById.get(parentId);
    if (!parent) break;
    const schedule = parent.schedule ?? {};
    if (schedule.start && schedule.end && schedule.baselineStart && schedule.baselineEnd)
      return schedule;
    parentId = parent.parentId;
  }
  throw new Error(`${node.id}: planlı takvim miras alınacak ancestor bulunamadı`);
}

function materializeOwnerHandoff(node, profile) {
  const inherited = nearestPlannedSchedule(node);
  const start = node.schedule?.start ?? inherited.start;
  const end = node.schedule?.end ?? inherited.end;
  node.schedule = {
    ...(node.schedule ?? {}),
    start,
    end,
    actualStart: node.schedule?.actualStart ?? null,
    actualEnd: node.schedule?.actualEnd ?? null,
    baselineStart: node.schedule?.baselineStart ?? start,
    baselineEnd: node.schedule?.baselineEnd ?? end,
  };

  const requiredPhaseCriteria = {
    "db-schema": `${node.id} için ${profile.input} girdisinin typed schema, indeks ve migration etkisini ${profile.output} çıktısına eşle; veri modeli etkisi yoksa gerekçeli N/A kaydet, DDL veya migration kanıtı uydurma.`,
    "test-qa": `${node.id} için ${profile.failure} failure mode'unu önce negatif unit/integration testiyle doğrula; ${profile.output} kabul çıktısını gerçek test raporuna bağlamadan PASS veya evidence yazma.`,
  };
  for (const [phase, criterion] of Object.entries(requiredPhaseCriteria)) {
    const gate = node.phases?.[phase];
    if (!gate) throw new Error(`${node.id}: eksik waterfall gate ${phase}`);
    if (!(gate.criteria ?? []).length) gate.criteria = [criterion];
  }
}

const drift = [];
let filledCount = 0;
for (const [id, profile] of Object.entries(PROFILES)) {
  for (const field of REQUIRED_PROFILE_FIELDS) {
    if (!profile[field]?.trim()) throw new Error(`${id}: eksik profil alanı ${field}`);
  }
  const file = path.join(NODES_DIR, `${id}.json`);
  const node = structuredClone(nodeById.get(id));
  if (!node) throw new Error(`${id}: owner leaf node bulunamadı`);
  if (node.id !== id) throw new Error(`${id}: node kimliği dosya ile uyuşmuyor`);
  const before = JSON.stringify(node);
  materializeOwnerHandoff(node, profile);
  for (const key of DIMENSION_KEYS) {
    const card = node.dimensions?.[key];
    if (!card) throw new Error(`${id}: eksik boyut ${key}`);
    const managed = card.promptVersion === VERSION;
    const empty = card.status === "skeleton" || !(card.items ?? []).length;
    if (managed || empty) {
      node.dimensions[key] = materializedDimension(node, key, card, profile);
      filledCount++;
      continue;
    }
    const ownerItems = BUILDERS[key](node, profile);
    const cardItems = card.items ?? [];
    const hasDocProjection = cardItems.some((item) => DOC_ITEM_MARKER.test(String(item)));
    const nonOwnerItems = cardItems.filter((item) => !ownerItems.includes(item));
    const ownerSlots = Math.min(2, Math.max(0, 5 - nonOwnerItems.length));
    let enriched = {
      ...card,
      items: hasDocProjection
        ? [...ownerItems.slice(0, ownerSlots), ...nonOwnerItems]
        : nonOwnerItems,
    };
    if (!(enriched.notes ?? "").trim()) {
      enriched = {
        ...enriched,
        notes: `${node.id} görev-özel yükümlülüğüdür; kanonik mühendislik kuralı standardRefs üzerinden çözülür ve actual evidence olmadan passed yapılmaz.`,
      };
    }
    const ownerPromptPrefix = `Görev-özel owner bağlamı (${node.id}/${key}):`;
    if (!String(enriched.prompt ?? "").includes(ownerPromptPrefix)) {
      const ownerPrompt = [
        ownerPromptPrefix,
        `Kapsam: ${profile.focus}.`,
        "Kısıt: refs ve standardRefs çözülür; standard metni kopyalanmaz, platform ürün kodu yazılmaz ve gerçek evidence uydurulmaz.",
        `Çıktı: ${profile.output}.`,
      ].join("\n");
      enriched = {
        ...enriched,
        prompt: [ownerPrompt, String(enriched.prompt ?? "").trim()].filter(Boolean).join("\n\n"),
      };
    }
    if (JSON.stringify(enriched) !== JSON.stringify(card)) {
      node.dimensions[key] = enriched;
      filledCount++;
    }
  }
  const after = JSON.stringify(node);
  if (before === after) continue;
  drift.push(path.relative(ROOT, file));
  if (APPLY) fs.writeFileSync(file, `${JSON.stringify(node, null, 2)}\n`);
}

console.log(
  `Owner leaf boyut materializer — ${Object.keys(PROFILES).length} görev, ${filledCount} yönetilen/doldurulan kart, drift=${drift.length}`,
);
if (drift.length) console.log(drift.map((file) => `  - ${file}`).join("\n"));
if (!APPLY && drift.length) {
  console.error("KIRMIZI: owner leaf JSON içeriği profillerle eşleşmiyor; --apply çalıştırılmalı.");
  process.exit(1);
}
console.log(APPLY ? "UYGULANDI ✓" : "SONUÇ: YEŞİL ✓");
