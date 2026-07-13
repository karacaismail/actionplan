import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Global SaaS / i18n-ötesi kapsam testi (CPO talebi, 2026-07-13).
// Test-önce: bu dosya doküman güncellemelerinden ÖNCE yazıldı; kırmızı koşması
// bilinçlidir (kapsamın henüz yönergelerde olmadığının kanıtı). Yeşil, 19 konu
// alanının hedef yönergelere eksiksiz işlenmesiyle gelir.
// Probe ilkesi: her konu alanının AYIRT EDİCİ kavramları hedef dosyada aranır;
// yüzeysel "kelime geçsin" değil, kararın varlığını gösteren anahtar ifadeler.

const DIRNAME = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.resolve(DIRNAME, "../docs");

const oku = (p: string) => fs.readFileSync(path.join(DOCS, p), "utf8");
const okuKucuk = (p: string) => oku(p).toLowerCase();

type Probe = { dosya: string; beklenenler: string[] };

// Türkçe büyük/küçük tuzaklarından kaçınmak için karşılaştırma lowercase yapılır;
// beklenen ifadeler lowercase yazılmıştır.
const PROBLAR: Record<string, Probe> = {
  "temel-ayrim-ve-veri-modeli": {
    dosya: "standards/01-i18n-l10n-g11n-standard.md",
    beklenenler: [
      "dil ≠ locale",
      "uilanguage",
      "contentlanguages",
      "formatlocale",
      "accountmarketcontext",
      "billingcurrency",
      "dataregion",
      "contractlanguage",
      "taxjurisdiction",
      "measurementsystem",
      "başlangıç önerisi",
    ],
  },
  "kulturel-urun-uyumu": {
    dosya: "standards/01-i18n-l10n-g11n-standard.md",
    beklenenler: ["dil seçici", "bayrak", "resmiyet", "onboarding", "yerel terminoloji"],
  },
  "font-rendering-girdi": {
    dosya: "standards/01-i18n-l10n-g11n-standard.md",
    beklenenler: [
      "font fallback",
      "ime",
      "shaping",
      "hyphenation",
      "ligatür",
      "combining mark",
      "ruby",
      "dikey yazı",
      "rendering motoru",
    ],
  },
  "l10n-operasyonu": {
    dosya: "standards/01-i18n-l10n-g11n-standard.md",
    beklenenler: [
      "pseudo-localization",
      "çeviri belleği",
      "terminoloji sözlüğü",
      "text expansion",
      "fallback politikası",
      "in-context",
      "karışık dil fallback",
      "tone of voice",
      "eksik çeviri",
    ],
  },
  "hukuk-gizlilik-veri-yonetisimi": {
    dosya: "privacy-retention-decision-matrix.md",
    beklenenler: [
      "veri bölgesi",
      "sınır ötesi",
      "alt işleyen",
      "bağlayıcı dil",
      "cayma",
      "ebeveyn izni",
      "çerez",
      "yaptırım",
      "otomatik yenileme",
      "hukuki metinler normal ürün çevirisi",
    ],
  },
  "vergi-fatura-para-modeli": {
    dosya: "financial-state-model-contract.md",
    beklenenler: [
      "iso 4217",
      "minor unit",
      "reverse charge",
      "vergi dahil",
      "yuvarlama politikası",
      "iki ondalık",
      "faturalandırma para birimi",
      "muhasebe para birimi",
      "kur dönüşüm",
      "b2b",
      "peppol",
      "prorasyon",
    ],
  },
  "zaman-takvim-is-zamani": {
    dosya: "atomic-types-directive.md",
    beklenenler: [
      "instant",
      "iana",
      "europe/istanbul",
      "recurrence",
      "iş günü",
      "yaz saati",
      "doğum tarihi",
      "resmî ve bölgesel tatil",
      "sla durdurma",
      "faturalandırma kesim",
      "zoned date-time",
      "local date",
    ],
  },
  "kisi-adi-adres-telefon": {
    dosya: "actor-party-contract.md",
    beklenenler: [
      "tek isim",
      "e.164",
      "upu s42",
      "posta kodu",
      "transliteration",
      "displayname",
      "hukuki isim",
      "patronimik",
      "yazı sistemi",
      "otp teslimat",
    ],
  },
  "unicode-guvenligi-ve-global-auth": {
    dosya: "standards/03-authn-authz-iam-standard.md",
    beklenenler: [
      "uts #39",
      "confusable",
      "normalizasyon",
      "hesap kurtarma",
      "sms otp",
      "spoofing",
      "görünmez karakter",
      "mixed-script",
      "username",
      "migration planı",
    ],
  },
  "arama-siralama-transliteration": {
    dosya: "k-search-directive.md",
    beklenenler: [
      "collation",
      "transliteration",
      "segmentasyon",
      "diakritik",
      "latin klavye",
      "eş anlamlı",
      "locale sürüm",
      "dil tespiti",
      "eklemeli dil",
    ],
  },
  "erisilebilirlik-i18n-kesisimi": {
    dosya: "standards/02-a11y-accessibility-standard.md",
    beklenenler: [
      "lang",
      "telaffuz",
      "rtl",
      "screen reader",
      "her desteklenen dil",
      "focus sırası",
      "alt metin",
      "yerelleştirilmiş pdf",
      "sade dil",
    ],
  },
  "altyapi-performans-veri-bolgesi": {
    dosya: "standards/12-devops-infrastructure-standard.md",
    beklenenler: [
      "veri bölgesi",
      "cdn",
      "latency",
      "failover",
      "font indirme",
      "locale paket",
      "replikasyon",
      "üçüncü taraf script",
      "telemetry",
      "düşük bant genişliği",
    ],
  },
  "fiyatlandirma-paketleme": {
    dosya: "standards/10-business-model-switching-standard.md",
    beklenenler: [
      "satın alma gücü",
      "vergi dahil",
      "fiyat sonlandırma",
      "procurement",
      "yerel rakip",
      "günlük kurla çevir",
      "deneme süresi",
      "minimum sözleşme",
    ],
  },
  "analitik-ve-deneyler": {
    dosya: "decision-grade-data-contract.md",
    beklenenler: [
      "ui dili",
      "format locale",
      "event ad",
      "normalize para",
      "cohort",
      "consent",
      "çeviri sürümü",
      "a/b",
      "veri bölgesi",
    ],
  },
  "global-launch-gate": {
    dosya: "standards/14-enterprise-readiness-checklist.md",
    beklenenler: [
      "global launch",
      "hesabını kurtarabil",
      "doğru vergiyle",
      "saat diliminde",
      "kill switch",
      "in-market",
      "unicode spoofing",
      "rollback",
    ],
  },
  "odeme-pazari": {
    dosya: "global-market-readiness-directive.md",
    beklenenler: [
      "3-d secure",
      "dunning",
      "chargeback",
      "mandate",
      "direct debit",
      "dijital cüzdan",
      "acquiring",
      "settlement",
      "taksit",
      "güçlü müşteri doğrulaması",
    ],
  },
  "ugc-moderasyon": {
    dosya: "global-market-readiness-directive.md",
    beklenenler: [
      "moderasyon",
      "nefret",
      "yerel argo",
      "yanlış pozitif",
      "prompt injection",
      "dil fallback davranışı",
      "moderatör güvenliği",
    ],
  },
  "cografya-politik": {
    dosya: "global-market-readiness-directive.md",
    beklenenler: [
      "tartışmalı bölge",
      "ip geolocation",
      "harita sınır",
      "bağımlı bölge",
      "vpn",
      "sürümlü",
      "hizmet verilmeyen bölge",
    ],
  },
  "dagitim-seo": {
    dosya: "global-market-readiness-directive.md",
    beklenenler: [
      "hreflang",
      "app store",
      "yerel anahtar kelime",
      "landing page",
      "ip bazlı zorunlu yönlendirme",
      "url-policy.md",
    ],
  },
  "destek-satis-operasyon": {
    dosya: "global-market-readiness-directive.md",
    beklenenler: [
      "status page",
      "escalation",
      "hangi dilde destek",
      "güvenlik olay",
      "fatura itiraz",
      "yerel tatil",
      "yardım merkezi",
    ],
  },
};

describe("GLOBAL-READINESS kapsama — 19 konu alanı hedef yönergelerde", () => {
  for (const [konu, probe] of Object.entries(PROBLAR)) {
    it(`${konu} → ${probe.dosya}`, () => {
      const dosyaYolu = path.join(DOCS, probe.dosya);
      expect(fs.existsSync(dosyaYolu), `hedef yönerge yok: ${probe.dosya}`).toBe(true);
      const icerik = okuKucuk(probe.dosya);
      for (const beklenen of probe.beklenenler) {
        expect(icerik, `${probe.dosya}: "${beklenen}" kavramı eksik (${konu})`).toContain(beklenen);
      }
    });
  }
});

describe("GLOBAL-READINESS entegrasyon disiplini", () => {
  it("docs/README.md yeni yönergeyi kataloglar", () => {
    expect(okuKucuk("README.md")).toContain("global-market-readiness");
  });

  it("i18n-standard.md (15. standart özeti) global kapsam ayrımına işaret eder", () => {
    const icerik = okuKucuk("i18n-standard.md");
    expect(icerik).toContain("dil ≠ locale");
    expect(icerik).toContain("global-market-readiness");
  });

  it("yeni yönerge devir haritası taşır — para/zaman/kimlik/arama sahipleri", () => {
    const icerik = okuKucuk("global-market-readiness-directive.md");
    for (const sahip of [
      "financial-state-model-contract.md",
      "atomic-types-directive.md",
      "actor-party-contract.md",
      "k-search-directive.md",
      "privacy-retention-decision-matrix.md",
    ])
      expect(icerik, `devir haritasında eksik: ${sahip}`).toContain(sahip);
  });

  it("güncellenen yönergeler URL policy yasak desenlerini içermez (kapı koruması)", () => {
    // check-url-policy kapısının taradığı desenlerin en riskli ikisi burada da
    // erken yakalanır; kanonik kapı ayrıca tüm docs'u tarar.
    const dosyalar = [
      "global-market-readiness-directive.md",
      "standards/01-i18n-l10n-g11n-standard.md",
      "financial-state-model-contract.md",
      "actor-party-contract.md",
    ];
    for (const d of dosyalar) {
      if (!fs.existsSync(path.join(DOCS, d))) continue;
      const icerik = oku(d);
      expect(icerik, `${d}: eski tilde grameri sızmış`).not.toMatch(
        /[a-z0-9-]+~(p|usr|emp|org|co|inv|po|wo|prd|lst|rpt)_/i,
      );
      expect(icerik, `${d}: /node/<numara> route önerisi sızmış`).not.toMatch(/\/node\/\d+/);
    }
  });
});
