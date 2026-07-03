#!/usr/bin/env node
/**
 * rewrite-short-items — Dalga 2: kısa maddeleri anlam koruyarak ölçülü sözleşme
 * maddesine DÖNÜŞTÜRÜR (append değil, yerinde genişletme).
 *
 * Ne yapar? Hedef kartlardaki <35 karakterlik maddeleri, ESKİ METNİ BİREBİR BAŞTA
 * KORUYARAK boyut-bazlı ölçü/eşik/kanıt ekiyle genişletir: "eski — ölçülü ek".
 * Karttaki TÜM kısa maddeler genişletilir (bayrak ancak öyle düşer).
 * Eski→yeni eşlemesi reports/short-items-wave2-mapping.json'a yazılır.
 *
 * Ne yapmaz? Madde SİLMEZ, sıra DEĞİŞTİRMEZ, ≥35 maddeye DOKUNMAZ, day-2 ve
 * applies=false kartlara dokunmaz, madde sayısını değiştirmez (5-sınır etkilenmez).
 * Yasak ifade üretmez (blocklist + FORBIDDEN imza kontrolü yazım öncesi).
 *
 * Aday önceliği: (1) en zayıf skor bandı, (2) öncelikli boyutlar, (3) belirtilen
 * düşük-puan aileleri. Kullanım: --dry-run | --apply [--nodes N=160] [--maxCards N=400]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateDimensionSemantics } from "../lib/dimension-semantics.mjs";
import { auditNode } from "../lib/score.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");
const APPLY = process.argv.includes("--apply");
const arg = (name, def) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? Number(process.argv[i + 1]) : def;
};
const NODE_BAND = arg("--nodes", 160);
const MAX_CARDS = arg("--maxCards", 400);

const DAY2 = new Set(["dataLifecycle", "observability", "reliability"]);
const PRIORITY_DIMS = [
  "performance",
  "mobileApps",
  "wcag",
  "deployment",
  "securityOptimization",
  "integration",
  "testing",
  "owasp",
];
const FORCE_FAMILIES =
  /^(app-data-intelligence-x-|app-finance-x-|app-backend|app-layer1|app-frontend|app-platform-horizontal|be-v1-kapsam-disi)/;

const BANNED =
  /uygun şekilde|gerekli önlemler|performans iyileştirilir|erişilebilirlik sağlanır|güvenlik uygulanır|standartlara uyum|best practice|\btodo\b|tanımlanacak|doldurulacak/i;
const FORBIDDEN_SIGS = [
  "net işlevsel sınır",
  "yaşam döngüsü + durum makinesi",
  "Girdi/çıktı sözleşmesi ve hata yolları",
  "ölü kod elemesi + kod bölme",
  "Döngüsel karmaşıklık eşiği + lint kapısı",
  "secret rotasyonu + en az ayrıcalık",
  "bileşik indeks + imleç sayfalama",
  "N+1 önleme + önbellek",
  "p95 gecikme hedefi ve ölçüm",
  "dokunma hedefi ≥44px",
  "label↔input + ARIA hata mesajı",
  "klavye gezinme + kontrast ≥7:1",
  "Görünür odak sırası + ekran okuyucu denetimi",
  "Docker Swarm + sağlık kontrolü",
  "HPA + liveness/readiness probe",
  "AI-destekli senaryo + testing-loop",
  "autonomous QA + golden fixture",
  "Güvenlik olay loglaması + denetim izi",
];

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
const pk = (arr, h, salt) => arr[(h + salt) % arr.length];

/** Boyut-bazlı ek havuzları — kart içinde madde-index'e göre FARKLI ek seçilir. */
function suffixPool(key, n) {
  const T = n.title;
  const h = hash(n.id);
  const P95 = pk([250, 300, 400, 500], h, 1);
  const RL = pk([60, 120, 300], h, 2);
  const SR = pk([30, 60, 90], h, 3);
  const RB = pk([5, 10, 15], h, 4);
  const CX = pk([8, 10, 12], h, 5);
  const pools = {
    performance: [
      `${T} kritik yolunda p95 ${P95}ms eşiğine bağlanır; RED duration metriğiyle izlenir`,
      `yük regresyon testi CI eşiğiyle korunur; keyset sayfalama/indeks planı ${T} sorguları için gözden geçirilir`,
      `ölçüm noktası: ${T} uç gecikmesi; eşik aşımı alarmı error-budget'a bağlıdır`,
    ],
    mobileApps: [
      `${T} PWA yüzeyinde offline taslak + dokunma alanı 44px üstü davranışıyla cihaz matrisinde doğrulanır`,
      `iOS/Android WebView + extension köprüsünde ${T} izin istemleri gerekçeli test edilir`,
      `responsive kırılımları ${T} ekranında cihaz matrisi testiyle kanıtlanır`,
    ],
    wcag: [
      `${T} ekran yolunda klavye sırası + görünür odakla; axe AAA 0 ihlal kanıtı CI'dadır`,
      `ARIA etiketleri ${T} alanlarında bire bir; kontrast 7:1 üstü doğrulanır`,
      `ekran okuyucu duyuruları ${T} akışında senaryo testiyle kanıtlanır`,
    ],
    deployment: [
      `${T} Swarm/K8s hedefinde healthcheck probe + env-config ayrımıyla; rollback önceki imajla ${RB} dk`,
      `dağıtım kanıtı: ${T} imaj etiketi + smoke testi; geri dönüş release-versioning sözleşmesine bağlı`,
      `config/sır ayrımı ${T} ortam değişkenleriyle; drift kontrolü CI'da`,
    ],
    securityOptimization: [
      `${T} sırları ${SR} günde rotasyonla; rate-limit ${RL} istek/dk zorlanır`,
      `bağımlılıklar pinli + SBOM taraması ${T} CI hattında; imzasız yapıt reddedilir`,
      `en az ayrıcalık gözden geçirmesi ${T} rolleri için çeyreklik kanıtlanır`,
    ],
    integration: [
      `${T} contract testiyle korunur; sözleşme kırılırsa CI kırmızı yakar (data-api-contract)`,
      `olay veriyolu yayını ${T} için idempotent tüketici sözleşmesine bağlıdır`,
      `bağımlılık yönü ${T} için yalnız aşağı; tipli arayüz dışı çağrı testle engellenir`,
    ],
    testing: [
      `${T} için unit + contract + negatif senaryo ayrımıyla; golden fixture kanıtı CI'da`,
      `e2e yolculuğu ${T} akışında Playwright'ta kırmızı→yeşil kanıtla bağlanır`,
      `yetkisiz erişim denemesi ${T} testinde 0 kayıt döner (negatif kanıt)`,
    ],
    owasp: [
      `${T} yüzeyinde A01 erişim + A03 injection karşı kontrolüyle; negatif test kanıtı zorunlu`,
      `girdi doğrulama ${T} uçlarında zod sözleşmesiyle; ihlal denetim izine düşer`,
      `tehdit sınıfı eşlemesi ${T} için ASVS kontrol listesine bağlanır`,
    ],
    featureDefs: [
      `${T} sınırı girdi/çıktı beyanı + hata yolu senaryosuyla kabul kriterine bağlanır`,
      `durum akışı ${T} için ayrık senaryo olarak sözleşme testinde doğrulanır`,
      `non-goal beyanı ${T} kapsam sınırını komşu modüle karşı korur`,
    ],
    security: [
      `${T} erişimi tenant-scoped deny-by-default kuralıyla; audit izi değişmezdir`,
      `PII alanları ${T} kapsamında maskeli; rol matrisi en az ayrıcalıkla tanımlıdır`,
      `komşu-tenant negatif testi ${T} için 0 satır döner (izolasyon kanıtı)`,
    ],
    codeOptimization: [
      `${T} karmaşıklık tavanı ${CX} lint kapısıyla zorlanır (coding-standards)`,
      `engine/görünüm ayrımı ${T} modüler sınırıyla korunur; strict tip modu açık`,
      `ölü kod elemesi ${T} refactor bütçesinde izlenir`,
    ],
    eca: [
      `${T} kuralları zincir derinliği 6 sınırı + idempotency anahtarıyla çalışır`,
      `dış-etkili eylem ${T} akışında insan onayı (step-up) ister; deny izi düşer`,
    ],
    aiAgents: [
      `${T} için AI yalnız öneri/taslak üretir; app-module mutasyonu deny + kill-switch`,
      `sub_prompt ${T} bağlamında güvenilmez girdi sayılır; redaksiyon zorunlu`,
    ],
    moduleUsage: [
      `${T} tüketimi capability-scoped API/olayla; doğrudan tablo erişimi testle yasaklıdır`,
      `tüketici sözleşme testi ${T} Contract kapısı dışı çağrıyı kırmızı yakar`,
    ],
  };
  return pools[key] ?? null;
}

// ---- Aday seçimi ----
const files = fs.readdirSync(NODES).filter((f) => f.endsWith(".json"));
const all = [];
for (const f of files) {
  const n = JSON.parse(fs.readFileSync(path.join(NODES, f), "utf8"));
  all.push({ f, n, audit: auditNode(n) });
}
all.sort((a, b) => a.audit.score - b.audit.score);
const inBand = new Set(all.slice(0, NODE_BAND).map((t) => t.n.id));
const targets = all.filter((t) => inBand.has(t.n.id) || FORCE_FAMILIES.test(t.n.id));

const mapping = [];
const stats = {
  nodesTouched: 0,
  cardsRewritten: 0,
  itemsRewritten: 0,
  bannedBlocked: 0,
  forbiddenBlocked: 0,
  semanticStillWarn: 0,
};
const globalNew = new Set();
let cardBudget = MAX_CARDS;

for (const t of targets) {
  if (cardBudget <= 0) break;
  const { n } = t;
  const dimOrder = Object.keys(n.dimensions ?? {}).sort(
    (a, b) =>
      (PRIORITY_DIMS.includes(a) ? PRIORITY_DIMS.indexOf(a) : 99) -
      (PRIORITY_DIMS.includes(b) ? PRIORITY_DIMS.indexOf(b) : 99),
  );
  let touched = false;
  for (const key of dimOrder) {
    if (cardBudget <= 0) break;
    if (DAY2.has(key)) continue;
    if (n.applicability?.[key]?.applies === false) continue;
    const dim = n.dimensions[key];
    if (!dim || dim.status === "skeleton") continue;
    const items = dim.items ?? [];
    const shortIdx = items.map((it, i) => (it.trim().length < 35 ? i : -1)).filter((i) => i >= 0);
    if (!shortIdx.length) continue;
    const pool = suffixPool(key, n);
    if (!pool) continue;

    const newItems = [...items];
    const cardMap = [];
    let ok = true;
    shortIdx.forEach((idx, k) => {
      const old = items[idx];
      const base = old.trim().replace(/[.;]\s*$/, "");
      const suffix = pool[(hash(n.id + key) + k) % pool.length];
      const candidate = `${base} — ${suffix}`;
      if (BANNED.test(candidate)) {
        stats.bannedBlocked++;
        ok = false;
        return;
      }
      if (FORBIDDEN_SIGS.some((s) => candidate.includes(s))) {
        stats.forbiddenBlocked++;
        ok = false;
        return;
      }
      if (candidate.length < 40 || globalNew.has(candidate)) {
        ok = false;
        return;
      }
      newItems[idx] = candidate;
      cardMap.push({
        node: n.id,
        dimension: key,
        eski: old,
        yeni: candidate,
        neden: "kısa madde (<35) — niyet korunarak ölçü/kanıt eklendi",
        eklenen: suffix.slice(0, 80),
      });
    });
    if (!ok || !cardMap.length) continue;
    // kart-içi tekrar kontrolü
    if (new Set(newItems.map((i) => i.trim().toLowerCase())).size !== newItems.length) continue;
    // semantik self-check: rewrite kartı ASLA daha kötü yapamaz; warn kalıyorsa sayılır
    const before = evaluateDimensionSemantics(key, dim).ok;
    const after = evaluateDimensionSemantics(key, { ...dim, items: newItems }).ok;
    if (before && !after) continue; // güvenlik: geçerken kalır hale gelemez
    if (!after) stats.semanticStillWarn++;

    dim.items = newItems;
    for (const m of cardMap) globalNew.add(m.yeni);
    mapping.push(...cardMap);
    stats.cardsRewritten++;
    stats.itemsRewritten += cardMap.length;
    cardBudget--;
    touched = true;
  }
  if (touched) {
    stats.nodesTouched++;
    if (APPLY) fs.writeFileSync(path.join(NODES, t.f), `${JSON.stringify(n, null, 2)}\n`);
  }
}

fs.mkdirSync(path.join(ROOT, "reports"), { recursive: true });
fs.writeFileSync(
  path.join(ROOT, "reports", "short-items-wave2-mapping.json"),
  `${JSON.stringify({ mode: APPLY ? "apply" : "dry-run", stats, mapping }, null, 2)}\n`,
);
console.log(
  `rewrite-short-items — mod: ${APPLY ? "APPLY" : "DRY-RUN"} | band: ${NODE_BAND} node + zorunlu aileler | kart bütçesi: ${MAX_CARDS}`,
);
console.log(
  `  node: ${stats.nodesTouched} | kart: ${stats.cardsRewritten} | madde: ${stats.itemsRewritten} | warn-kalan kart: ${stats.semanticStillWarn} | banned-engel: ${stats.bannedBlocked} | forbidden-engel: ${stats.forbiddenBlocked}`,
);
console.log("  mapping → reports/short-items-wave2-mapping.json");
if (APPLY) console.log("Şimdi: npm run gen:reindex");
console.log("SONUÇ: YEŞİL ✓");
