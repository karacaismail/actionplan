#!/usr/bin/env node
/**
 * fill-dimensions — İSKELET düğümlerin 14 boyutunu + 7 fazını + PM alanlarını
 * cluster/seviye-duyarlı, somut, kurumsal TR içerikle doldurur (merkezî generator deseni).
 * Zaten dolu (bespoke) düğümlere DOKUNMAZ. Eski projedeki uretim.mjs felsefesi:
 * %100 kapsama generator'dan; per-node derinlik sonradan overlay/ajanla.
 * Yalnız boyut/faz/PM alanlarını yazar; kimlik/hiyerarşi/bağımlılık KORUNUR.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NODES = path.resolve(__dirname, "..", "src", "data", "generated", "nodes");

const DIMS = [
  "featureDefs", "security", "codeOptimization", "securityOptimization", "performance",
  "mobileApps", "wcag", "deployment", "eca", "aiAgents", "testing", "owasp",
  "integration", "moduleUsage",
];
const DIM_TR = {
  featureDefs: "Özellik Tanımları", security: "Güvenlik Önlemleri",
  codeOptimization: "Kod Optimizasyonu", securityOptimization: "Güvenlik Optimizasyonu",
  performance: "Performans Optimizasyonu", mobileApps: "Mobil Uygulama Uyumu",
  wcag: "WCAG 2.2 AAA", deployment: "Dağıtım (Swarm/K8s/Shared)", eca: "ECA Kuralları",
  aiAgents: "AI Ajan Davranışı", testing: "Testler & QA", owasp: "OWASP & Standartlar",
  integration: "Kernel/Core Entegrasyonu", moduleUsage: "Modül Kullanımı",
};
const PHASES = ["requirements","test-plan","db-schema","development","test-qa","verification","release-maintenance"];

// Cluster domain profilleri (içeriği bağlama oturtur)
const CP = {
  kernel: { d: "metadata-driven ArcheType motoru ve çekirdek kontrol düzlemi", sec: "kernel düzeyinde yetki (authz) ve tenant izolasyonu", intg: "tüm üst katmanların dayandığı çekirdek" },
  scale: { d: "ölçek primitifleri (outbox, saga, idempotency, realtime)", sec: "mesaj bütünlüğü ve tekrar-saldırı koruması", intg: "kernel üstünde, modüllerin dayanıklılık tabanı" },
  layer1: { d: "in-tree yatay modül (workflow, audit, file, import)", sec: "modül sınırında yetki ve denetim izi", intg: "kernel+scale üstünde, app'lerce paylaşılan" },
  crosscut: { d: "kesişen ilgi (observability, privacy/KVKK, identity, i18n)", sec: "yatay güvenlik ve gizlilik kontrolleri", intg: "tüm app'lere enjekte edilen yatay servis" },
  cc: { d: "kesişen ilgi", sec: "yatay güvenlik/gizlilik", intg: "tüm app'lere yatay" },
  sus: { d: "platform yeteneği (tipli aksiyon yüzeyi, declarative türetme, durable execution)", sec: "aksiyon yüzeyi yetki tavanı ve sözleşme doğrulaması", intg: "kernel+layer1 üstünde otomasyon tabanı" },
  "platform-horizontal": { d: "yatay platform servisi (Studio, BPM, iPaaS, IAM, Audit)", sec: "kimlik/erişim yönetimi ve denetim", intg: "tüm app'lerin kullandığı yatay platform" },
  "core-operations": { d: "çekirdek operasyon ürünü (CRM, satış, e-ticaret, stok)", sec: "ticari veri RLS ve rol bazlı erişim", intg: "finans/tedarik modülleriyle entegre" },
  finance: { d: "finans & muhasebe (GİB e-fatura, çift kayıt, RevRec)", sec: "mali veri maskeleme, değişmez denetim izi, KVKK", intg: "ledger/billing çekirdeğiyle entegre" },
  "supply-chain": { d: "tedarik zinciri & lojistik (WMS, TMS, demand)", sec: "depo/sevkiyat yetkilendirmesi", intg: "stok ve satın alma modülleriyle" },
  hr: { d: "insan kaynakları (HRMS, bordro-TR, ATS)", sec: "özlük verisi gizliliği ve KVKK", intg: "muhasebe ve kimlik modülleriyle" },
  "customer-revenue": { d: "müşteri & gelir (helpdesk, pazarlama, CPQ)", sec: "müşteri PII koruması", intg: "CRM ve faturalama ile" },
  "content-collaboration": { d: "içerik & işbirliği (CMS, drive, wiki)", sec: "belge erişim kontrolü ve paylaşım", intg: "dosya ve kimlik modülleriyle" },
  "data-intelligence": { d: "veri & zeka (AI-first: copilot, RAG, BI)", sec: "PII redaksiyonu ve model girdisi denetimi", intg: "tüm modüllerin veri/AI tabanı" },
  vertical: { d: "dikey/sektörel çözüm (emlak, restoran, sağlık)", sec: "sektör mevzuatı uyumu", intg: "yatay modülleri sektöre uyarlar" },
  backend: { d: "backend altyapısı", sec: "API güvenliği", intg: "kernel ile" },
  frontend: { d: "frontend altyapısı (UI, tema, deploy)", sec: "XSS/CSP istemci koruması", intg: "tüm app UI'larının tabanı" },
  fe: { d: "frontend", sec: "istemci güvenliği", intg: "UI tabanı" },
  build: { d: "build & dağıtım hattı", sec: "tedarik zinciri güvenliği (SBOM)", intg: "CI/CD ile" },
  dx: { d: "geliştirici deneyimi (CLI, SDK)", sec: "yerel gizli anahtar yönetimi", intg: "tüm geliştirme akışı" },
  edu: { d: "eğitim içeriği", sec: "—", intg: "dokümantasyon" },
  kararlar: { d: "mimari karar (ADR)", sec: "karar gerekçesi", intg: "tüm mimariyi yönlendirir" },
  aday: { d: "aday ürün/özellik", sec: "fizibilite aşaması güvenlik taslağı", intg: "olgunlaşınca ilgili katmana" },
};
const DEFAULT_CP = { d: "modül", sec: "tenant izolasyonu ve rol bazlı erişim", intg: "kernel/core ile" };

const LEVEL_TR = { app:"uygulama", module:"modül", archetype:"ArcheType", stone:"taş", molecule:"molekül", element:"element", atom:"atom" };
const EFFORT = { app:55, module:21, archetype:13, stone:8, molecule:5, element:3, atom:2 };

function dims(node) {
  const cp = CP[node.source?.cluster] || DEFAULT_CP;
  const lv = LEVEL_TR[node.level] || "birim";
  const T = node.title;
  const items = {
    featureDefs: [
      `${T}: ${cp.d} kapsamında net işlevsel sınır`,
      `Girdi/çıktı sözleşmesi ve durum makinesi (${lv} seviyesi)`,
      "Hata yolları ve geri-dönüş davranışı tanımlı",
    ],
    security: [
      `Tenant izolasyonu: her satırda tenant_id + PostgreSQL RLS`,
      `${cp.sec}; least-privilege rol modeli`,
      "Tüm girdiler sunucu tarafı Zod/şema doğrulamasından geçer",
    ],
    codeOptimization: [
      "Katı TypeScript tipleri; Biome lint + ölü kod elemesi",
      "Saf fonksiyon/çekirdek ayrımı; UI'dan bağımsız engine",
      "Tree-shaking ve gerektiğinde kod bölme (lazy)",
    ],
    securityOptimization: [
      "Secret rotasyonu + ortam-bazlı gizli yönetimi",
      "Sıkı CSP, güvenli başlıklar, dış linklerde rel=noopener",
      "Rate-limit + brute-force/replay koruması",
    ],
    performance: [
      "Kritik sorgularda bileşik indeks; N+1 önleme",
      "İmleç tabanlı sayfalama + sonuç önbelleği",
      `${node.level === "app" ? "Ürün geneli" : "Modül"} için bütçeli ilk-yük (lazy chunk)`,
    ],
    mobileApps: [
      "Mobile-first; 320px+ duyarlı, dokunma hedefi ≥44px",
      "iOS/Android PWA (Capacitor sarmalı opsiyonu)",
      "Chrome extension uyumu için izole API yüzeyi",
    ],
    wcag: [
      "WCAG 2.2 AAA: metin kontrastı ≥7:1",
      "Tam klavye erişimi + görünür odak sırası",
      "ARIA rolleri/etiketleri; ekran okuyucu denetimi (axe)",
    ],
    deployment: [
      "Docker Swarm servis tanımı + sağlık kontrolü",
      "Kubernetes: HPA, liveness/readiness probe, kaynak limitleri",
      `Shared hosting (WordPress sınıfı) uyumu: ${node.level === "app" || node.level === "module" ? "statik SPA + JSON, sunucusuz" : "bağımsız statik artefakt"}`,
    ],
    eca: [
      `Olay→Koşul→Aksiyon kuralı (ör. ${T} durumu değişince bildirim)`,
      "Döngü kırıcı: maksimum zincir derinliği 6",
      "Dış etkili aksiyon allowlist + idempotency anahtarı",
    ],
    aiAgents: [
      "AI önerir, motor uygular; ajan asla principal değil",
      "Capability-gated: yetki = rol ∩ tenant ∩ ajan ∩ araç kapsamı",
      "sub_prompt güvenilmez girdi; yıkıcı işlemde insan onayı (step-up)",
    ],
    testing: [
      "Unit (Vitest) + şema/veri-bütünlüğü kapıları",
      "E2E + kullanıcı yolculukları (Playwright, AI-destekli senaryo)",
      "Testing-loop: aynı testi düzelene dek maks 6 tekrar, düzelmezse raporla; autonomous QA",
    ],
    owasp: [
      "OWASP Top 10:2025 kontrolleri (injection, access control, SSRF)",
      `${(node.source?.cluster === "data-intelligence" || node.tags?.includes("ai")) ? "OWASP LLM Top 10: prompt injection + güvensiz çıktı" : "Bağımlılık/tedarik zinciri taraması (SBOM)"}`,
      "Denetim izi + güvenlik olay loglaması",
    ],
    integration: [
      `${cp.intg}`,
      node.parentId ? "Üst düğümle sözleşmeli arayüz; yan modüllerle gevşek bağ" : "Çekirdek kontrol düzlemiyle doğrudan",
      "Olay veriyolu (event bus) üzerinden asenkron entegrasyon",
    ],
    moduleUsage: node.level === "app"
      ? ["Ürün ailesi; alt modülleri tek panelde varsayılan entegre sunar"]
      : [
          `Bu ${lv}, üst app içinde ${cp.d} işlevini sağlar`,
          "Diğer app'ler olay/araç kapsamı üzerinden tüketir (doğrudan DB erişimi yok)",
        ],
  };
  const out = {};
  for (const k of DIMS) out[k] = { key: k, title: DIM_TR[k], status: "filled", items: items[k], notes: "" };
  return out;
}

function phases(node) {
  const crit = {
    requirements: ["Kapsam ve paydaş onayı", "Kabul kriterleri taslağı"],
    "test-plan": ["Test stratejisi (unit/e2e/a11y)", "Testing-loop (maks 6) tanımı"],
    "db-schema": ["JSON/şema sözleşmesi (Zod)", "Göç/expand-contract planı"],
    development: ["Engine + UI bağımsızlığı", "Lint/tip kapıları yeşil"],
    "test-qa": ["E2E + axe AAA ihlali 0", "Kapsam eşiği"],
    verification: ["DoD karşılandı", "Kanıt (evidence) bağlandı"],
    "release-maintenance": ["CI→Pages dağıtımı", "Runbook + geri-alma planı"],
  };
  // test-önce: requirements+test-plan geçmiş, db-schema aktif, sonrası pending
  const st = { requirements: "passed", "test-plan": "passed", "db-schema": "active",
    development: "pending", "test-qa": "pending", verification: "pending", "release-maintenance": "pending" };
  const out = {};
  for (const p of PHASES) out[p] = { status: st[p], criteria: crit[p], passed: st[p] === "passed", notes: "" };
  return out;
}

const files = fs.readdirSync(NODES).filter((f) => f.endsWith(".json"));
let filled = 0, skipped = 0;
for (const f of files) {
  const p = path.join(NODES, f);
  const n = JSON.parse(fs.readFileSync(p, "utf8"));
  const already = Object.values(n.dimensions || {}).some((d) => d.status && d.status !== "skeleton");
  if (already) { skipped++; continue; }
  n.dimensions = dims(n);
  n.phases = phases(n);
  if (!n.acceptanceCriteria?.length) n.acceptanceCriteria = ["İşlevsel kabul kriterleri karşılandı", "AAA erişilebilirlik + güvenlik kapıları geçti"];
  if (!n.deliverables?.length) n.deliverables = [`${n.title} uygulaması`, "Testler + dokümantasyon"];
  if (!n.risks?.length) n.risks = [{ id: `r-${n.id}-1`, desc: "Üst katman sözleşmesi değişebilir", severity: "medium", mitigation: "Sözleşme testleri + sürümleme" }];
  if (!n.effort || !n.effort.estimate) n.effort = { estimate: EFFORT[n.level] || 5, unit: "sp", spent: 0 };
  if (n.state === "taslak") n.state = "aday";
  n.phase = "db-schema";
  fs.writeFileSync(p, `${JSON.stringify(n, null, 2)}\n`);
  filled++;
}
console.log(`[fill-dimensions] dolduruldu ${filled}, korundu (bespoke) ${skipped}, toplam ${files.length}.`);
