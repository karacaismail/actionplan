#!/usr/bin/env node
/**
 * gen-items — boyut items[] + phase criteria[] + acceptanceCriteria + risks'i DÜĞÜME-ÖZGÜ üretir.
 * Her madde: düğüm başlığı + kümesinin GERÇEK domain terimleri + seviye + hash-varyasyon → benzersiz.
 * Eleştiri #1/Rapor 2 çözümü: "348x aynı kalıp" biter. Bespoke düğümler (elle/ajan yazılan) KORUNUR.
 * Yalnız items/criteria/acceptance/risks yazar; prompt/status/title/key/şema korunur.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NODES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "generated", "nodes");
// Elle/ajan yazılan bespoke düğümler korunur (üzerine yazma yok)
const BESPOKE_IDS = new Set(["k-surface", "k-control-planes", "k-agent-runtime", "k-sozlesme", "app-core-operations"]);
const isBespokeNode = (n) =>
  BESPOKE_IDS.has(n.id) || n.source?.cluster === "data-intelligence" || /crm/i.test(n.id);

// Küme domain sözlüğü: gerçek varlıklar + bağlama özel notlar
const DOM = {
  finance: { ent: ["fatura", "ledger kaydı", "tahsilat", "mizan", "KDV beyanı", "abonelik"], pii: "mali kayıt/IBAN", reg: "GİB e-fatura + KVKK", perf: "büyük defter sorgusu", evt: "fatura kesildi" },
  "core-operations": { ent: ["lead", "müşteri kartı", "sipariş", "stok hareketi", "POS satışı"], pii: "müşteri PII", reg: "KVKK", perf: "sipariş listesi", evt: "sipariş onaylandı" },
  hr: { ent: ["özlük kaydı", "bordro", "izin talebi", "performans formu"], pii: "özlük/SGK verisi", reg: "SGK + KVKK", perf: "bordro hesaplama", evt: "bordro kapandı" },
  "supply-chain": { ent: ["depo lokasyonu", "sevkiyat", "stok sayımı", "taşıma rotası"], pii: "taşıyıcı bilgisi", reg: "KVKK", perf: "stok hareketi sorgusu", evt: "sevkiyat çıktı" },
  "customer-revenue": { ent: ["destek talebi", "kampanya", "CPQ teklifi", "sadakat puanı"], pii: "müşteri iletişim verisi", reg: "KVKK + KVKK izin", perf: "talep kuyruğu", evt: "talep açıldı" },
  "content-collaboration": { ent: ["belge", "klasör", "wiki sayfası", "yorum"], pii: "paylaşım izinleri", reg: "KVKK", perf: "belge arama", evt: "belge paylaşıldı" },
  "data-intelligence": { ent: ["model", "embedding", "RAG kaynağı", "tahmin çıktısı"], pii: "eğitim verisi PII", reg: "AI + KVKK", perf: "vektör arama", evt: "tahmin üretildi" },
  kernel: { ent: ["ArcheType", "surface", "tenant context", "capability"], pii: "tenant verisi", reg: "tenant izolasyonu", perf: "metadata çözümleme", evt: "şema değişti" },
  scale: { ent: ["outbox mesajı", "saga adımı", "idempotency anahtarı", "realtime kanalı"], pii: "mesaj yükü", reg: "teslim garantisi", perf: "mesaj işleme hızı", evt: "mesaj yayınlandı" },
  layer1: { ent: ["workflow durumu", "audit olayı", "dosya nesnesi", "import işi"], pii: "olay aktörü", reg: "denetim izi", perf: "olay akışı", evt: "durum değişti" },
  crosscut: { ent: ["observability sinyali", "KVKK kaydı", "kimlik", "i18n anahtarı"], pii: "kişisel veri", reg: "KVKK + gözlemlenebilirlik", perf: "log/iz akışı", evt: "ihlal tespit edildi" },
  sus: { ent: ["tipli aksiyon", "declarative türetme", "durable adım", "conformance testi"], pii: "aksiyon bağlamı", reg: "aksiyon yetki tavanı", perf: "aksiyon yürütme", evt: "aksiyon tetiklendi" },
  "platform-horizontal": { ent: ["Studio tanımı", "BPM süreci", "IAM rolü", "audit kaydı"], pii: "kullanıcı kimliği", reg: "erişim yönetimi", perf: "süreç yürütme", evt: "süreç başladı" },
  vertical: { ent: ["sektör kaydı", "mevzuat alanı", "özel akış"], pii: "sektörel kişisel veri", reg: "sektör mevzuatı", perf: "sektör sorgusu", evt: "kayıt güncellendi" },
  frontend: { ent: ["UI bileşeni", "tema token", "rota"], pii: "istemci durumu", reg: "CSP/XSS", perf: "ilk yük", evt: "rota değişti" },
  backend: { ent: ["API uç noktası", "servis", "kuyruk"], pii: "istek verisi", reg: "API güvenliği", perf: "p95 gecikme", evt: "istek alındı" },
  build: { ent: ["CI işi", "artefakt", "SBOM", "deploy adımı"], pii: "yapı sırrı", reg: "tedarik zinciri (SLSA)", perf: "derleme süresi", evt: "build tamamlandı" },
  dx: { ent: ["CLI komutu", "SDK çağrısı", "scaffold"], pii: "yerel gizli anahtar", reg: "geliştirici gizliliği", perf: "komut yanıtı", evt: "komut çalıştı" },
  layer0: { ent: ["atomik tip", "değer nesnesi", "şema primitifi"], pii: "—", reg: "tip güvenliği", perf: "doğrulama maliyeti", evt: "tip doğrulandı" },
};
const DEFAULT_DOM = { ent: ["kayıt", "varlık", "işlem"], pii: "kişisel veri", reg: "KVKK", perf: "liste sorgusu", evt: "durum değişti" };
const LEVEL_SCOPE = { app: "ürün ailesi geneli", module: "modül sınırı", archetype: "ArcheType tanımı", stone: "alt-yetenek", molecule: "bileşen", element: "alan/kural", atom: "atomik birim" };

function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
function pick(arr, seed, n) {
  const out = []; const a = [...arr]; let s = seed;
  for (let i = 0; i < n && a.length; i++) { s = (s * 1103515245 + 12345) >>> 0; out.push(a.splice(s % a.length, 1)[0]); }
  return out;
}

function itemsFor(n) {
  const d = DOM[n.source?.cluster] || DEFAULT_DOM;
  const seed = hash(n.id);
  const [e1, e2] = pick(d.ent, seed, 2);
  const T = n.title;
  const scope = LEVEL_SCOPE[n.level] || "birim";
  const isArchetype = n.level === "archetype";
  const isAppOrModule = n.level === "app" || n.level === "module";
  const aiBoundary = isArchetype
    ? `${T}: AI yalnız ArcheType taslağı veya prod-update önerisi üretir; prod için snapshot + rollback + compatibility check + geçmiş veri koruma zorunlu`
    : isAppOrModule
      ? `${T}: AI bu ${n.level} seviyesini üretemez/güncelleyemez; sadece okur ve insan için changeset önerir`
      : `${T}: AI sadece öneri üretir; mutasyon ArcheType ruleset sınırına bağlıdır`;
  return {
    featureDefs: [`${T}: ${e1} ve ${e2} için net işlevsel sınır (${scope})`, `${e1} yaşam döngüsü + durum makinesi`, `Girdi/çıktı sözleşmesi ve hata yolları (${e2})`],
    security: [`${T}: ${e1} tablolarında tenant_id RLS + ${d.pii} maskeleme`, `${T} için rol bazlı erişim (least-privilege) + ${d.reg} uyum audit'i`, `${e2} işlemlerinde sunucu-taraflı doğrulama (${T})`],
    codeOptimization: [`${T} çekirdeğini UI'dan ayır; ${e1} tipleri katı (Zod)`, `${e2} yolunda ölü kod elemesi + kod bölme`, "Döngüsel karmaşıklık eşiği + lint kapısı"],
    securityOptimization: [`${T}: ${e1} erişiminde secret rotasyonu + en az ayrıcalık`, `${T} için sıkı CSP + rate-limit`, `${d.reg} kapsamında bağımlılık taraması`],
    performance: [`${T}: ${d.perf} için bileşik indeks + imleç sayfalama`, `${e1} listesinde N+1 önleme + önbellek`, `${T} p95 gecikme hedefi ve ölçüm`],
    mobileApps: [`${T} ekranı 320px+ duyarlı; ${e1} kartı dokunma hedefi ≥44px`, "iOS/Android PWA (Capacitor köprüsü)", `${e2} için offline taslak + senkron`],
    wcag: [`${T} formlarında label↔input + ARIA hata mesajı`, `${e1} tablosunda klavye gezinme + kontrast ≥7:1`, "Görünür odak sırası + ekran okuyucu denetimi"],
    deployment: [`${T} servisi Docker Swarm + sağlık kontrolü`, "Kubernetes: HPA + liveness/readiness probe + kaynak limiti", `Shared hosting: ${n.level === "app" || n.level === "module" ? "statik SPA + JSON" : "bağımsız artefakt"}`],
    eca: [`${T}: backend ruleset AI app/module üretim-güncelleme denemesini deny eder`, `${T} zincirinde döngü kırıcı (maks 6) + idempotency`, `ArcheType prod update: geçmiş veri korunur; append-only/expand-contract + step-up + rollback`],
    aiAgents: [aiBoundary, "sub_prompt güvenilmez girdi; ruleset override/disable denemesi anında deny", `${d.reg} kapsamında PII redaksiyon + kill-switch`],
    testing: [`${T} için unit + e2e + '${e1}' kullanıcı yolculuğu (Playwright)`, "AI-destekli senaryo + testing-loop (maks 6, düzelmezse raporla)", `${e2} için autonomous QA + golden fixture`],
    owasp: [`${T} yüzeyinde OWASP Top 10:2025 (özellikle A01 erişim, A03 injection)`, `${e1} için ${n.source?.cluster === "data-intelligence" ? "LLM Top 10 (prompt injection)" : "girdi/çıktı doğrulama"}`, "Güvenlik olay loglaması + denetim izi"],
    integration: [`${T}, kernel/core ile ${e1} sözleşmesi üzerinden entegre`, n.parentId ? "Üst düğümle tipli arayüz; yan modüllerle gevşek bağ" : "Çekirdek kontrol düzlemiyle doğrudan", `Olay veriyolu: '${d.evt}' yayını`],
    moduleUsage: n.level === "app" ? [`${T} ürün ailesi; alt modülleri tek panelde sunar`] : [`${T}, üst app içinde ${e1} işlevini sağlar (${scope})`, `Diğer app'ler ${e2}'yi üretilen API üzerinden tüketir (doğrudan DB yok)`],
  };
}

function phaseCriteriaFor(n) {
  const d = DOM[n.source?.cluster] || DEFAULT_DOM;
  const e = (DOM[n.source?.cluster] || DEFAULT_DOM).ent[hash(n.id) % d.ent.length];
  const T = n.title;
  return {
    requirements: [`${T} kapsamı + ${e} paydaş onayı`, "Kabul kriterleri taslağı"],
    "test-plan": [`${e} için test stratejisi (unit/e2e/a11y)`, "Testing-loop (maks 6) tanımı"],
    "db-schema": [`${e} Zod sözleşmesi + expand-contract göç`, `${d.reg} veri sınıflandırması`],
    development: [`${T} engine/UI ayrımı`, "Lint/tip kapıları yeşil"],
    "test-qa": [`${e} e2e + axe AAA 0 ihlal`, "Kapsam eşiği"],
    verification: [`${T} DoD + kanıt (evidence)`],
    "release-maintenance": [`${T} CI→Pages dağıtımı`, `${e} runbook + geri-alma`],
  };
}

function requiredBoundaryItems(n) {
  const T = n.title;
  return {
    eca: `${T}: backend ECA ruleset AI app/module mutasyonunu ve ruleset override denemesini deny eder`,
    aiAgents: `${T}: AI app/module üretemez veya güncelleyemez; yalnız ArcheType taslağı/prod-update önerisi üretebilir`,
  };
}

function prependUnique(arr, item) {
  const without = (arr || []).filter((x) => x !== item);
  return [item, ...without];
}

function enforceBoundaryItems(n) {
  const required = requiredBoundaryItems(n);
  if (n.dimensions?.eca) {
    n.dimensions.eca.items = prependUnique(n.dimensions.eca.items, required.eca);
    n.dimensions.eca.status = "filled";
  }
  if (n.dimensions?.aiAgents) {
    n.dimensions.aiAgents.items = prependUnique(n.dimensions.aiAgents.items, required.aiAgents);
    n.dimensions.aiAgents.status = "filled";
  }
}

const files = fs.readdirSync(NODES).filter((f) => f.endsWith(".json"));
let updated = 0, kept = 0;
for (const f of files) {
  const p = path.join(NODES, f);
  const n = JSON.parse(fs.readFileSync(p, "utf8"));
  if (isBespokeNode(n)) {
    enforceBoundaryItems(n);
    fs.writeFileSync(p, `${JSON.stringify(n, null, 2)}\n`);
    kept++;
    continue;
  } // elle/ajan yazılan bespoke korunur
  const items = itemsFor(n);
  for (const [k, arr] of Object.entries(items)) {
    if (n.dimensions[k]) { n.dimensions[k].items = arr; n.dimensions[k].status = "filled"; }
  }
  enforceBoundaryItems(n);
  const crit = phaseCriteriaFor(n);
  for (const [ph, c] of Object.entries(crit)) if (n.phases[ph]) n.phases[ph].criteria = c;
  const d = DOM[n.source?.cluster] || DEFAULT_DOM;
  const e = d.ent[hash(n.id) % d.ent.length];
  n.acceptanceCriteria = [`${n.title} için ${e} işlevsel kabulü karşılandı`, `${d.reg} + AAA erişilebilirlik kapıları geçti`];
  n.risks = [
    { id: `r-${n.id}-1`, desc: `${e} sözleşmesi/şeması üst katmanla uyumsuzlaşabilir`, severity: "medium", mitigation: "Sözleşme testleri + sürümleme (expand-contract)" },
    { id: `r-${n.id}-2`, desc: `${d.perf} ölçek altında yavaşlayabilir`, severity: "low", mitigation: "İndeks + önbellek + yük testi" },
  ];
  fs.writeFileSync(p, `${JSON.stringify(n, null, 2)}\n`);
  updated++;
}
console.log(`[gen-items] ${updated} düğüm benzersizleştirildi, ${kept} bespoke korundu.`);
