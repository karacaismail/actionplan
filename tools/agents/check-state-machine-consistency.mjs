#!/usr/bin/env node
/**
 * check-state-machine-consistency — SEMANTİK KAYMA KAPISI (BLOKLAYICI + WARN kademeli).
 *
 * Bu nedir? Bir düğümün üç durum alanı çelişmemelidir: status, phase, traceability.implementationStatus.
 * Ne DOĞRULAR (ihlalde exit 1 — imkansız çelişki):
 *   - status="done" iken implementationStatus ∈ {not-started, scaffolded} → mantıksal imkansız → ihlal.
 * Ne UYARIR (WARN — exit'i etkilemez, ratchet):
 *   - implementationStatus ∈ {in-progress, scaffolded, implemented, verified} iken status=backlog VEYA
 *     phase=requirements → "ileri kayma". Bu bugün pilot düğümlerde (CRM zinciri) beklenen bir ara
 *     durumdur; insan pilot statüsünü ilerletince WARN bloklayıcıya çevrilebilir.
 * Neden kademeli? status'u zorla ilerletmek check-ready-for-dev / check-execution-readiness gibi
 *   kapıları tetikler; bu bir proje-yönetimi kararıdır (insan onayı). Kapı imkansız çelişkiyi bloklar,
 *   ara kaymayı görünür kılar ama build'i kırmaz.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");

const IMPL_PROGRESSED = new Set(["in-progress", "scaffolded", "implemented", "verified"]);
const IMPL_NOTYET = new Set(["not-started", "scaffolded"]);

if (!fs.existsSync(NODES)) {
  console.error(`[state-machine] düğüm klasörü yok: ${NODES}`);
  process.exit(2);
}

const nodes = fs
  .readdirSync(NODES)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(NODES, f), "utf8")));

const fails = [];
const warns = [];
for (const n of nodes) {
  const impl = n.traceability?.implementationStatus;
  if (!impl) continue;
  if (n.status === "done" && IMPL_NOTYET.has(impl))
    fails.push(`imkansiz: ${n.id} — status=done ama implementationStatus=${impl}`);
  if (IMPL_PROGRESSED.has(impl) && (n.status === "backlog" || n.phase === "requirements"))
    warns.push(
      `ileri-kayma: ${n.id} — implementationStatus=${impl} ama status=${n.status}/phase=${n.phase}`,
    );
}

console.log(
  `[state-machine] traceability taşıyan düğüm denetlendi · ihlal: ${fails.length} · uyarı: ${warns.length}`,
);
for (const w of warns.slice(0, 50)) console.log(`  WARN ${w}`);
if (fails.length) {
  console.error(`\nSONUÇ: KIRMIZI ✗ — ${fails.length} imkansız çelişki:`);
  for (const f of fails.slice(0, 50)) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(
  "SONUÇ: YEŞİL ✓ — imkansız durum çelişkisi yok (ileri-kaymalar WARN olarak izleniyor).",
);
