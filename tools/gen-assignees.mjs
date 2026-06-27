#!/usr/bin/env node
/**
 * gen-assignees — deterministik tohum (Faz 0):
 *  - assignees boşsa ve owner varsa: assignees = [owner] (çoklu-atama başlangıcı).
 *  - golden düğümlerde schedule.baseline boşsa: baseline = mevcut plan (start/end).
 * Yalnız bu alanları yazar; diğer içerik korunur. Geriye uyumlu.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NODES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "generated", "nodes");
const GOLDEN = new Set(["product", "customer", "s-crm"]);

const files = fs.readdirSync(NODES).filter((f) => f.endsWith(".json"));
let a = 0;
let b = 0;
for (const f of files) {
  const p = path.join(NODES, f);
  const n = JSON.parse(fs.readFileSync(p, "utf8"));
  let changed = false;
  if (!Array.isArray(n.assignees)) {
    n.assignees = [];
    changed = true;
  }
  if (n.assignees.length === 0 && n.owner) {
    n.assignees = [n.owner];
    a++;
    changed = true;
  }
  if (n.schedule && GOLDEN.has(n.id) && n.schedule.start && !n.schedule.baselineStart) {
    n.schedule.baselineStart = n.schedule.start;
    n.schedule.baselineEnd = n.schedule.end;
    b++;
    changed = true;
  }
  if (changed) fs.writeFileSync(p, `${JSON.stringify(n, null, 2)}\n`);
}
console.log(`[gen-assignees] assignees tohumlanan: ${a} · baseline tohumlanan: ${b}`);
