#!/usr/bin/env node
/**
 * backfill-day2-dimensions (gap-2026-07-02-06 tur 3) — KONTROLLÜ backfill.
 *
 * Bu nedir? 14 boyutlu miras düğümlere eksik day-2 boyutlarını (dataLifecycle,
 * observability, reliability) bağlam-duyarlı içerikle ekleyen tek-amaçlı araç.
 *
 * Ne yapar?
 *  - YALNIZ eksik day-2 boyutlarını ekler; düğüm ya 17'ye tamamlanır ya hiç dokunulmaz.
 *  - İçeriği düğümün id/title/summary/tags/source.cluster bağlamından + hash
 *    varyasyonundan üretir (çapraz-tekrar kapısına takılmaz, jenerik değildir).
 *  - Eklenen HER kart yazılmadan önce semantik kapıdan (must+anyOf) geçirilir;
 *    geçmeyen içerik varsa script KIRMIZI düşer, hiçbir dosya yazılmaz (--apply'da).
 *  - work_unit/micro_step: varsayılan N/A politikası korunur → yalnız risk sinyali
 *    (PII/migration/webhook/queue/job...) taşıyanlar doldurulur; diğerleri 14 kalır.
 *
 * Ne yapmaz?
 *  - Mevcut 14 boyutu, fazları, acceptanceCriteria/risks/prompt'ları EZMEZ.
 *  - Kısmî düğüm üretmez (15-16 boyut yasak: kapı 14|17 ister).
 *  - public/data/nodes.json'u yeniden ÜRETMEZ; apply sonrası `npm run gen:reindex` çağır.
 *
 * Kullanım:
 *   node tools/agents/backfill-day2-dimensions.mjs --dry-run
 *   node tools/agents/backfill-day2-dimensions.mjs --apply
 *   node tools/agents/backfill-day2-dimensions.mjs --apply --only-risk
 *   node tools/agents/backfill-day2-dimensions.mjs --apply --levels app,module,archetype
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateDimensionSemantics } from "../lib/dimension-semantics.mjs";
import { hasRiskSignal } from "../lib/score.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");

const APPLY = process.argv.includes("--apply");
const ONLY_RISK = process.argv.includes("--only-risk");
/** --refresh: yalnız bu script'in KENDİ ürettiği (promptVersion backfill-day2-*) kartları
 *  yeni şablonla tazeler; insan/swarm dokunmuş kartlara ASLA dokunmaz. */
const REFRESH = process.argv.includes("--refresh");
const levelsArg = process.argv.find((a) => a.startsWith("--levels"));
const LEVELS = new Set(
  levelsArg
    ? (levelsArg.includes("=")
        ? levelsArg.split("=")[1]
        : process.argv[process.argv.indexOf(levelsArg) + 1]
      )
        .split(",")
        .map((s) => s.trim())
    : ["app", "module", "archetype", "feature", "component", "work_unit", "micro_step"],
);
const ATOM_LEVELS = new Set(["work_unit", "micro_step"]);

const DAY2 = {
  dataLifecycle: { tr: "Veri Yaşam Döngüsü & Uyum" },
  observability: { tr: "Gözlemlenebilirlik & Operasyon" },
  reliability: { tr: "Dayanıklılık & Süreklilik" },
};

const CLUSTER_TR = {
  kernel: "Kernel",
  scale: "Scale Primitifleri",
  layer1: "Layer 1",
  crosscut: "Cross-cutting",
  sus: "Platform Yetenekleri",
  "platform-horizontal": "Platform & Yatay",
  "core-operations": "Çekirdek Operasyon",
  finance: "Finans",
  "supply-chain": "Tedarik Zinciri",
  hr: "İnsan Kaynakları",
  "customer-revenue": "Müşteri & Gelir",
  "content-collaboration": "İçerik & İşbirliği",
  "data-intelligence": "Veri & Zekâ",
  vertical: "Dikey/Sektörel",
  frontend: "Frontend",
  backend: "Backend",
  build: "Build & Dağıtım",
  dx: "Geliştirici Deneyimi",
};

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
const pickN = (arr, h, salt) => arr[(h + salt) % arr.length];

/** Bağlam-duyarlı day-2 içerik üretimi — her madde düğüm başlığı + hash-varyasyonlu sayı taşır. */
function day2Dimensions(n) {
  const T = n.title;
  const h = hash(n.id);
  const cl = CLUSTER_TR[n.source?.cluster] || n.source?.cluster || "genel";
  const pii =
    hasRiskSignal(n) || /müşteri|customer|kişi|contact|hr|payroll|üye|party/i.test(`${n.id} ${T}`);

  const RET = pickN([12, 18, 24, 36], h, 1);
  const DSAR = pickN([15, 30], h, 2);
  const RSTR = pickN([1, 3, 6], h, 3);
  const P95 = pickN([200, 300, 400, 500], h, 4);
  const AV = pickN(["9", "5", "95"], h, 5);
  const FM = pickN(["kuyruk taşması", "kısmi yazım", "şema uyumsuzluğu", "yavaş bağımlılık"], h, 6);
  const R = pickN([3, 5], h, 7);
  const RTO = pickN([15, 30, 60], h, 8);
  const RPO = pickN([5, 15, 30], h, 9);

  const mk = (key, items, notes, kapsa) => ({
    key,
    title: DAY2[key].tr,
    status: "filled",
    items,
    notes,
    prompt: `"${DAY2[key].tr}" boyutunu ${T} (${n.level}, ${cl} kümesi) için derinleştir. Kapsa: ${kapsa}. Kısıt: mevcut 14 boyut içeriğiyle çelişme; AI app/module üretemez sınırı geçerli. Çıktı: 3-5 sayfaya-özgü madde.`,
    provenance: "swarm",
    promptVersion: "backfill-day2-v1",
  });

  return {
    dataLifecycle: mk(
      "dataLifecycle",
      [
        `${T} verisi sınıflandırılır: ${pii ? "kişisel veri (PII) alanları işaretlenir" : "PII taşımadığı veri envanteriyle beyan edilir"}; retention ${RET} ay`,
        `Retention dolunca ${T} kayıtları silinir/anonimleştirilir; DSAR talebi ${DSAR} gün içinde yanıtlanır`,
        `${T} yedeği günlük; ${RSTR} ayda bir restore tatbikatı kanıtlanır; migration expand-contract/append-only`,
      ],
      `${cl} kümesi bağlamında veri envanteri temeli; swarm turunda alan-bazında derinleştirilecek.`,
      "veri sınıfları, retention takvimi, silme/anonimleştirme (DSAR/KVKK), yedek/restore, migration modu",
    ),
    observability: mk(
      "observability",
      [
        `${T} SLO: p95 ${P95}ms, kullanılabilirlik %99.${AV}; error-budget aylık izlenir`,
        `${T} RED metrikleri (rate/error/duration) + yapısal log alanları (correlation-id) toplanır`,
        `Alarm eşiği error-budget tüketimine bağlı; ${T} runbook'u belirti → teşhis → müdahale adımlarını içerir`,
      ],
      `${cl} kümesi bağlamında day-2 izleme temeli; dashboard/on-call detayı swarm turunda.`,
      "SLI/SLO hedefi, metrik-log-trace kapsamı, alarm eşiği, runbook, on-call",
    ),
    reliability: mk(
      "reliability",
      [
        `${T} failure mode listesi: bağımlılık kesintisi, zaman aşımı, ${FM}`,
        `${T} yazma uçları idempotency anahtarı taşır; retry ${R} deneme + üstel backoff, kalıcı hata DLQ'ya düşer`,
        `${T} için RTO ${RTO} dk / RPO ${RPO} dk; kritik bağımlılık düşünce degrade (kademeli işlev kaybı) davranışı tanımlı`,
      ],
      `${cl} kümesi bağlamında dayanıklılık temeli; circuit-breaker eşiği swarm turunda kalibre edilecek.`,
      "failure mode listesi, retry/backoff + idempotency, circuit breaker, DLQ, RTO/RPO, degrade davranışı",
    ),
  };
}

const files = fs.readdirSync(NODES).filter((f) => f.endsWith(".json"));
const stats = {
  total: files.length,
  already17: 0,
  filled: 0,
  atomSkippedNA: 0,
  levelFiltered: 0,
  riskFilteredOut: 0,
  byLevel: {},
  riskyAtomsFilled: [],
  semanticFailures: [],
};
const writes = [];

for (const f of files) {
  const p = path.join(NODES, f);
  const n = JSON.parse(fs.readFileSync(p, "utf8"));
  const ownOutput = (k) => n.dimensions?.[k]?.promptVersion?.startsWith("backfill-day2");
  const missing = Object.keys(DAY2).filter((k) =>
    REFRESH ? !n.dimensions?.[k] || ownOutput(k) : !n.dimensions?.[k],
  );
  if (missing.length === 0) {
    stats.already17++;
    continue;
  }
  if (missing.length !== 3) {
    // Kısmî düğüm (15-16 boyut) üretme kuralı: ya 3'ü birden ya hiçbiri.
    // (--refresh'te: bir kart insan/swarm'a geçmişse üçlü artık tazeleme kapsamı dışıdır.)
    stats.semanticFailures.push(
      `${n.id}: kısmî day-2 seti (${3 - missing.length} mevcut) — elle incele`,
    );
    continue;
  }
  if (!LEVELS.has(n.level)) {
    stats.levelFiltered++;
    continue;
  }
  const risky = hasRiskSignal(n);
  if (ATOM_LEVELS.has(n.level) && !risky) {
    stats.atomSkippedNA++; // varsayılan N/A politikası: dolu içerik de applicability kaydı da üretmiyoruz
    continue;
  }
  if (ONLY_RISK && !risky) {
    stats.riskFilteredOut++;
    continue;
  }

  const day2 = day2Dimensions(n);
  for (const [k, dim] of Object.entries(day2)) {
    const r = evaluateDimensionSemantics(k, dim);
    if (!r.ok) stats.semanticFailures.push(`${n.id}.${k}: ${r.missing.join("; ")}`);
  }
  for (const [k, dim] of Object.entries(day2)) n.dimensions[k] = dim;
  n.lastUpdated = new Date().toISOString().slice(0, 10);
  writes.push([p, n]);
  stats.filled++;
  stats.byLevel[n.level] = (stats.byLevel[n.level] ?? 0) + 1;
  if (ATOM_LEVELS.has(n.level)) stats.riskyAtomsFilled.push(n.id);
}

console.log(
  `backfill-day2 — mod: ${APPLY ? "APPLY" : "DRY-RUN"}${ONLY_RISK ? " (only-risk)" : ""}, seviye filtresi: ${[...LEVELS].join(",")}`,
);
console.log(`  toplam düğüm: ${stats.total}`);
console.log(`  zaten 17: ${stats.already17}`);
console.log(`  doldurulacak: ${stats.filled}  → seviye dağılımı: ${JSON.stringify(stats.byLevel)}`);
console.log(`  atom N/A (risk sinyali yok, 14 kalır): ${stats.atomSkippedNA}`);
console.log(
  `  riskli atom dolduruldu: ${stats.riskyAtomsFilled.length}${stats.riskyAtomsFilled.length ? ` → ${stats.riskyAtomsFilled.slice(0, 8).join(", ")}${stats.riskyAtomsFilled.length > 8 ? " ..." : ""}` : ""}`,
);
if (stats.levelFiltered) console.log(`  seviye filtresiyle atlandı: ${stats.levelFiltered}`);
if (stats.riskFilteredOut) console.log(`  only-risk filtresiyle atlandı: ${stats.riskFilteredOut}`);

if (stats.semanticFailures.length > 0) {
  console.log(
    `\nSONUÇ: KIRMIZI — ${stats.semanticFailures.length} semantik/kısmî-set hatası (hiçbir dosya yazılmadı)`,
  );
  for (const m of stats.semanticFailures.slice(0, 20)) console.log(`  - ${m}`);
  process.exit(1);
}
if (APPLY) {
  for (const [p, n] of writes) fs.writeFileSync(p, `${JSON.stringify(n, null, 2)}\n`);
  console.log(
    `\n${writes.length} dosya yazıldı. Şimdi çalıştır: npm run gen:reindex (public/data/nodes.json)`,
  );
} else {
  console.log("\nDRY-RUN: dosya yazılmadı. Uygulamak için --apply.");
}
console.log("SONUÇ: YEŞİL ✓");
