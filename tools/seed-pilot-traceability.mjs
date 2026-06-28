#!/usr/bin/env node
/**
 * seed-pilot-traceability — 3 pilot (golden) düğüme izlenebilirlik + kanıt tohumlar (Faz P5).
 *
 * Bu nedir? product / customer / s-crm düğümlerine GERÇEK artefaktlara işaret eden traceability
 *   (repoPath/testCommand/deployTarget/implementationStatus) ve evidence[] ekler.
 * Ne yapar? Plan ↔ kanıt bağını UI'da görünür kılar; uydurma değil — yalnız repoda VAR OLAN
 *   dosyalara (archetype contract, surface/eca katalogları) ve gerçek test komutlarına işaret eder.
 * Ne yapmaz? Diğer düğümlere dokunmaz; implementationStatus'u abartmaz (contract var = "scaffolded",
 *   s-crm zaten in-progress). Geriye uyumlu; yalnız traceability + evidence yazar.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NODES = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "data",
  "generated",
  "nodes",
);

const base = (implementationStatus) => ({
  repoPath: ["karacaismail/actionplan (plan deposu)"],
  testCommand: ["npm run test:content", "npm test"],
  deployTarget: "github-pages (/actionplan/)",
  implementationStatus,
  tenantStrategy: null,
  auditLogRef: null,
});

const PILOTS = {
  product: {
    traceability: { ...base("scaffolded"), repoPath: ["src/data/archetypes/product.json"] },
    evidence: ["archetype-contract: src/data/archetypes/product.json"],
  },
  customer: {
    traceability: { ...base("scaffolded"), repoPath: ["src/data/archetypes/customer.json"] },
    evidence: ["archetype-contract: src/data/archetypes/customer.json"],
  },
  "s-crm": {
    traceability: base("in-progress"),
    evidence: [
      "surface/workflow: src/data/surface/workflow-catalog.json",
      "eca-paket: src/data/eca/ruleset-catalog.json",
    ],
  },
};

let count = 0;
for (const [id, patch] of Object.entries(PILOTS)) {
  const p = path.join(NODES, `${id}.json`);
  if (!fs.existsSync(p)) {
    console.warn(`[seed-pilot] UYARI: ${id}.json yok, atlandı`);
    continue;
  }
  const n = JSON.parse(fs.readFileSync(p, "utf8"));
  n.traceability = patch.traceability;
  if (Array.isArray(n.evidence) && n.evidence.length === 0) n.evidence = patch.evidence;
  fs.writeFileSync(p, `${JSON.stringify(n, null, 2)}\n`);
  count++;
}
console.log(`[seed-pilot-traceability] ${count} pilot düğüme traceability + evidence tohumlandı.`);
