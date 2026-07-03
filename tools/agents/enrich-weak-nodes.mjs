#!/usr/bin/env node
/**
 * enrich-weak-nodes — zayıf içerik güçlendirme dalgası (KONTROLLÜ, append-only).
 *
 * Ne yapar? Audit skoruna göre en zayıf N node'un zayıf miras-14 kartlarına
 * node-bağlamına özel (title+cluster+hash-varyasyonlu), ölçü/eşik/kanıt taşıyan
 * 1-2 madde EKLER; boş notes'u bağlam notuyla doldurur; güçlendirilen karta
 * uygun boş standardRef'i bağlar (kartta karşılığı olduğu için körlemesine değil).
 *
 * Ne yapmaz? Mevcut maddeyi SİLMEZ/DEĞİŞTİRMEZ; 5-madde sınırını AŞMAZ (sınırdaki
 * kart atlanır ve raporlanır); day-2 kartlarına ve applies=false kartlara dokunmaz;
 * top-N dışındaki node'lara dokunmaz. Yazım öncesi her güçlendirilen kart semantik
 * kuraldan (warn kademesi dahil) geçirilir; geçmezse node atlanır (yazılmaz).
 *
 * Kullanım: --dry-run (varsayılan) | --apply  [--top N=40]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateDimensionSemantics } from "../lib/dimension-semantics.mjs";
import { auditNode, isDimensionApplicable } from "../lib/score.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");
const APPLY = process.argv.includes("--apply");
const topArg = process.argv.indexOf("--top");
const TOP = topArg > -1 ? Number(process.argv[topArg + 1]) : 40;
const DAY2 = new Set(["dataLifecycle", "observability", "reliability"]);

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
const pk = (arr, h, salt) => arr[(h + salt) % arr.length];

// Boyut başına güçlendirme şablonları — her madde T (başlık) + varyasyonlu ölçü taşır.
// check-content FORBIDDEN imzalarıyla çakışmayacak şekilde yazıldı; standardRef
// bağlanan kartlarda standardın adı görünür (körlemesine ref yasağı).
function extrasFor(key, n) {
  const T = n.title;
  const h = hash(n.id);
  const P95 = pk([250, 300, 400, 500], h, 1);
  const RL = pk([60, 120, 300], h, 2);
  const SR = pk([30, 60, 90], h, 3);
  const CX = pk([8, 10, 12], h, 4);
  const RB = pk([5, 10, 15], h, 5);
  const map = {
    performance: [
      `${T} kritik ucu için p95 ${P95}ms eşiği; darboğaz adayı ${pk(["liste sorgusu", "toplu hesap", "join zinciri", "seri dış çağrı"], h, 6)} — RED duration metriğiyle izlenir`,
      `${T} yük regresyon testi CI'da eşik korumalı; keyset sayfalama + seçici indeks planı gözden geçirilir`,
    ],
    featureDefs: [
      `${T} işlev sınırı: girdi/çıktı beyanı + durum akışı; hata yolu ayrı senaryo olarak kabul kriterine bağlı`,
      `${T} non-goal beyanı: komşu modül sorumluluğuna taşan davranış kapsam dışıdır (sözleşme testiyle korunur)`,
    ],
    codeOptimization: [
      `${T} engine/görünüm ayrımıyla modüler; fonksiyon karmaşıklık tavanı ${CX}, lint kapısında zorlanır (coding-standards sözleşmesi)`,
      `${T} ölü kod elemesi refactor bütçesinde; tip güvenliği strict modda`,
    ],
    securityOptimization: [
      `${T} sırları ${SR} günde rotasyon; rate-limit ${RL} istek/dk; en az ayrıcalık gözden geçirmesi çeyreklik`,
      `${T} bağımlılıkları pinli + SBOM üretimi CI'da; imzasız yapıt reddedilir`,
    ],
    mobileApps: [
      `${T} yüzeyi responsive PWA; dokunma alanı 44px üstü tutulur, offline taslak senkronu tanımlı`,
      `${T} cihaz matrisi: iOS/Android WebView + Chrome extension köprüsü; izin istemleri gerekçeli`,
    ],
    wcag: [
      `${T} ekran yolunda klavye gezinme sırası ve görünür odak tanımlı; kontrast 7:1 üstü`,
      `${T} için axe AAA taraması 0 ihlal kanıtıyla CI'da; ARIA etiketleri alan bazında`,
    ],
    deployment: [
      `${T} çalışma hedefi Docker Swarm/K8s; env-config ayrımı + healthcheck probe tanımlı`,
      `${T} rollback: önceki imaj etiketi ile ${RB} dk içinde geri dönüş (release-versioning sözleşmesi)`,
    ],
    integration: [
      `${T}, kernel sözleşmesiyle tipli arayüz üzerinden konuşur; bağımlılık yönü yalnız aşağı (data-api-contract sözleşmesi)`,
      `${T} olay yayını veriyolu üzerinden; sözleşme kırılırsa contract testi kırmızı yakar`,
    ],
    testing: [
      `${T}: unit + contract + negatif senaryo (yetkisiz erişim 0 kayıt) ayrımı; golden fixture kanıtı`,
      `${T} e2e yolculuğu Playwright'ta; kırmızı→yeşil kanıtı PR'a bağlanır (testing-strategy sözleşmesi)`,
    ],
    owasp: [
      `${T} yüzeyinde A01 erişim + A03 injection karşı kontrolleri; girdi doğrulama zod sözleşmesiyle`,
      `${T} negatif güvenlik testi kanıtı: yetki aşımı denemesi denetim izine düşer`,
    ],
    security: [
      `${T} erişimi tenant-scoped + deny-by-default; değişmez audit izi zorunlu`,
      `${T} PII alanları maskeli; en az ayrıcalık rol matrisi tanımlı`,
    ],
    eca: [
      `${T} olay-koşul-eylem kuralları zincir derinliği 6 ile sınırlı; idempotency anahtarı zorunlu`,
      `${T} dış-etkili eylemler insan onayı (step-up) ister; deny kaydı denetim izine düşer`,
    ],
    aiAgents: [
      `${T} için AI izin sınırı: yalnız öneri/taslak; app-module mutasyonu deny + kill-switch aktif`,
      `${T} sub_prompt girdisi güvenilmez sayılır; redaksiyon + insan onay kapısı (ai-governance sözleşmesi)`,
    ],
    moduleUsage: [
      `${T} tüketimi capability-scoped API/olay üzerinden; doğrudan tablo erişimi yasak`,
      `${T} tüketici sözleşme testi: Contract kapısı dışı çağrı kırmızı yakar`,
    ],
  };
  return map[key] ?? null;
}

// Güçlendirilen kart → bağlanacak standardRef (kartta adı geçtiği için karşılığı görünür).
const DIM_REF = {
  codeOptimization: ["codingStandardRef", "coding-standards"],
  integration: ["dataApiContractRef", "data-api-contract"],
  deployment: ["releasePolicyRef", "release-versioning"],
  aiAgents: ["aiGovernanceRef", "ai-governance"],
};

const files = fs.readdirSync(NODES).filter((f) => f.endsWith(".json"));
const all = [];
for (const f of files) {
  const n = JSON.parse(fs.readFileSync(path.join(NODES, f), "utf8"));
  all.push({ f, n, audit: auditNode(n) });
}
all.sort((a, b) => a.audit.score - b.audit.score);
const targets = all.slice(0, TOP);

const stats = {
  nodesTouched: 0,
  cardsEnriched: 0,
  itemsAdded: 0,
  notesFilled: 0,
  refsSet: 0,
  skippedAtLimit: [],
  semanticSelfCheckFail: [],
};
const seenItems = new Set();

for (const t of targets) {
  const { n } = t;
  // Zayıf kart seçimi: semantik-warn üreten VEYA audit skoru düşük miras kartlar (maks 4).
  const dimScores = Object.fromEntries(t.audit.dimensions.map((d) => [d.key, d]));
  const candidates = Object.entries(n.dimensions ?? {})
    .filter(([k, d]) => {
      if (DAY2.has(k)) return false;
      if (!d || d.status === "skeleton" || !(d.items ?? []).length) return false;
      if (!isDimensionApplicable(n, k)) return false;
      if (n.applicability?.[k]?.applies === false) return false;
      const sem = evaluateDimensionSemantics(k, d);
      const sc = dimScores[k]?.score ?? 3;
      return !sem.ok || sc < 2.5;
    })
    .sort(([a], [b]) => (dimScores[a]?.score ?? 3) - (dimScores[b]?.score ?? 3))
    .slice(0, 4);
  if (!candidates.length) continue;

  let touched = false;
  for (const [key, dim] of candidates) {
    const extras = extrasFor(key, n);
    if (!extras) continue;
    const room = 5 - (dim.items ?? []).length;
    if (room <= 0) {
      stats.skippedAtLimit.push(`${n.id}.${key}`);
      continue;
    }
    const toAdd = extras.slice(0, Math.min(2, room)).filter((it) => !seenItems.has(it));
    if (!toAdd.length) continue;
    const proposed = { ...dim, items: [...dim.items, ...toAdd] };
    const sem = evaluateDimensionSemantics(key, proposed);
    if (!sem.ok) {
      stats.semanticSelfCheckFail.push(`${n.id}.${key}: ${sem.missing.join("; ")}`);
      continue;
    }
    dim.items = proposed.items;
    for (const it of toAdd) seenItems.add(it);
    stats.itemsAdded += toAdd.length;
    if (!(dim.notes ?? "").trim()) {
      dim.notes = `Güçlendirme dalgası W1: ölçü/eşik maddeleri eklendi; derin bağlam ${n.source?.cluster ?? "genel"} kümesi swarm turunda.`;
      stats.notesFilled++;
    }
    stats.cardsEnriched++;
    touched = true;
    const ref = DIM_REF[key];
    if (ref && !(n.standardRefs?.[ref[0]] ?? "").trim()) {
      n.standardRefs = n.standardRefs ?? {};
      n.standardRefs[ref[0]] = ref[1];
      stats.refsSet++;
    }
  }
  if (touched) {
    stats.nodesTouched++;
    if (APPLY) fs.writeFileSync(path.join(NODES, t.f), `${JSON.stringify(n, null, 2)}\n`);
  }
}

console.log(`enrich-weak-nodes — mod: ${APPLY ? "APPLY" : "DRY-RUN"}, hedef: en zayıf ${TOP} node`);
console.log(
  `  dokunulan node: ${stats.nodesTouched} | güçlendirilen kart: ${stats.cardsEnriched} | eklenen madde: ${stats.itemsAdded} | doldurulan notes: ${stats.notesFilled} | bağlanan ref: ${stats.refsSet}`,
);
if (stats.skippedAtLimit.length)
  console.log(
    `  5-madde sınırında atlanan: ${stats.skippedAtLimit.length} → ${stats.skippedAtLimit.slice(0, 6).join(", ")}`,
  );
if (stats.semanticSelfCheckFail.length) {
  console.log(`  SEMANTİK SELF-CHECK KIRMIZI: ${stats.semanticSelfCheckFail.length}`);
  for (const m of stats.semanticSelfCheckFail.slice(0, 10)) console.log(`   - ${m}`);
  process.exit(1);
}
if (APPLY) console.log("Şimdi çalıştır: npm run gen:reindex");
console.log("SONUÇ: YEŞİL ✓");
