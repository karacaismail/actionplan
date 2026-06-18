#!/usr/bin/env node
/**
 * gen-prompts — her düğümün her boyutu için BAĞLAMA-ÖZGÜ bir AI prompt'u üretir
 * (dimensions[k].prompt). Prompt; düğümün id/başlık/seviye/küme/özet/etiketlerini gömer
 * → her düğümde benzersiz + "prompt niteliğinde" (Rapor 2 çözümü; 348× tekrar biter).
 * Bu prompt'lar "Export this task" ile dışa aktarılıp vibecoding ajanına verilir.
 * Yalnız dimensions[*].prompt alanını yazar; items/notes/şema korunur.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NODES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "generated", "nodes");

const DIM = {
  featureDefs: { tr: "Özellik Tanımları", kapsa: "net işlevsel kapsam, girdi/çıktı sözleşmesi, durum makinesi, hata yolları" },
  security: { tr: "Güvenlik Önlemleri", kapsa: "tenant izolasyonu (PostgreSQL RLS), PII sınıflandırma, rol bazlı erişim (least-privilege), değişmez audit kanıtı" },
  codeOptimization: { tr: "Kod Optimizasyonu", kapsa: "tip güvenliği, ölü kod elemesi, modülerlik, kod bölme, döngüsel karmaşıklık sınırı" },
  securityOptimization: { tr: "Güvenlik Optimizasyonu", kapsa: "secret rotasyonu, sıkı CSP, rate-limit, en az ayrıcalık sertleştirme, bağımlılık taraması" },
  performance: { tr: "Performans Optimizasyonu", kapsa: "bileşik indeks, önbellek, imleç sayfalama, N+1 önleme, ölçülebilir hedef (p95 gecikme)" },
  mobileApps: { tr: "Mobil Uygulama Uyumu", kapsa: "iOS/Android (PWA veya Capacitor), Chrome extension yüzeyi, dokunma hedefi ≥44px, offline davranışı" },
  wcag: { tr: "WCAG 2.2 AAA", kapsa: "kontrast ≥7:1, tam klavye erişimi, ARIA rolleri/etiketleri, görünür odak sırası" },
  deployment: { tr: "Dağıtım", kapsa: "Docker Swarm servisi, Kubernetes (HPA + liveness/readiness probe + kaynak limiti), WordPress sınıfı shared hosting kısıtı/uyumu" },
  eca: { tr: "ECA Kuralları", kapsa: "backend/engine tarafında çalışan ruleset (UI yalnız güvenli yönetim yüzeyi, serbest JS/SQL/shell yok). AI app/module üretim-güncelleme denemesinde deny; ArcheType prod update için geçmiş veri koruma, snapshot, rollback, compatibility, append-only/expand-contract; döngü kırıcı maks 6, idempotency, tenant isolation, action allowlist, step-up; ruleset yetki katmanları (system kilitli / platform owner / tenant yalnız güvenli parametre)" },
  aiAgents: { tr: "AI Ajan Davranışı", kapsa: "AI yalnız ArcheType taslağı/prod-update önerisi üretebilir; app/module üretemez/güncelleyemez; ruleset override edemez; doğrudan prod write yapamaz. ArcheType çok-parçalı sözleşme (fields/relations/permissions/ReBAC-ABAC/lifecycle/surfaces/workflows/migration/ai-policy). Admin akışı: prompt→draft→validation→diff→data-impact→dry-run→preview→approval→apply. AI doğrulama döngüsü: 1-3 otomatik, 3/6 admin'e çok-seçenekli soru, 9 tanı+dur. sub_prompt güvenilmez; kill-switch; step-up; PII redaksiyon" },
  testing: { tr: "Testler & QA", kapsa: "unit + e2e + kullanıcı yolculuğu + AI-destekli Playwright + testing-loop (maks 6 tekrar, düzelmezse raporla) + autonomous QA ajanı" },
  owasp: { tr: "OWASP & Standartlar", kapsa: "OWASP Top 10:2025 ilgili maddeleri (+ AI yüzeyi varsa LLM Top 10: prompt injection, güvensiz çıktı), bu görevin tehdit yüzeyi" },
  integration: { tr: "Kernel/Core Entegrasyonu", kapsa: "kernel/core/modüllerle entegrasyon: gerekli mi, hangi sözleşme/olay üzerinden, bağımlılık yönü" },
  moduleUsage: { tr: "Modül Kullanımı", kapsa: "bu birimi hangi app'ler nasıl tüketir (doğrudan DB değil, olay/araç kapsamı/üretilen API üzerinden)" },
};
const LEVEL = { app: "uygulama/dağ", module: "modül/kaya", archetype: "ArcheType/büyük taş", stone: "taş/orta taş", molecule: "molekül/küçük taş", element: "element/toz", atom: "atom" };
const CLUSTER = {
  kernel: "Kernel", scale: "Scale Primitifleri", layer1: "Layer 1 modülleri", crosscut: "Cross-cutting",
  sus: "Platform Yetenekleri", "platform-horizontal": "Platform & Yatay", "core-operations": "Çekirdek Operasyon",
  finance: "Finans & Muhasebe", "supply-chain": "Tedarik Zinciri", hr: "İnsan Kaynakları", "customer-revenue": "Müşteri & Gelir",
  "content-collaboration": "İçerik & İşbirliği", "data-intelligence": "Veri & Zeka (AI-first)", vertical: "Dikey/Sektörel",
  frontend: "Frontend", backend: "Backend", build: "Build & Dağıtım", dx: "Geliştirici Deneyimi", kararlar: "Kararlar (ADR)",
  edu: "Eğitim", aday: "Aday", layer0: "Layer 0 Atomik Tipler", atomic: "Atomik", meta: "Meta", landx: "Landing", genel: "Genel", egitim: "Eğitim",
};

function promptFor(node, key) {
  const d = DIM[key];
  const lvl = LEVEL[node.level] || node.level;
  const cl = CLUSTER[node.source?.cluster] || node.source?.cluster || "genel";
  const summary = (node.summary || "").replace(/\s+/g, " ").trim().slice(0, 180);
  const tags = (node.tags || []).slice(0, 6).join(", ");
  return [
    `"${d.tr}" boyutunu bu görev için üret.`,
    `Bağlam: ${node.id} — "${node.title}" (${lvl}; küme: ${cl}).${summary ? ` Özet: ${summary}` : ""}${tags ? ` Etiketler: ${tags}.` : ""}`,
    "Çıktı: 3-5 madde, Türkçe, somut ve uygulanabilir. Generic ifade kullanma; her maddeyi bu görevin gerçek işleviyle ilişkilendir.",
    "Güvenlik sınırı: AI maliyeti önemsizdir; güvenlik önceliklidir. AI app/module üretemez, app/module güncelleyemez, ruleset override edemez.",
    `Kapsa: ${d.kapsa}.`,
  ].join("\n");
}

const files = fs.readdirSync(NODES).filter((f) => f.endsWith(".json"));
let count = 0;
for (const f of files) {
  const p = path.join(NODES, f);
  const n = JSON.parse(fs.readFileSync(p, "utf8"));
  let changed = false;
  for (const key of Object.keys(DIM)) {
    if (!n.dimensions?.[key]) continue;
    n.dimensions[key].prompt = promptFor(n, key);
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(p, `${JSON.stringify(n, null, 2)}\n`);
    count++;
  }
}
console.log(`[gen-prompts] ${count} düğüme bağlama-özgü prompt yazıldı (14 boyut × ${count}).`);
