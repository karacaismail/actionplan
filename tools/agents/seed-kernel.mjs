#!/usr/bin/env node
/**
 * seed-kernel — flagship kernel düğümleri için ELLE yazılmış, düğüme-ÖZGÜ bespoke içerik
 * (swarm'ın kalite çıtası / gold-standard örneği). Ana döngüde yazıldı (alt-ajan değil → drop yok).
 * Yalnız hedef node JSON'larının dimensions/phases/PM alanlarını değiştirir; kimlik/hiyerarşi korunur.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NODES = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "src",
  "data",
  "generated",
  "nodes",
);

const DIM_TR = {
  featureDefs: "Özellik Tanımları",
  security: "Güvenlik Önlemleri",
  codeOptimization: "Kod Optimizasyonu",
  securityOptimization: "Güvenlik Optimizasyonu",
  performance: "Performans Optimizasyonu",
  mobileApps: "Mobil Uygulama Uyumu",
  wcag: "WCAG 2.2 AAA",
  deployment: "Dağıtım (Swarm/K8s/Shared)",
  eca: "ECA Kuralları",
  aiAgents: "AI Ajan Davranışı",
  testing: "Testler & QA",
  owasp: "OWASP & Standartlar",
  integration: "Kernel/Core Entegrasyonu",
  moduleUsage: "Modül Kullanımı",
};
const PHASES = [
  "requirements",
  "test-plan",
  "db-schema",
  "development",
  "test-qa",
  "verification",
  "release-maintenance",
];

// Her düğüm için 14 boyut (düğüme özgü) + 7 faz DoD + PM.
const SEED = {
  "k-surface": {
    status: "in-progress",
    progress: 45,
    effort: 21,
    phaseStatus: { requirements: "passed", "test-plan": "passed", "db-schema": "active" },
    dims: {
      featureDefs: [
        "Surface = ArcheType'ın UI/API/DB projeksiyonu; tek tanımdan form+tablo+endpoint türer",
        "Domain alanları + Workflow durum makinesi bağlama",
        "Alan tipi/validasyon/görünürlük metadata ile sürülür",
      ],
      security: [
        "Field-level authorization: her surface alanı için rol bazlı görünürlük/yazılabilirlik",
        "Surface tanımı değişimi değişmez audit (kim/ne/önce-sonra hash)",
        "Publish öncesi capability taraması — gizli/PII alan sızıntısı engeli",
      ],
      codeOptimization: [
        "Surface tanımından KOD ÜRETİMİ (runtime reflection yok) → generated TS tipleri",
        "Tek kaynak: şema→tip→form; el ile senkron yok",
      ],
      securityOptimization: [
        "Alan görünürlük allowlist (deny-by-default)",
        "Surface diff'inde tehlikeli geçişlerde (public yapma) step-up onay",
      ],
      performance: [
        "Geniş surface'lerde alan lazy hidrasyon + projection cache",
        "Tablo sanal-scroll; sunucu-taraflı sayfalama/sıralama",
      ],
      mobileApps: [
        "Üretilen formlar responsive (320px+); iOS/Android PWA; Capacitor kamera/dosya köprüsü",
        "Offline taslak + senkron çakışma çözümü",
      ],
      wcag: [
        "Üretilen her alanda label↔input bağı, ARIA hata mesajı, odak sırası",
        "Kontrast 7:1; zorunlu alan yalnız renkle değil metinle işaretli",
      ],
      deployment: [
        "Surface tanımları JSON → K8s ConfigMap; shared hosting'de statik servis",
        "Şema göçü expand-contract (yeni alan opsiyonel başlar)",
      ],
      eca: [
        "Backend ECA ruleset: AI app/module üretim-güncelleme denemesini deny eder; surface olayı yalnız risk azaltıcı workflow tetikler",
        "ArcheType prod update için geçmiş veri koruma + immutable snapshot + rollback + compatibility check zorunlu; döngü kırıcı maks zincir 6",
      ],
      aiAgents: [
        "AI yalnız ArcheType surface taslağı/prod-update önerisi üretir; app/module üretemez veya güncelleyemez",
        "AI alan tipini önerir ama uygulayamaz; ruleset override/disable denemesi deny, motor uygular",
      ],
      testing: [
        "Conformance test: üretilen API ↔ surface tanımı eşleşmesi (otomatik üretilir)",
        "Golden snapshot; surface diff'inde sözleşme testi; testing-loop maks 6",
      ],
      owasp: [
        "A08 Mass Assignment → alan allowlist zorunlu",
        "A01 Broken Object/Field Level Authorization → surface yetki matrisi",
      ],
      integration: [
        "Kernel şema motoru (k-schema) üstünde çalışır; çıktısını layer1-workflow tüketir",
        "Core ArcheType kaydı ile bağ; event bus'a surface.changed yayar",
      ],
      moduleUsage: [
        "TÜM app'ler kendi ArcheType'larını Surface üzerinden tanımlar (Studio bunu görselleştirir)",
        "Diğer modüller surface'i doğrudan DB değil, üretilen API üzerinden tüketir",
      ],
    },
  },
  "k-control-planes": {
    status: "in-progress",
    progress: 40,
    effort: 21,
    phaseStatus: { requirements: "passed", "test-plan": "passed", "db-schema": "active" },
    dims: {
      featureDefs: [
        "Dört kontrol düzlemi: Ops/DevOps, Developer-admin, Tenant-admin, Agent",
        "Her düzlem ayrı yüzey + ayrı yetki tavanı + ayrı audit kanalı",
      ],
      security: [
        "Düzlemler arası sıkı yalıtım: tenant düzlemi asla ops/cross-tenant göremez",
        "Agent düzlemi capability tavanı: agent asla principal değil",
        "Her düzlem eylemi düzlem etiketiyle audit'lenir",
      ],
      codeOptimization: [
        "Düzlem yetkisi tek policy modülünde (DRY); UI yalnız izinli aksiyonu render eder",
        "Ortak bileşen + düzlem-özel guard",
      ],
      securityOptimization: [
        "Ops düzlemi için zorunlu MFA + step-up; oturum kısa ömür",
        "Tehlikeli ops aksiyonları (tenant silme) çift onay",
      ],
      performance: [
        "Düzlem bazlı kod bölme (lazy); tenant düzlemi en hafif paket",
        "Yetki kararı önbelleği (kısa TTL)",
      ],
      mobileApps: [
        "Tenant düzlemi mobile-first öncelik; Ops düzlemi masaüstü-yoğun ama 320px erişilebilir",
        "Chrome extension yalnız tenant düzlemi yüzeyine",
      ],
      wcag: [
        "Her düzlem panelinde klavye tam erişim + görünür odak + AAA kontrast",
        "Kritik ops aksiyonlarında onay diyaloğu ARIA-modal",
      ],
      deployment: [
        "Tek SPA, düzlem rota+rol ile ayrışır; K8s'te aynı imaj",
        "Shared hosting'de düzlemler statik rota olarak çalışır",
      ],
      eca: [
        "Backend ECA: tenant düzleminde kota aşımında ops düzlemine uyarı + otomatik kısıtlama (zincir maks 6)",
        "AI app/module üretim-güncelleme ve geri-alınamaz ops aksiyonu ECA ile tetiklenemez",
      ],
      aiAgents: [
        "Agent düzlemi: AI yalnız ArcheType önerisi üretir; tool-scope ∩ tenant ∩ rol ∩ ruleset sınırına bağlıdır",
        "AI ops düzlemine, app/module üretimine ve ruleset override'a erişemez",
      ],
      testing: [
        "Düzlem-izolasyon testi: tenant A, B veya ops yüzeyini hiçbir yolla göremez",
        "Capability-deny e2e; testing-loop maks 6",
      ],
      owasp: [
        "A01 Broken Access Control → düzlem yetki matrisi + cross-tenant sızıntı fuzz",
        "A04 Insecure Design → en az ayrıcalık ilkesi düzlemlere gömülü",
      ],
      integration: [
        "Kernel authz/identity ile doğrudan; her modül kendi yüzeyini ilgili düzleme kaydeder",
        "Audit (layer1) tüm düzlem olaylarını toplar",
      ],
      moduleUsage: [
        "Her app, yüzeyini 4 düzleme göre etiketler; platform yatay servisleri (IAM/Audit) burada toplanır",
      ],
    },
  },
  "k-agent-runtime": {
    status: "todo",
    progress: 15,
    effort: 34,
    phaseStatus: { requirements: "passed", "test-plan": "active", "db-schema": "pending" },
    dims: {
      featureDefs: [
        "Agent Runtime: MCP araç kaydı, ajan belleği, çok-adımlı orkestrasyon",
        "Ajan yaşam döngüsü: plan→öner→onay→uygula→audit",
      ],
      security: [
        "Tool scope least-privilege: effective = user_role ∩ tenant ∩ agent_capability ∩ tool_scope",
        "sub_prompt UNTRUSTED girdi (instruction değil); enjeksiyon allowlist",
        "Ajan asla principal değil; her aksiyon human-on-behalf + audit",
      ],
      codeOptimization: [
        "Araç kaydı tipli sözleşme (Zod); ajan çıktısı şema-doğrulanır",
        "Bellek katmanı arayüz arkasında (takılabilir)",
      ],
      securityOptimization: [
        "MCP sunucu allowlist + çıktı doğrulama (insecure output handling)",
        "Maliyet/rate limit; kill-switch (agent/tenant/global)",
      ],
      performance: [
        "Araç çağrıları paralel + timeout; bellek özetleme ile bağlam küçültme",
        "Sonuç önbelleği; gereksiz model çağrısı engeli",
      ],
      mobileApps: [
        "Ajan onay kartları mobile-first; push bildirimli step-up",
        "Chrome extension'dan ajan tetikleme (kısıtlı kapsam)",
      ],
      wcag: [
        "Ajan öneri/onay akışı tam klavye + ekran okuyucu; AAA kontrast",
        "DecisionCard '?' açıklaması onaylı corpus'tan (runtime LLM serbest üretmez)",
      ],
      deployment: [
        "Runtime ayrı servis; K8s'te HPA + GPU-opsiyonel node havuzu",
        "Shared hosting'de AI özellikleri devre-dışı graceful degrade",
      ],
      eca: [
        "Backend ECA: yüksek riskli ajan aksiyonu step-up onayı tetikler; döngü kırıcı maks zincir 6",
        "AI app/module üretim-güncelleme, ruleset override ve geri-alınamaz aksiyon (şema silme) tetikleyemez",
      ],
      aiAgents: [
        "BU DÜĞÜM ajan davranışının çekirdeği: AI yalnız ArcheType taslağı/prod-update önerisi üretir; model pinning + eval kapısı zorunlu",
        "Prod ArcheType update geçmiş veri korumalıdır; tenant verisi eğitime gitmez; PII redaksiyon",
      ],
      testing: [
        "Red-team corpus (RLS kapat / admin gibi davran / önceki kuralları unut) → hiçbiri aksiyona dönmez",
        "AI-destekli Playwright happy-path + adversarial; testing-loop maks 6; autonomous QA",
      ],
      owasp: [
        "OWASP LLM Top 10: Excessive Agency, Insecure Output, Prompt Injection",
        "MCP güvenliği: girdi/çıktı doğrulama, SSRF",
      ],
      integration: [
        "Kernel authz/control-planes ile capability sözleşmesi; ChangeSet motoruna aksiyon önerir",
        "Layer1 audit'e forensic (actor/agent/model/prompt-version) yazar",
      ],
      moduleUsage: [
        "AI özellikli her modül (Copilot/RAG/text-to-SQL) bu runtime'ı tüketir",
        "Modüller kendi araçlarını MCP kaydına ekler; runtime kapsamı uygular",
      ],
    },
  },
  "k-sozlesme": {
    status: "todo",
    progress: 10,
    effort: 13,
    phaseStatus: { requirements: "passed", "test-plan": "active", "db-schema": "pending" },
    dims: {
      featureDefs: [
        "Sözleşme yetenekleri: model/prompt pinleme, üretilmiş conformance test, projection",
        "Değişmez sözleşme sürümü + supersede disiplini",
      ],
      security: [
        "Sözleşme imzalı/sürümlü; yetkisiz sözleşme değişimi engeli + audit",
        "Projection çıktısı yalnız izinli alanları açar",
      ],
      codeOptimization: [
        "Sözleşmeden test ÜRETİMİ (el ile test yazımı azalır)",
        "Tek kaynak: sözleşme → conformance + tipler",
      ],
      securityOptimization: [
        "Prompt/model pin değişiminde onay; pin'siz prod çağrısı yasak",
        "Sözleşme drift'i otomatik alarm",
      ],
      performance: [
        "Projection materialized view; conformance testleri artımlı koşar",
        "Pin cache; gereksiz yeniden-üretim engeli",
      ],
      mobileApps: ["Sözleşme görünümü salt-okuma mobil; diff mobil-uyumlu"],
      wcag: ["Diff/sürüm görünümü AAA kontrast + klavye; renk-körü dostu ekle/çıkar işareti"],
      deployment: [
        "Sözleşmeler JSON artefakt; CI'da conformance kapısı; K8s init-job ile doğrulama",
      ],
      eca: [
        "Backend ECA: sözleşme sürümü değişince bağlı testleri+projection yenile (zincir maks 6)",
        "AI ruleset/prompt/model pin override denemesi deny; app/module üretim-güncelleme yolu kapalı",
      ],
      aiAgents: [
        "AI yalnız ArcheType sözleşme taslağı/prod-update önerisi üretir; pin'i insan onaylar; AI pin değiştiremez",
        "Prod güncellemede immutable snapshot, rollback ve geçmiş veri koruma zorunludur",
      ],
      testing: [
        "Üretilmiş conformance test = asıl kapı; drift testi; golden sözleşme fixture; testing-loop maks 6",
      ],
      owasp: [
        "A08 Software/Data Integrity (imzalı sözleşme/pin) → tedarik zinciri güvenliği",
        "A02 Cryptographic Failures → sözleşme imza/hash",
      ],
      integration: [
        "Kernel schema/surface ile bağ; ChangeSet operation'larını conformance'a bağlar",
        "242-k-sozlesme deseni: üretilmiş test ChangeSet doğrulamasına bağlanır",
      ],
      moduleUsage: [
        "Her modül kendi AI/şema sözleşmesini buraya pinler; CI conformance ile doğrular",
      ],
    },
  },
};

const PHASE_CRIT = {
  requirements: ["Kapsam + paydaş onayı", "Kabul kriterleri"],
  "test-plan": ["Test stratejisi (unit/e2e/a11y/red-team)", "Testing-loop (maks 6) tanımı"],
  "db-schema": ["Zod sözleşmesi + göç planı (expand-contract)"],
  development: ["Engine/UI ayrımı", "Lint/tip kapıları"],
  "test-qa": ["E2E + axe AAA 0 ihlal", "Kapsam eşiği"],
  verification: ["DoD + kanıt"],
  "release-maintenance": ["CI→Pages", "Runbook + geri-alma"],
};

let done = 0;
for (const [id, spec] of Object.entries(SEED)) {
  const p = path.join(NODES, `${id}.json`);
  if (!fs.existsSync(p)) {
    console.log(`[atla] ${id} yok`);
    continue;
  }
  const n = JSON.parse(fs.readFileSync(p, "utf8"));
  for (const [k, items] of Object.entries(spec.dims)) {
    n.dimensions[k] = { key: k, title: DIM_TR[k], status: "filled", items, notes: "" };
  }
  for (const ph of PHASES) {
    const st = spec.phaseStatus[ph] ?? "pending";
    n.phases[ph] = { status: st, criteria: PHASE_CRIT[ph], passed: st === "passed", notes: "" };
  }
  n.status = spec.status;
  n.progress = spec.progress;
  n.effort = { estimate: spec.effort, unit: "sp", spent: 0 };
  n.phase = "db-schema";
  n.state = "incelemede";
  if (!n.acceptanceCriteria?.length)
    n.acceptanceCriteria = [
      "Boyut sözleşmeleri kapalı-uçlu yazıldı",
      "AAA + güvenlik kapıları geçti",
    ];
  fs.writeFileSync(p, `${JSON.stringify(n, null, 2)}\n`);
  done++;
  console.log(`[bespoke] ${id}`);
}
console.log(`seed-kernel: ${done} flagship düğüm elle bespoke yazıldı.`);
