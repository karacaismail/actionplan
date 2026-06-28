#!/usr/bin/env node
/**
 * gen-platform — "Platform Fabrikası" build-out'unu WBS DÜĞÜMLERİ olarak üretir (Faz P4).
 *
 * Bu nedir? actionplan bir PLANLAYICI'dır; platform AYRI bir repo değildir. Bu script,
 *   50+ enterprise app'in üretileceği tenant-aware platformun build-out'unu actionplan'ın
 *   veri modeline 13 görev düğümü (1 app + 8 module + 4 archetype dikey-dilim) olarak ekler.
 * Stack (kullanıcı onaylı): backend FastAPI + GraphQL + PostgreSQL (Python; ORM SQLAlchemy/SQLModel,
 *   migration Alembic), frontend React + Vite + TanStack. Next.js/Supabase YASAK.
 * Ne yapar? Her düğümü; başlık/özet/kabul kriteri/teslimat/bağımlılık/test-planı(faz) + izlenebilirlik
 *   (traceability: implementationStatus="not-started", planlı testCommand/deployTarget) ile yazar.
 * Ne yapmaz? KOD üretmez/dağıtmaz; bunlar PLAN düğümleridir (status=backlog, boyutlar skeleton —
 *   henüz uygulanmadı, dürüstçe backlog). Uygulama gerçek kod yazıldığında traceability dolacaktır.
 *
 * Kapı uyumu: skeleton boyutlar içerik kapısınca denetlenmez; provenance "template" olduğundan
 *   quality-lint skor-gate etmez; owner=platform-ekibi (geçerli ekip); dependsOn gerçek id'lere işaret eder.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");
const TODAY = new Date().toISOString().slice(0, 10);

// Boyut başlıklarını mevcut bir düğümden al (birebir tutarlı titles) → hepsini skeleton yap.
const tmpl = JSON.parse(fs.readFileSync(path.join(NODES, "s-crm.json"), "utf8"));
const skeletonDimensions = () => {
  const out = {};
  for (const [key, d] of Object.entries(tmpl.dimensions)) {
    out[key] = {
      key,
      title: d.title,
      status: "skeleton",
      items: [],
      notes: "",
      prompt: "",
      provenance: "template",
    };
  }
  return out;
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
const skeletonPhases = (testPlan = []) => {
  const out = {};
  for (const p of PHASES) out[p] = { status: "pending", criteria: [], passed: false, notes: "" };
  if (testPlan.length) out["test-plan"].criteria = testPlan; // test-önce: plan kayda geçer
  return out;
};

const GRAN = { app: "dag", module: "kaya", archetype: "buyuk-tas" };
const trace = (extra = {}) => ({
  repoPath: [],
  testCommand: extra.testCommand ?? [],
  deployTarget: "hetzner-debian-docker (planlı)",
  implementationStatus: "not-started",
  tenantStrategy: extra.tenantStrategy ?? null,
  auditLogRef: null,
});

/** Düğüm spec listesi (1 app + 8 module + 4 archetype). dependsOn gerçek id'lere işaret eder. */
const SPECS = [
  {
    id: "platform-factory",
    level: "app",
    title: "Platform Fabrikası",
    icon: "ph-factory",
    parentId: null,
    dependsOn: ["k-tenancy", "k-authz", "k-schema"],
    tags: ["platform", "tenant", "fastapi", "graphql", "postgresql", "vite"],
    summary:
      "50+ enterprise app'in ortak omurgası: tenant-aware (çok-kiracılı) bir uygulama fabrikası. " +
      "Backend FastAPI + GraphQL + PostgreSQL (SQLAlchemy/SQLModel, Alembic); frontend React + Vite + TanStack. " +
      "İlk teslim, Customer modülü üzerinden uçtan uca bir dikey dilimdir.",
    acceptance: [
      "Bir dikey dilim (Customer) tenant izolasyonu, auth, DB, GraphQL API ve UI ile uçtan uca çalışır",
      "Tüm katmanlar test-önce: birim + API + frontend smoke + e2e + a11y kapıları yeşil",
      "Yeni bir app, fabrikanın desenleri kopyalanarak <1 günde iskeletlenebilir",
    ],
    deliverables: [
      "Platform mimari runbook (README + ADR seti)",
      "Customer dikey dilimi referans uygulaması",
      "App üretim şablonu (cookiecutter benzeri iskelet)",
    ],
    testPlan: [
      "Dikey dilim için uçtan uca kabul senaryoları yazıldı (test-önce)",
      "Tenant izolasyonu için negatif (sızıntı) test seti tanımlandı",
    ],
  },
  {
    id: "platform-tenancy",
    level: "module",
    title: "Çok-Kiracılık & İzolasyon",
    icon: "ph-buildings",
    parentId: "platform-factory",
    dependsOn: ["k-tenancy"],
    tags: ["tenant", "rls", "isolation", "postgresql"],
    summary:
      "Her sorgunun bir tenant bağlamında çalışmasını ve tenant'lar arası veri sızıntısının imkânsız " +
      "olmasını sağlayan izolasyon katmanı. Strateji kararı ADR-0026'da (schema-per-tenant vs RLS vs hibrit).",
    acceptance: [
      "Tenant bağlamı olmayan sorgu reddedilir (fail-closed)",
      "Negatif testler: tenant A, tenant B verisine hiçbir yoldan erişemez",
    ],
    deliverables: [
      "Tenant bağlam middleware'i (FastAPI dependency)",
      "RLS politikaları veya schema-per-tenant migration deseni",
    ],
    testPlan: [
      "Tenant sızıntısı için negatif test matrisi (test-önce)",
      "Bağlamsız sorgu reddi için birim testleri",
    ],
    tenantStrategy: "schema-per-tenant + RLS değerlendiriliyor (ADR-0026 bekliyor)",
  },
  {
    id: "platform-authn-authz",
    level: "module",
    title: "Kimlik & Yetkilendirme (RBAC)",
    icon: "ph-lock-key",
    parentId: "platform-factory",
    dependsOn: ["k-authz", "platform-tenancy"],
    tags: ["auth", "rbac", "jwt", "security"],
    summary:
      "Kimlik doğrulama (authn) ve rol-tabanlı yetkilendirme (authz). Token doğrulama, rol/izin " +
      "modeli ve her GraphQL alanında yetki kontrolü. En az ayrıcalık ilkesi.",
    acceptance: [
      "Yetkisiz istek 401/403 ile reddedilir; yetki kontrolü resolver seviyesinde uygulanır",
      "Rol→izin matrisi testlerle doğrulanır",
    ],
    deliverables: ["JWT doğrulama + oturum", "RBAC izin kontrol katmanı (GraphQL directive/guard)"],
    testPlan: [
      "Yetki bypass için negatif testler (test-önce)",
      "Rol-izin matrisi için tablo-temelli testler",
    ],
  },
  {
    id: "platform-db-schema",
    level: "module",
    title: "PostgreSQL Şema & Migration",
    icon: "ph-database",
    parentId: "platform-factory",
    dependsOn: ["k-schema", "platform-tenancy"],
    tags: ["postgresql", "sqlalchemy", "alembic", "migration"],
    summary:
      "PostgreSQL veri modeli; ORM olarak SQLAlchemy 2.0/SQLModel, migration olarak Alembic. " +
      "Geri-alınabilir (reversible) ve expand-contract migration deseni; tenant-aware tablolar.",
    acceptance: [
      "Her migration ileri+geri (upgrade/downgrade) test edilir",
      "Tüm tenant-kapsamlı tablolarda tenant_id ve uygun indeksler vardır",
    ],
    deliverables: [
      "SQLAlchemy/SQLModel model tabanı",
      "Alembic migration zinciri + seed kancaları",
    ],
    testPlan: [
      "Migration upgrade/downgrade round-trip testleri (test-önce)",
      "Şema kısıt (constraint) ve indeks doğrulama testleri",
    ],
    tenantStrategy: "schema-per-tenant + RLS (ADR-0026)",
  },
  {
    id: "platform-graphql-api",
    level: "module",
    title: "FastAPI GraphQL API Sözleşmesi",
    icon: "ph-graph",
    parentId: "platform-factory",
    dependsOn: ["platform-db-schema", "platform-authn-authz"],
    tags: ["fastapi", "graphql", "api", "contract"],
    summary:
      "FastAPI üzerinde GraphQL şeması (query + mutation). Tipli sözleşme, N+1 önleme (dataloader), " +
      "hata yolları ve yetki entegrasyonu. Sözleşme şema-ilk (schema-first) tutulur.",
    acceptance: [
      "Query/mutation sözleşmesi şema snapshot testiyle kilitlenir",
      "N+1 sorgu yok (dataloader ile); p95 gecikme hedefi ölçülür",
    ],
    deliverables: ["GraphQL şema + resolver tabanı", "Dataloader + hata haritalama katmanı"],
    testPlan: [
      "API sözleşme (schema snapshot) testleri (test-önce)",
      "Resolver birim + entegrasyon testleri (yetki dahil)",
    ],
  },
  {
    id: "platform-ui-surface",
    level: "module",
    title: "React/Vite/TanStack UI Yüzeyi",
    icon: "ph-browser",
    parentId: "platform-factory",
    dependsOn: ["platform-graphql-api"],
    tags: ["react", "vite", "tanstack", "ui"],
    summary:
      "React + Vite + TanStack Router/Query tabanlı UI yüzeyi; paylaşılan tasarım token'ları, " +
      "erişilebilirlik (WCAG 2.2) ve GraphQL veri bağlama. Next.js kullanılmaz.",
    acceptance: [
      "UI, GraphQL API'den canlı veri ile çalışır; yükleme/hata durumları ele alınır",
      "a11y kapısı (axe) yeşil; klavye gezinme ve kontrast karşılanır",
    ],
    deliverables: [
      "Paylaşılan UI bileşen tabanı + token'lar",
      "Customer ekranları (liste/detay/form)",
    ],
    testPlan: ["Frontend smoke + bileşen testleri (test-önce)", "e2e + a11y (axe) senaryoları"],
  },
  {
    id: "platform-seed-data",
    level: "module",
    title: "Seed / Fixture Verisi",
    icon: "ph-seal-check",
    parentId: "platform-factory",
    dependsOn: ["platform-db-schema"],
    tags: ["seed", "fixture", "data"],
    summary:
      "Geliştirme ve test için deterministik seed/fixture verisi; tenant-aware, tekrar-çalıştırılabilir " +
      "(idempotent) ve e2e senaryolarını besleyen sabit altın (golden) veri.",
    acceptance: [
      "Seed idempotenttir: tekrar çalıştırma çift kayıt üretmez",
      "e2e testleri seed altın veriye dayanır ve kararlıdır",
    ],
    deliverables: ["Idempotent seed script'i", "Golden fixture seti (Customer)"],
    testPlan: ["Seed idempotency testleri (test-önce)", "Fixture şema uyum testleri"],
  },
  {
    id: "platform-observability",
    level: "module",
    title: "Gözlemlenebilirlik (Log/Metrik/Trace)",
    icon: "ph-chart-line",
    parentId: "platform-factory",
    dependsOn: ["platform-graphql-api"],
    tags: ["observability", "logging", "metrics", "tracing", "audit"],
    summary:
      "Yapılandırılmış log, metrik ve dağıtık izleme (trace) + güvenlik denetim izi (audit log). " +
      "Tenant ve istek bağlamı her log/iz kaydında taşınır.",
    acceptance: [
      "Her istek korelasyon kimliği (trace id) ile uçtan uca izlenebilir",
      "Güvenlik olayları değiştirilemez denetim iziyle (audit log) kaydedilir",
    ],
    deliverables: [
      "Yapılandırılmış log + metrik exporter",
      "Audit log yazıcı + saklama politikası",
    ],
    testPlan: [
      "Audit log bütünlük (değiştirilemezlik) testleri (test-önce)",
      "Trace korelasyon yayılımı testleri",
    ],
    auditLogRef: "platform-observability/audit",
  },
  {
    id: "platform-cicd",
    level: "module",
    title: "CI/CD & Dağıtım (Hetzner/Debian/Docker)",
    icon: "ph-rocket-launch",
    parentId: "platform-factory",
    dependsOn: ["platform-graphql-api", "platform-ui-surface"],
    tags: ["cicd", "docker", "hetzner", "deploy"],
    summary:
      "GitHub private repo'dan Hetzner (Debian/AMD EPYC) sunucuya Docker tabanlı dağıtım; " +
      "bloklayıcı test kapıları, sağlık kontrolleri (liveness/readiness) ve geri-alma (rollback).",
    acceptance: [
      "Kırmızı test/lint kapısı dağıtımı durdurur (bloklayıcı)",
      "Başarısız dağıtım otomatik veya tek-komutla geri alınabilir (rollback)",
    ],
    deliverables: ["Docker imaj + compose/Swarm tanımı", "GitHub Actions deploy hattı + rollback"],
    testPlan: [
      "Deploy hattı kuru-çalıştırma (dry-run) doğrulaması (test-önce)",
      "Sağlık kontrolü + rollback senaryo testleri",
    ],
  },
  // --- Dikey dilim: Customer ArcheType (4 archetype) ---
  {
    id: "platform-customer-model",
    level: "archetype",
    title: "Customer Modeli (SQLAlchemy/SQLModel)",
    icon: "ph-user-circle",
    parentId: "platform-db-schema",
    dependsOn: ["platform-tenancy"],
    tags: ["customer", "model", "sqlalchemy", "tenant"],
    summary:
      "Dikey dilimin veri çekirdeği: tenant-aware Customer varlığı; SQLAlchemy/SQLModel modeli + " +
      "Alembic migration. Diğer üç archetype (GraphQL/UI/Seed) bunun üzerine kurulur.",
    acceptance: [
      "Customer tablosu tenant_id + indeksleri ile oluşturulur; migration round-trip geçer",
      "Model kısıtları (benzersizlik, zorunluluk) testlerle doğrulanır",
    ],
    deliverables: ["Customer SQLModel modeli", "Customer Alembic migration'ı"],
    testPlan: ["Model + migration round-trip testleri (test-önce)", "Tenant kapsam testleri"],
    tenantStrategy: "schema-per-tenant + RLS (ADR-0026)",
  },
  {
    id: "platform-customer-graphql",
    level: "archetype",
    title: "Customer GraphQL (Query + Mutation)",
    icon: "ph-graph",
    parentId: "platform-graphql-api",
    dependsOn: ["platform-customer-model", "platform-authn-authz"],
    tags: ["customer", "graphql", "api"],
    summary:
      "Customer için GraphQL query (liste/detay) ve mutation (oluştur/güncelle); yetki kontrolü ve " +
      "tenant bağlamı resolver seviyesinde uygulanır. N+1 önleme dataloader ile.",
    acceptance: [
      "customer(id)/customers query + createCustomer/updateCustomer mutation çalışır",
      "Yetkisiz/tenant-dışı erişim reddedilir (negatif testler yeşil)",
    ],
    deliverables: ["Customer GraphQL tipleri + resolver'lar", "Yetki + tenant guard entegrasyonu"],
    testPlan: ["Resolver sözleşme + yetki testleri (test-önce)", "Tenant izolasyonu API testleri"],
  },
  {
    id: "platform-customer-ui",
    level: "archetype",
    title: "Customer UI Yüzeyi (React)",
    icon: "ph-browser",
    parentId: "platform-ui-surface",
    dependsOn: ["platform-customer-graphql"],
    tags: ["customer", "react", "ui", "wcag"],
    summary:
      "Customer liste/detay/form ekranları; TanStack Query ile GraphQL'e bağlanır, paylaşılan token'ları " +
      "kullanır. Erişilebilirlik (WCAG 2.2) ve mobil-öncelikli yerleşim.",
    acceptance: [
      "Liste/detay/form ekranları canlı API ile uçtan uca çalışır",
      "a11y (axe) yeşil; form alanları label↔input + ARIA hata mesajıyla",
    ],
    deliverables: ["Customer liste/detay/form bileşenleri", "Form doğrulama + hata durumları"],
    testPlan: ["Bileşen + frontend smoke testleri (test-önce)", "e2e + a11y senaryoları"],
  },
  {
    id: "platform-customer-seed",
    level: "archetype",
    title: "Customer Seed Verisi",
    icon: "ph-seal-check",
    parentId: "platform-seed-data",
    dependsOn: ["platform-customer-model"],
    tags: ["customer", "seed", "fixture"],
    summary:
      "Customer dikey dilimi için deterministik seed/golden fixture; e2e senaryolarını besler, " +
      "idempotenttir ve tenant-aware'dir.",
    acceptance: [
      "Seed idempotenttir; e2e testleri bu altın veriye dayanır",
      "Fixture, Customer şemasıyla uyumludur (kırılırsa test kırmızı)",
    ],
    deliverables: ["Customer seed script'i", "Customer golden fixture"],
    testPlan: ["Seed idempotency + şema uyum testleri (test-önce)"],
  },
];

let written = 0;
SPECS.forEach((s, i) => {
  const node = {
    schemaVersion: tmpl.schemaVersion ?? "1.0.0",
    id: s.id,
    // reindex wbsCode'u yeniden atar; ama köklerini ÖNCE wbsCode'a göre sıralar. App'i en sona
    // koymak (mevcut 1..27 kodlarını korumak) için yüksek bir sıralama-ipucu veriyoruz → reindex "28" yapar.
    wbsCode: s.level === "app" ? "99" : "",
    level: s.level,
    title: s.title,
    slug: s.id,
    summary: s.summary,
    parentId: s.parentId,
    // app kökü en sona eklensin (mevcut app wbsCode'ları korunur); çocuklar SPECS sırasıyla.
    order: s.level === "app" ? 100 : i,
    icon: s.icon ?? "ph-cube",
    tags: s.tags ?? [],
    dependsOn: s.dependsOn ?? [],
    blocks: [],
    related: [],
    refs: ["plan: docs/platform-wbs-plan.md"],
    criticalPath: false,
    status: "backlog",
    priority: "high",
    owner: "platform-ekibi",
    assignees: ["platform-ekibi"],
    effort: {},
    progress: 0,
    phase: "test-plan",
    phases: skeletonPhases(s.testPlan),
    milestone: null,
    schedule: {},
    deliverables: s.deliverables ?? [],
    acceptanceCriteria: s.acceptance ?? [],
    risks: [],
    rollback: null,
    evidence: [],
    metrics: [],
    ecaRules: [],
    dimensions: skeletonDimensions(),
    source: {
      corpus: "synthetic",
      originalId: "",
      granularity: GRAN[s.level] ?? "",
      cluster: "platform-factory",
    },
    state: "taslak",
    lastUpdated: TODAY,
    traceability: trace({
      testCommand: s.testCommand,
      tenantStrategy: s.tenantStrategy,
      auditLogRef: s.auditLogRef,
    }),
  };
  // auditLogRef özel alanı traceability'ye taşı (varsa)
  if (s.auditLogRef) node.traceability.auditLogRef = s.auditLogRef;
  fs.writeFileSync(path.join(NODES, `${s.id}.json`), `${JSON.stringify(node, null, 2)}\n`);
  written++;
});

console.log(`[gen-platform] ${written} platform düğümü yazıldı (1 app + 8 module + 4 archetype).`);
