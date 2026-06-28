#!/usr/bin/env node
/**
 * gen-platform-meta — platform düğümlerine planlama meta'sı ekler (Faz P4-meta).
 * risks + metrics + schedule + effort + milestone. Böylece düğümler Gantt/Workload'da görünür
 * ve risk/ölçüt taşır. Gerçek planlama verisi (uydurma dolgu değil). Yalnız bu alanları yazar.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NODES = path.join(ROOT, "src", "data", "generated", "nodes");
const MILESTONE = "v0.3 — Platform dikey dilim";

// id -> { start, end (ISO), effort (adam-gün), risks[], metrics[] }
const META = {
  "platform-factory": {
    start: "2026-09-01",
    end: "2027-03-31",
    effort: 0,
    risks: [
      {
        id: "r-platform-scope",
        desc: "Dikey dilim kapsamı şişerse ilk teslim gecikir",
        severity: "high",
        mitigation: "Sadece Customer dilimi; diğer modüller sonraki iterasyona",
      },
    ],
    metrics: [
      { key: "Yeni app iskeletleme süresi", target: "< 1 gün" },
      { key: "Dikey dilim uçtan uca kapı durumu", target: "tüm kapılar yeşil" },
    ],
  },
  "platform-tenancy": {
    start: "2026-09-01",
    end: "2026-09-21",
    effort: 12,
    risks: [
      {
        id: "r-tenant-leak",
        desc: "Tenant bağlamı atlanırsa çapraz-tenant veri sızıntısı",
        severity: "critical",
        mitigation: "Fail-closed middleware + negatif test matrisi + RLS",
      },
    ],
    metrics: [
      { key: "Çapraz-tenant sızıntı testi", target: "0 sızıntı" },
      { key: "Bağlamsız sorgu reddi", target: "%100 reddedilir" },
    ],
  },
  "platform-authn-authz": {
    start: "2026-09-15",
    end: "2026-10-10",
    effort: 13,
    risks: [
      {
        id: "r-privilege-escalation",
        desc: "Resolver'da eksik yetki kontrolü ile yetki yükseltme",
        severity: "critical",
        mitigation: "Varsayılan-reddet guard + rol/izin matris testleri",
      },
    ],
    metrics: [
      { key: "Yetkisiz istek reddi", target: "401/403, %100" },
      { key: "Rol-izin matris test kapsamı", target: "≥ %90" },
    ],
  },
  "platform-db-schema": {
    start: "2026-09-21",
    end: "2026-10-19",
    effort: 14,
    risks: [
      {
        id: "r-migration-irreversible",
        desc: "Geri-alınamaz migration üretim verisini riske atar",
        severity: "high",
        mitigation: "expand-contract + downgrade testi + snapshot",
      },
    ],
    metrics: [
      { key: "Migration upgrade/downgrade round-trip", target: "%100 geçer" },
      { key: "Tenant-kapsamlı tablolarda indeks", target: "p95 sorgu < 50ms" },
    ],
  },
  "platform-customer-model": {
    start: "2026-10-12",
    end: "2026-10-26",
    effort: 7,
    risks: [
      {
        id: "r-customer-unique",
        desc: "tenant+email benzersizliği eksikse çift kayıt",
        severity: "medium",
        mitigation: "UniqueConstraint(tenant_id,email) + test",
      },
    ],
    metrics: [{ key: "Model kısıt testleri", target: "%100 geçer" }],
  },
  "platform-graphql-api": {
    start: "2026-10-19",
    end: "2026-11-16",
    effort: 15,
    risks: [
      {
        id: "r-graphql-nplus1",
        desc: "Dataloader yoksa N+1 ile gecikme patlaması",
        severity: "high",
        mitigation: "DataLoader + sorgu sayısı testi",
      },
      {
        id: "r-introspection",
        desc: "Üretimde açık introspection bilgi sızdırır",
        severity: "medium",
        mitigation: "Üretimde introspection kapalı + persisted queries",
      },
    ],
    metrics: [
      { key: "API p95 gecikme", target: "≤ 100ms" },
      { key: "Şema snapshot uyumu", target: "kırılma yok" },
    ],
  },
  "platform-customer-graphql": {
    start: "2026-11-09",
    end: "2026-11-23",
    effort: 7,
    risks: [
      {
        id: "r-customer-authz",
        desc: "Customer resolver'ında tenant guard atlanması",
        severity: "high",
        mitigation: "Resolver yetki + tenant negatif testleri",
      },
    ],
    metrics: [{ key: "Tenant izolasyonu API testi", target: "0 sızıntı" }],
  },
  "platform-ui-surface": {
    start: "2026-11-16",
    end: "2026-12-14",
    effort: 14,
    risks: [
      {
        id: "r-ui-a11y",
        desc: "Erişilebilirlik gerilemesi WCAG kapısını kırar",
        severity: "medium",
        mitigation: "axe e2e kapısı + bileşen testleri",
      },
    ],
    metrics: [
      { key: "axe WCAG 2.2 ihlali", target: "0 serious/critical" },
      { key: "İlk anlamlı boya (LCP)", target: "≤ 2.5s" },
    ],
  },
  "platform-customer-ui": {
    start: "2026-12-07",
    end: "2026-12-21",
    effort: 8,
    risks: [
      {
        id: "r-customer-form",
        desc: "Form doğrulama/hata durumları eksikse kötü UX + veri hatası",
        severity: "medium",
        mitigation: "Form doğrulama + hata-durumu testleri",
      },
    ],
    metrics: [{ key: "Form alanı a11y (label/ARIA)", target: "%100 alan etiketli" }],
  },
  "platform-seed-data": {
    start: "2026-10-19",
    end: "2026-11-02",
    effort: 8,
    risks: [
      {
        id: "r-seed-idempotent",
        desc: "Idempotent olmayan seed çift kayıt/kararsız e2e üretir",
        severity: "medium",
        mitigation: "ON CONFLICT DO NOTHING + tekrar-çalıştırma testi",
      },
    ],
    metrics: [{ key: "Seed tekrar-çalıştırma", target: "0 çift kayıt" }],
  },
  "platform-customer-seed": {
    start: "2026-11-02",
    end: "2026-11-16",
    effort: 5,
    risks: [
      {
        id: "r-customer-fixture",
        desc: "Fixture şema ile uyumsuzsa e2e kırmızı",
        severity: "low",
        mitigation: "Şema uyum + checksum testi",
      },
    ],
    metrics: [{ key: "Fixture şema uyumu", target: "%100" }],
  },
  "platform-observability": {
    start: "2026-11-16",
    end: "2026-12-07",
    effort: 12,
    risks: [
      {
        id: "r-pii-logs",
        desc: "Loglarda PII sızması KVKK/gizlilik ihlali",
        severity: "high",
        mitigation: "PII maskeleme + log denetimi (OWASP A09)",
      },
    ],
    metrics: [
      { key: "İstek izlenebilirliği (trace id)", target: "uçtan uca %100" },
      { key: "Audit log saklama", target: "≥ 90 gün, değişmez" },
    ],
  },
  "platform-cicd": {
    start: "2026-12-14",
    end: "2027-01-11",
    effort: 13,
    risks: [
      {
        id: "r-bad-deploy",
        desc: "Hatalı dağıtım canlıyı bozar; rollback gecikirse kesinti uzar",
        severity: "high",
        mitigation: "Bloklayıcı kapılar + liveness/readiness + tek-komut rollback",
      },
    ],
    metrics: [
      { key: "Dağıtım kesinti süresi", target: "< 10sn" },
      { key: "Başarısız deploy rollback", target: "otomatik/tek-komut" },
    ],
  },
};

let count = 0;
for (const [id, m] of Object.entries(META)) {
  const p = path.join(NODES, `${id}.json`);
  if (!fs.existsSync(p)) {
    console.warn(`[gen-platform-meta] node yok: ${id}`);
    continue;
  }
  const n = JSON.parse(fs.readFileSync(p, "utf8"));
  n.risks = m.risks;
  n.metrics = m.metrics;
  n.effort = { estimate: m.effort, unit: "d", spent: 0 };
  n.schedule = {
    start: m.start,
    end: m.end,
    actualStart: null,
    actualEnd: null,
    baselineStart: m.start,
    baselineEnd: m.end,
  };
  n.milestone = MILESTONE;
  fs.writeFileSync(p, `${JSON.stringify(n, null, 2)}\n`);
  count++;
}
console.log(`[gen-platform-meta] ${count} düğüme risk/metrik/takvim/efor/milestone yazıldı.`);
