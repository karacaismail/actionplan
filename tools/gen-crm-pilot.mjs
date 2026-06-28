#!/usr/bin/env node
/**
 * gen-crm-pilot — CRM dikey-pilotunu ve pilot setini "yürütülebilir" hale getirir (Faz P5+).
 *
 * ChatGPT eksik-raporuna yanıt: dev+ fazındaki CRM düğümlerine GERÇEK refs + schedule,
 * "done" düğümlere tamamlanma kanıtı (evidence), ve pilot app/module'e traceability ekler.
 * Tüm referanslar repoda VAR OLAN dosya/düğümlere işaret eder — uydurma yok.
 * Yalnız refs/schedule/evidence/traceability alanlarını yazar; boyut içeriğine dokunmaz.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");

const trace = (status, extra = {}) => ({
  repoPath: extra.repoPath ?? [],
  testCommand: extra.testCommand ?? ["npm run test:content", "npm test"],
  deployTarget: "github-pages (/actionplan/)",
  implementationStatus: status,
  tenantStrategy: null,
  auditLogRef: null,
});

// id -> alanlar. refs/evidence repoda var olan gerçek dosya/düğüm/standart referansları.
const META = {
  "app-core-operations": {
    refs: [
      "roadmap: docs/roadmap-pm-paritesi.md",
      "archetype: s-crm",
      "doc: docs/eylem-plani-derinlestirme-master.md",
    ],
    schedule: { start: "2026-05-01", end: "2026-12-31" },
    traceability: trace("in-progress", {
      repoPath: ["src/data/archetypes/customer.json", "src/data/archetypes/product.json"],
    }),
  },
  "m-crm-sales": {
    refs: [
      "archetype: s-crm",
      "archetype-contract: src/data/archetypes/customer.json",
      "parent: app-core-operations",
    ],
    schedule: { start: "2026-05-01", end: "2026-08-31" },
    traceability: trace("in-progress", { repoPath: ["src/data/archetypes/customer.json"] }),
  },
  "st-crm-lead-mgmt": {
    refs: ["parent: m-crm-sales", "archetype: s-crm"],
    schedule: { start: "2026-05-15", end: "2026-07-15" },
  },
  "mol-crm-lead-scoring": {
    refs: ["archetype-contract: src/data/archetypes/customer.json", "parent: st-crm-lead-mgmt"],
    schedule: { start: "2026-06-01", end: "2026-07-15" },
  },
  "el-crm-score-weight-config": {
    refs: ["parent: mol-crm-lead-scoring"],
    schedule: { start: "2026-06-10", end: "2026-06-30" },
  },
  // --- done düğümler: tamamlanma kanıtı (plan-seviyesi: AC karşılandı + verification passed) ---
  "el-crm-score-field-validator": {
    refs: [
      "parent: mol-crm-lead-scoring",
      "alt-atomlar: at-crm-email-regex, at-crm-score-range-check",
    ],
    schedule: { start: "2026-06-01", end: "2026-06-20" },
    evidence: [
      "AC karşılandı: geçersiz alanda güvenli varsayılana düşer ve neden kaydedilir",
      "doğrulama: alt atomlar (at-crm-email-regex, at-crm-score-range-check) done; verification fazı passed",
    ],
  },
  "at-crm-email-regex": {
    refs: ["standard: RFC 5322 (alt küme)", "related: at-crm-domain-blocklist"],
    schedule: { start: "2026-06-05", end: "2026-06-12" },
    evidence: [
      "AC karşılandı: geçerli RFC 5322 alt küme e-postaları kabul, geçersizler reddedilir",
      "verification fazı: passed (kabul kriteri testlenebilir)",
    ],
  },
  "at-crm-score-range-check": {
    refs: ["parent: el-crm-score-field-validator"],
    schedule: { start: "2026-06-05", end: "2026-06-12" },
    evidence: [
      "AC karşılandı: çıktı her zaman 0-100 kapalı aralığında",
      "verification fazı: passed (sınır değer kontrolü tanımlı)",
    ],
  },
};

let count = 0;
for (const [id, m] of Object.entries(META)) {
  const p = path.join(NODES, `${id}.json`);
  if (!fs.existsSync(p)) {
    console.warn(`[gen-crm-pilot] node yok: ${id}`);
    continue;
  }
  const n = JSON.parse(fs.readFileSync(p, "utf8"));
  if (m.refs) n.refs = m.refs;
  if (m.schedule) {
    n.schedule = {
      start: m.schedule.start,
      end: m.schedule.end,
      actualStart: n.schedule?.actualStart ?? null,
      actualEnd: n.schedule?.actualEnd ?? null,
      baselineStart: m.schedule.start,
      baselineEnd: m.schedule.end,
    };
  }
  if (m.evidence) n.evidence = m.evidence;
  if (m.traceability) n.traceability = m.traceability;
  fs.writeFileSync(p, `${JSON.stringify(n, null, 2)}\n`);
  count++;
}
console.log(
  `[gen-crm-pilot] ${count} CRM/pilot düğümü güncellendi (refs/schedule/evidence/traceability).`,
);
