#!/usr/bin/env node
/**
 * check-standards-coverage (ADR-0027 — BLOKLAYICI). Düğüm `standardRefs` referans BÜTÜNLÜĞÜ:
 * her set edilen ref gerçek bir standarda (src/data/standards/<id>.json) ya da
 * techProfileRef için tech-profile id'sine çözülmeli. Boş ref serbest (lazy). Kapsam raporlanır.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const v = [];
const fail = (m) => v.push(m);
const rj = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

const stdDir = path.join(ROOT, "src", "data", "standards");
const standardIds = new Set(
  fs
    .readdirSync(stdDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, "")),
);
const techIds = new Set(
  rj(path.join(ROOT, "src", "data", "tech-profiles.json")).profiles.map((p) => p.id),
);

// Ref anahtarı → kanonik standart id (src/data/standards/<id>.json) eşlemesi.
// Anahtar adı standart dosya adından farklı olabildiğinde (ör. authzRef → authz-rbac-abac)
// çözümü yönlendirir. Buradaki anahtar set edilirse değeri, mapped kanonik id VEYA
// herhangi bir geçerli standart id olmalıdır. Haritada olmayan anahtarlar eskisi gibi
// (yalnız değer, standart havuzuna) çözülür — geriye uyumlu.
const REF_KEY_TO_STANDARD = {
  g11nRef: "g11n",
  a11yRef: "a11y",
  ssoRef: "sso",
  oidcRef: "oidc",
  mfaRef: "mfa",
  authzRef: "authz-rbac-abac",
  c13nRef: "c13n",
  c12nRef: "c12n",
  i18nRef: "i18n-standards",
  urlPolicyRef: "url-policy",
  tenancyRef: "tenancy",
  privacyRef: "privacy",
};

// Riskli düğümde boş tenancy/privacy ref POLİTİKASI (tur 3): WARN, FAIL değil.
// Gerekçe (ratchet): FAIL, henüz sınıflandırılmamış yüzlerce düğümü tek seferde
// bloklar ve gerekçesiz toplu ref doldurmaya (jenerik çöp) zorlar. WARN sayısı
// raporlanır; artışı PR incelemesinde görünür. FAIL'e çevirme kararı insanındır.
// Desenler apply-tenancy-privacy-refs.mjs ile AYNI tutulmalıdır.
const TENANCY_RISK =
  /tenant|tenancy|multi.?tenant|\brls\b|izolasyon|\biam\b|\bsso\b|\boidc\b|\bmfa\b|authz|auth\b|identity|kimlik|yetki|payment|ödeme/i;
const PRIVACY_RISK =
  /kvkk|gdpr|\bpii\b|kişisel veri|privacy|consent|rıza|dsar|müşteri|customer|payroll|bordro|\bhr\b|personel|üye|party|contact|iletişim|payment|ödeme|sipariş|\border\b/i;
const TENANCY_CLUSTERS = new Set(["kernel", "platform-horizontal"]);
const PRIVACY_CLUSTERS = new Set(["customer-revenue", "hr", "finance"]);
const warns = [];

const nodesDir = path.join(ROOT, "src", "data", "generated", "nodes");
const files = fs.readdirSync(nodesDir).filter((f) => f.endsWith(".json"));
let withRef = 0;
let refCount = 0;
for (const f of files) {
  const n = rj(path.join(nodesDir, f));
  // URL policy tüm WBS/content katmanlarının ortak taban sözleşmesidir. Ham legacy
  // JSON'a 467 kez kopyalanmaz; TaskNodeSchema ile aynı merkezi default burada uygulanır.
  const sr = { urlPolicyRef: "url-policy", ...(n.standardRefs || {}) };
  const hay = [n.id, n.title, n.summary ?? "", ...(n.tags ?? [])].join(" ");
  const cluster = n.source?.cluster ?? "";
  const tenancyRisk = TENANCY_CLUSTERS.has(cluster) || TENANCY_RISK.test(hay);
  const privacyRisk = PRIVACY_CLUSTERS.has(cluster) || PRIVACY_RISK.test(hay);
  const critical = n.priority === "critical" || n.criticalPath === true;
  if (tenancyRisk && !sr.tenancyRef) {
    // Kritik düğümde (priority=critical | criticalPath) boş ref = FAIL; diğerleri WARN.
    if (critical) fail(`${n.id}: KRİTİK tenancy-riskli düğümde tenancyRef boş (FAIL politikası)`);
    else warns.push(`${n.id}: tenancy-riskli düğümde tenancyRef boş`);
  }
  if (privacyRisk && !sr.privacyRef) {
    if (critical) fail(`${n.id}: KRİTİK privacy-riskli düğümde privacyRef boş (FAIL politikası)`);
    else warns.push(`${n.id}: privacy-riskli düğümde privacyRef boş`);
  }
  // Boyut ↔ ref bağı (dimension-contract-17.md): dolu kart, standardına bağlanmalı.
  const dimFilled = (k) => {
    const d = n.dimensions?.[k];
    return d && d.status !== "skeleton" && (d.items ?? []).length > 0;
  };
  if (dimFilled("observability") && !sr.observabilityRef)
    warns.push(`${n.id}: observability dolu ama observabilityRef boş`);
  if (dimFilled("testing") && !sr.testingStandardRef)
    warns.push(`${n.id}: testing dolu ama testingStandardRef boş`);
  if (dimFilled("reliability") && !(n.rollback ?? "").trim())
    warns.push(`${n.id}: reliability dolu ama rollback planı boş (kanıt bağı eksik)`);
  let has = false;
  for (const [k, val] of Object.entries(sr)) {
    if (!val) continue;
    has = true;
    refCount++;
    if (k === "techProfileRef") {
      if (!techIds.has(val)) fail(`${n.id}: standardRefs.${k} "${val}" tech-profile'a çözülemiyor`);
      continue;
    }
    // Mapped anahtar: değer, kanonik id VEYA herhangi bir standart id olabilir.
    const mapped = REF_KEY_TO_STANDARD[k];
    if (k === "urlPolicyRef" && val !== mapped) {
      fail(`${n.id}: standardRefs.urlPolicyRef yalnız kanonik "url-policy" olabilir`);
      continue;
    }
    if (!standardIds.has(val) && !(mapped && val === mapped)) {
      const hint = mapped ? ` (beklenen kanonik: "${mapped}")` : "";
      fail(`${n.id}: standardRefs.${k} "${val}" standarda çözülemiyor${hint}`);
    } else if (mapped && !standardIds.has(mapped)) {
      // Anahtar bilinen bir standarda eşleniyor ama o dosya yok — sözleşme boşluğu.
      fail(`${n.id}: standardRefs.${k} kanonik standardı "${mapped}.json" mevcut değil`);
    }
  }
  if (has) withRef++;
}

console.log(
  `Standart kapsamı — ${standardIds.size} standart, ${techIds.size} tech-profile; ${withRef}/${files.length} düğümde ≥1 ref (${refCount} ref).`,
);
if (warns.length > 0) {
  console.log(
    `UYARI (bloklamaz, ratchet): ${warns.length} eksik ref/kanıt bağı (tenancy/privacy/observability/testing/rollback)`,
  );
  for (const w of warns.slice(0, 10)) console.log(`  ! ${w}`);
  console.log(
    "  → ref doldurma: apply-tenancy-privacy-refs.mjs / apply-dimension-refs.mjs (--apply); rollback içerik işidir (elle)",
  );
} else {
  console.log("Ref/kanıt kapsaması: riskli düğümlerde boş ref, dolu kartta boş bağ yok ✓");
}
if (v.length === 0) {
  console.log("\nSONUÇ: YEŞİL ✓ (referans bütünlüğü tam)");
  process.exit(0);
}
console.log(`\nSONUÇ: KIRMIZI — ${v.length} dangling ref`);
for (const m of v.slice(0, 40)) console.log(`  - ${m}`);
process.exit(1);
