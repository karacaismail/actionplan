#!/usr/bin/env node
/**
 * gen-dev-traceability — development fazındaki CRM düğümlerine eksik uygulama bağını ekler (DX).
 *
 * docs/ready-for-dev-gate.md + task-to-code-contract.md uyarınca: development fazına geçmiş ama
 * traceability'si eksik düğümlere DÜRÜST planlı hedef (platform monorepo yolu + test komutu) yazar.
 * implementationStatus="in-progress" (development = başlanmış ama kanıtlanmamış). Uydurma kanıt değil;
 * sadece kodun YAZILACAĞI hedef ve onu doğrulayacak test komutu (gerçekleşince evidence eklenir).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");

const MAP = {
  "st-crm-lead-mgmt": {
    repoPath: ["platform/backend/app/crm/lead_mgmt/"],
    testCommand: ["pytest platform/backend/tests/crm/test_lead_mgmt.py -v"],
  },
  "el-crm-score-weight-config": {
    repoPath: ["platform/backend/app/crm/scoring/weights.py"],
    testCommand: ["pytest platform/backend/tests/crm/test_score_weights.py -v"],
  },
};

let count = 0;
for (const [id, m] of Object.entries(MAP)) {
  const p = path.join(NODES, `${id}.json`);
  if (!fs.existsSync(p)) {
    console.warn(`[gen-dev-traceability] node yok: ${id}`);
    continue;
  }
  const n = JSON.parse(fs.readFileSync(p, "utf8"));
  n.traceability = {
    repoPath: m.repoPath,
    testCommand: m.testCommand,
    deployTarget: "hetzner-debian-docker (planlı)",
    implementationStatus: "in-progress",
    tenantStrategy: null,
    auditLogRef: null,
  };
  fs.writeFileSync(p, `${JSON.stringify(n, null, 2)}\n`);
  count++;
}
console.log(
  `[gen-dev-traceability] ${count} development düğümüne uygulama bağı (traceability) eklendi.`,
);
