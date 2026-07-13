import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { StandardContractSchema } from "../src/schemas/standard";

// MD→JSON entegrasyon testi (json-standards-integration-gap-report-2026-07-13, J1-J3).
// Test-önce: rules v2 / globalReadiness deseninin aynısı — bu dosya JSON
// sözleşmeleri yazılmadan ÖNCE yazıldı; kırmızı koşması bilinçlidir.
// J1 = mevcut sözleşmelere delta kurallar; J2 = P0 yeni sözleşmeler + kapılar;
// J3 = P1 yeni sözleşmeler + value-atom zaman tipleri; JSON-STD-4 = indeks/matris/CI.

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIRNAME, "..");
const STD = path.join(ROOT, "src/data/standards");

const stdOku = (id: string) => {
  const p = path.join(STD, `${id}.json`);
  expect(fs.existsSync(p), `sözleşme dosyası yok: ${id}.json`).toBe(true);
  return JSON.parse(fs.readFileSync(p, "utf8"));
};
const kucukMetin = (v: unknown) => JSON.stringify(v).toLowerCase();
const kuralIdleri = (j: { rules?: { id: string }[] }) => (j.rules ?? []).map((r) => r.id);

// ---------------------------------------------------------------------------
// J1 — mevcut sözleşmelere delta kurallar (kural id + kavram probe)
// ---------------------------------------------------------------------------
type Delta = { json: string; kuralIds: string[]; kavramlar: string[] };

const J1_DELTALAR: Delta[] = [
  {
    json: "i18n-standards",
    kuralIds: [
      "i18n-market-context-separation",
      "i18n-no-mixed-language-critical-flows",
      "i18n-l10n-operations",
    ],
    kavramlar: ["accountmarketcontext", "userpreferences", "pseudo-localization", "text expansion"],
  },
  {
    json: "g11n",
    kuralIds: ["g11n-market-context"],
    kavramlar: ["pazar", "locale"],
  },
  {
    json: "privacy",
    kuralIds: [
      "priv-binding-language",
      "priv-data-region-declaration",
      "priv-subprocessor-versioning",
      "priv-consent-record-language-version",
    ],
    kavramlar: ["bağlayıcı dil", "veri bölgesi", "alt işleyen"],
  },
  {
    json: "a11y",
    kuralIds: ["a11y-lang-attribute", "a11y-per-language-retest"],
    kavramlar: ["lang", "screen reader", "rtl"],
  },
  {
    json: "mfa",
    kuralIds: ["mfa-recovery-parity-per-market"],
    kavramlar: ["hesap kurtarma", "otp"],
  },
  {
    json: "edge-security",
    kuralIds: ["edge-identifier-uts39"],
    kavramlar: ["confusable", "mixed-script", "casefold"],
  },
  {
    json: "iac",
    kuralIds: ["iac-regional-measurement", "iac-data-region-replication-guard"],
    kavramlar: ["veri bölgesi", "latency", "replikasyon"],
  },
  {
    json: "observability",
    kuralIds: ["obs-telemetry-data-region"],
    kavramlar: ["telemetry", "veri bölgesi"],
  },
  {
    json: "quality-gates",
    kuralIds: ["qg-global-launch-gate"],
    kavramlar: ["global launch", "kill switch"],
  },
  {
    json: "design-system",
    kuralIds: ["ds-font-fallback-chain"],
    kavramlar: ["font fallback"],
  },
  {
    json: "ui-components",
    kuralIds: ["uic-ime-rtl-input"],
    kavramlar: ["ime", "rtl"],
  },
];

describe("JSON-STD-1 (J1) mevcut sözleşmelere delta kurallar", () => {
  for (const d of J1_DELTALAR) {
    it(`${d.json}.json yeni kuralları taşır`, () => {
      const j = stdOku(d.json);
      expect(() => StandardContractSchema.parse(j), `${d.json}: şema bozuldu`).not.toThrow();
      const ids = kuralIdleri(j);
      for (const kid of d.kuralIds) expect(ids, `${d.json}: kural eksik ${kid}`).toContain(kid);
      const metin = kucukMetin(j);
      for (const kavram of d.kavramlar)
        expect(metin, `${d.json}: kavram eksik "${kavram}"`).toContain(kavram);
    });
  }

  it("i18n-standards mevcut ortogonal ekseni korur (regresyon)", () => {
    expect(kuralIdleri(stdOku("i18n-standards"))).toContain("i18n-jurisdiction-orthogonal");
  });
});

// ---------------------------------------------------------------------------
// J2/J3 — yeni sözleşmeler
// ---------------------------------------------------------------------------
type Yeni = { id: string; family: string; kuralIds: string[]; kavramlar: string[] };

const YENI_SOZLESMELER: Yeni[] = [
  {
    id: "global-market-readiness",
    family: "governance",
    kuralIds: [
      "gmr-launch-gate-14",
      "gmr-ip-geolocation-not-identity",
      "gmr-market-kill-switch",
      "gmr-payment-market-matrix",
      "gmr-support-language-commitment",
      "gmr-moderation-per-locale",
    ],
    kavramlar: ["3-d secure", "chargeback", "dunning", "status page", "tartışmalı bölge"],
  },
  {
    id: "finance-money-model",
    family: "data",
    kuralIds: [
      "fin-money-decimal-iso4217",
      "fin-no-two-decimal-assumption",
      "fin-three-currency-separation",
      "fin-fx-date-declaration",
      "fin-rounding-policy",
      "fin-financial-state-six",
    ],
    kavramlar: ["iso 4217", "minor unit", "yuvarlama", "muhasebe para birimi", "reverse charge"],
  },
  {
    id: "identity-data",
    family: "data",
    kuralIds: [
      "idd-displayname-free",
      "idd-legal-name-structured",
      "idd-no-name-regex",
      "idd-address-country-template",
      "idd-phone-e164-dual",
      "idd-no-sms-assumption",
    ],
    kavramlar: ["displayname", "e.164", "upu s42", "posta kodu"],
  },
  {
    id: "search-quality",
    family: "data",
    kuralIds: [
      "srq-collation-version-pinned",
      "srq-transliteration-declared",
      "srq-diacritic-tolerance",
      "srq-field-tolerance-classes",
      "srq-turkish-case",
    ],
    kavramlar: ["collation", "transliteration", "diakritik", "icu"],
  },
  {
    id: "decision-grade-data",
    family: "data",
    kuralIds: [
      "dgd-chain-integrity",
      "dgd-analytics-dimensions",
      "dgd-event-names-not-translated",
      "dgd-original-and-normalized-money",
    ],
    kavramlar: ["dönem kilidi", "event", "normalize", "cohort"],
  },
];

describe("JSON-STD-2/3 (J2+J3) yeni sözleşmeler şema-geçerli ve içerik-tam", () => {
  for (const y of YENI_SOZLESMELER) {
    it(`${y.id}.json — StandardContractSchema + kurallar`, () => {
      const j = stdOku(y.id);
      const parsed = StandardContractSchema.parse(j);
      expect(parsed.id).toBe(y.id);
      expect(parsed.family).toBe(y.family);
      expect(parsed.rules.length).toBeGreaterThanOrEqual(y.kuralIds.length);
      const ids = kuralIdleri(j);
      for (const kid of y.kuralIds) expect(ids, `${y.id}: kural eksik ${kid}`).toContain(kid);
      const metin = kucukMetin(j);
      for (const kavram of y.kavramlar)
        expect(metin, `${y.id}: kavram eksik "${kavram}"`).toContain(kavram);
      for (const r of parsed.rules) {
        expect(r.rule.length, `${y.id}/${r.id}: kural metni boş`).toBeGreaterThan(20);
        expect(r.rationale.length, `${y.id}/${r.id}: rationale boş`).toBeGreaterThan(0);
      }
    });
  }
});

describe("JSON-STD-3b value-atom zaman tipleri", () => {
  it("registry eksik zaman atomlarını kanonik kaydeder", async () => {
    const mod = await import("../src/data/value-atom-registry");
    const ids = mod.VALUE_ATOM_REGISTRY.map((a: { id: string }) => a.id);
    for (const beklenen of ["local-date", "local-time", "zoned-datetime", "business-day"])
      expect(ids, `value atom eksik: ${beklenen}`).toContain(beklenen);
    // mevcutlar korunur
    for (const eski of ["timestamptz", "duration", "recurrence", "money", "i18n-text"])
      expect(ids, `mevcut atom kayboldu: ${eski}`).toContain(eski);
    // IANA kuralı: zoned-datetime tanımı IANA kimliğini şart koşar, sabit offset yasağı
    const zoned = mod.VALUE_ATOM_REGISTRY.find((a: { id: string }) => a.id === "zoned-datetime");
    const metin = kucukMetin(zoned);
    expect(metin).toContain("iana");
  });
});

// ---------------------------------------------------------------------------
// JSON-STD-4 — indeks / matris / kapı / anlatı-çapa entegrasyonu
// ---------------------------------------------------------------------------
const YENI_IDLER = YENI_SOZLESMELER.map((y) => y.id);
const REF_ANAHTARLARI = [
  "globalMarketReadinessRef",
  "financeModelRef",
  "identityDataRef",
  "searchQualityRef",
  "decisionGradeRef",
];

describe("JSON-STD-4 entegrasyon beşlisi", () => {
  const oku = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

  it("engineering-standards-index.md beş yeni standardı kataloglar", () => {
    const icerik = oku("docs/engineering-standards-index.md");
    for (const id of YENI_IDLER) expect(icerik, `indeks eksik: ${id}`).toContain(id);
  });

  it("standards/00-standards-index.md beş yeni standardı kataloglar", () => {
    const icerik = oku("docs/standards/00-standards-index.md");
    for (const id of YENI_IDLER) expect(icerik, `00-indeks eksik: ${id}`).toContain(id);
  });

  it("standards-applicability-matrix.md beş yeni ref anahtarına Z/Ö/N-A satırı verir", () => {
    const icerik = oku("docs/standards-applicability-matrix.md");
    for (const ref of REF_ANAHTARLARI) expect(icerik, `matris eksik: ${ref}`).toContain(ref);
  });

  it("market-readiness ve finance-model kapıları package scriptinden deploy'a bağlanır", () => {
    const pkg = JSON.parse(oku("package.json")) as { scripts: Record<string, string> };
    const kapilar = [
      ["qa:market-readiness", "check-market-readiness"],
      ["qa:finance-model", "check-finance-model"],
    ] as const;
    for (const [script, kapi] of kapilar) {
      expect(
        fs.existsSync(path.join(ROOT, `tools/agents/${kapi}.mjs`)),
        `kapı dosyası yok: ${kapi}.mjs`,
      ).toBe(true);
      expect(pkg.scripts[script], `package script eksik: ${script}`).toContain(`${kapi}.mjs`);
    }
    const deploy = oku(".github/workflows/deploy.yml");
    expect(deploy).toContain("run: npm run qa:market-readiness");
    expect(deploy).toContain("run: npm run qa:finance-model");
  });

  it("anlatı yönergeleri makine kontratı çapası taşır (00-index ilkesi)", () => {
    const capalar: Array<[string, string]> = [
      ["docs/global-market-readiness-directive.md", "global-market-readiness"],
      ["docs/financial-state-model-contract.md", "finance-money-model"],
      ["docs/actor-party-contract.md", "identity-data"],
      ["docs/k-search-directive.md", "search-quality"],
      ["docs/decision-grade-data-contract.md", "decision-grade-data"],
    ];
    for (const [dosya, id] of capalar) {
      const icerik = oku(dosya).toLowerCase();
      expect(icerik, `${dosya}: makine kontratı çapası eksik (${id}.json)`).toContain(`${id}.json`);
    }
  });

  it("J4 ref anahtarlarını task şeması ve makine applicability registry'sinde birlikte zorlar", () => {
    const taskSchema = oku("src/schemas/task.ts");
    const applicability = oku("src/data/standards-applicability.json");
    for (const ref of REF_ANAHTARLARI) {
      expect(taskSchema, `${ref} task.ts standardRefs şemasında eksik`).toContain(`${ref}:`);
      expect(applicability, `${ref} applicability registry'sinde eksik`).toContain(`"${ref}"`);
    }
  });
});
