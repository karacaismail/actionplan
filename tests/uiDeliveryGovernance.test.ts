import { TaskNodeSchema, UiDeliverySchema } from "@/schemas";
import { describe, expect, it } from "vitest";
// Kapı + vitest aynı modülü kullanır (dimension-semantics deseni).
import { evaluateUiDeliveryGate, validateUiDelivery } from "../tools/lib/ui-impact.mjs";

/**
 * SB-GOV (docs/storybook-unknown-unknowns-gap-report.md §10) —
 * uiDelivery v2 governance genişletmesi: risk sınıfı, kapsam bütçesi, fixture
 * sözleşmesi, güvenlik bağı, baseline governance, manuel a11y, performans
 * profili, break-glass ve owner kayıtları.
 *
 * Test-önce: bu dosya v2 implementasyonundan ÖNCE yazıldı; src/schemas/ui-delivery.ts
 * ve tools/lib/ui-impact.mjs henüz v2 alanlarını içermediği için KIRMIZI koşması
 * bilinçli ve istenen davranıştır (kırmızı kanıtı ana oturum/CI kaydında).
 *
 * Kural <-> rapor eşlemesi:
 *   U0 bütçe · U1 fingerprint · U2 baseline governance · U3 güvenlik bağı ·
 *   U4/U27 PII/gerçek veri · U11 manuel a11y · U12 performans profili ·
 *   U22 break-glass · U24 owner · geriye uyum + gate sinyalleri (§11).
 */

const base = { id: "gov-dugum", level: "component", title: "gov", slug: "gov" } as const;

const CEKIRDEK_STATES = [
  "default",
  "hover",
  "focus-visible",
  "disabled",
  "loading",
  "empty",
  "error",
] as const;

const izinStoryleri = ["packages/ui/src/role-gate/RoleGate.stories.tsx"] as const;

/**
 * Kırmızı-faz tip köprüsü: v2 alanları ve gate `signals` alanı implementasyondan
 * önce v1 tip bildirimlerinde (UiDelivery çıkarımı, ui-impact.d.mts) yoktur.
 * Typecheck kapısını (qa:ci) kırmadan kırmızılığı RUNTIME assert'lerinde tutmak
 * için parse/gate sonuçları bu testin v2 sözleşme beklentisine daraltılarak okunur.
 * v2 implementasyonu tipleri sağlayınca köprü kaldırılabilir.
 */
type RiskSinifi = "critical" | "high" | "medium" | "low";
type V2SozlesmeGorunumu = {
  riskClass: RiskSinifi;
  dataDense: boolean;
  ownerRef: string;
  coverageBudget: { maxStories: number; justification: string };
  fixtureContract: { fingerprintRef: string; sanitized: boolean; containsRealData: boolean };
  securityLinkage: { permissionStoryRefs: string[]; backendAuthzTestRefs: string[] };
  baselineGovernance: {
    approvedBy: string;
    reason: string;
    taskRef: string;
    diffTaxonomy?: string;
  };
  manualA11yReviewRef: string;
  performanceProfileRef: string;
  breakGlass: { used: boolean; auditRef: string; remediationTaskRef: string };
};
const v2Gorunum = (sozlesme: unknown): V2SozlesmeGorunumu => sozlesme as V2SozlesmeGorunumu;
const gateSinyalleri = (kapiSonucu: unknown): string[] =>
  (kapiSonucu as { signals: string[] }).signals;

/**
 * v2 geçerli taban: 7 state x 3 viewport x 3 locale x 2 theme = 126 kombinasyon,
 * bütçe 200 (taban bütçeye takılmaz). Kritik-dereceli gereksinimler (fingerprint,
 * manuel a11y, a11yTestRefs) baştan dolu — böylece riskClass yükseltmek tek başına
 * temiz kalır ve her ihlal testi tek kuralı izole eder.
 */
const govTaban = {
  impact: "master-component",
  applies: true,
  reason: "Ortak MoneyInput API'si değişiyor",
  componentKind: "master",
  masterComponentRefs: ["ui/MoneyInput"],
  storyRefs: ["packages/ui/src/money-input/MoneyInput.stories.tsx"],
  requiredStoryStates: [...CEKIRDEK_STATES],
  requiredViewports: ["sm", "md", "lg"],
  requiredLocales: ["tr", "en", "pseudo"],
  requiredThemes: ["light", "dark"],
  interactionTestRefs: ["MoneyInput.interaction"],
  a11yTestRefs: ["MoneyInput.a11y"],
  visualEvidenceRefs: [],
  e2eRefs: [],
  storybookUrl: null,
  reviewStatus: "planned",
  reviewer: null,
  // --- v2 governance alanları ---
  riskClass: "medium",
  dataDense: false,
  ownerRef: "team-payments",
  coverageBudget: {
    maxStories: 200,
    justification: "Master tam matrisi 126 kombinasyon üretir; bütçe bilinçli genişletildi",
  },
  fixtureContract: {
    fingerprintRef: "fixtures/money-input.fingerprint.json",
    sanitized: true,
    containsRealData: false,
  },
  securityLinkage: { permissionStoryRefs: [], backendAuthzTestRefs: [] },
  baselineGovernance: { approvedBy: "", reason: "", taskRef: "" },
  manualA11yReviewRef: "docs/reviews/money-input-manuel-a11y.md",
  performanceProfileRef: "",
  breakGlass: { used: false, auditRef: "", remediationTaskRef: "" },
} as const;

/** Approved + görsel evidence + dolu baseline governance üçlüsü (temiz yön). */
const onayliTaban = {
  ...govTaban,
  reviewStatus: "approved",
  reviewer: "design-reviewer-asli",
  visualEvidenceRefs: ["chromatic/build-42/money-input-baseline"],
  baselineGovernance: {
    approvedBy: "design-system-owner",
    reason: "Token güncellemesi bilinçli görsel fark üretiyor",
    taskRef: "AP-1234",
    diffTaxonomy: "intentional-design",
  },
} as const;

/**
 * v1-biçimli sözleşme (yeni alanların HİÇBİRİ verilmemiş): geriye uyum + default testi.
 * 2 state x 1 x 1 x 1 = 2 kombinasyon — default bütçe (40) içinde kalır; master tam
 * matrisin default bütçeyi aşması ayrıca U0 BÜTÇE testinde ihlal olarak sabitlenir.
 */
const v1BicimliSozlesme = {
  impact: "direct",
  applies: true,
  reason: "Müşteri listesine boş-durum bloğu eklenir",
  componentKind: "local",
  storyRefs: ["apps/web/src/customer-list/CustomerList.stories.tsx"],
  requiredStoryStates: ["default", "empty"],
} as const;

const uiDugum = (id: string, uiDelivery: unknown) => ({
  ...base,
  id,
  summary: "Yeni form ekranı ve tablo görünümü",
  uiDelivery,
});

describe("SB-GOV-1 şema", () => {
  it("v2 alanları parse sonrası korunur; riskClass yalnız tanımlı sınıfları kabul eder", () => {
    const d = v2Gorunum(UiDeliverySchema.parse(govTaban));
    expect(d.riskClass).toBe("medium");
    expect(d.dataDense).toBe(false);
    expect(d.ownerRef).toBe("team-payments");
    expect(d.coverageBudget.maxStories).toBe(200);
    expect(d.fixtureContract.fingerprintRef).toBe("fixtures/money-input.fingerprint.json");
    expect(d.breakGlass.used).toBe(false);
    expect(() => UiDeliverySchema.parse({ ...govTaban, riskClass: "extreme" })).toThrow();
  });

  it("GERİYE UYUM — v1-biçimli sözleşme parse olur; yeni alanlar default alır", () => {
    const d = v2Gorunum(UiDeliverySchema.parse(v1BicimliSozlesme));
    expect(d.riskClass).toBe("medium");
    expect(d.dataDense).toBe(false);
    expect(d.ownerRef).toBe("");
    expect(d.coverageBudget).toEqual({ maxStories: 40, justification: "" });
    expect(d.fixtureContract).toEqual({
      fingerprintRef: "",
      sanitized: false,
      containsRealData: false,
    });
    expect(d.securityLinkage).toEqual({ permissionStoryRefs: [], backendAuthzTestRefs: [] });
    expect(d.baselineGovernance).toEqual({ approvedBy: "", reason: "", taskRef: "" });
    expect(d.manualA11yReviewRef).toBe("");
    expect(d.performanceProfileRef).toBe("");
    expect(d.breakGlass).toEqual({ used: false, auditRef: "", remediationTaskRef: "" });
  });

  it("GERİYE UYUM — eski kurallar v2'de de çalışır; TaskNode v2 sözleşmesini taşır", () => {
    // v1 kuralı: story ref'i story dosyası olmalı (S14.7)
    expect(() =>
      UiDeliverySchema.parse({
        ...v1BicimliSozlesme,
        storyRefs: ["apps/web/src/customer-list/CustomerList.tsx"],
      }),
    ).toThrow();
    // v1 kuralı: master tam state matrisi (S14.4)
    expect(() =>
      UiDeliverySchema.parse({ ...govTaban, requiredStoryStates: ["default"] }),
    ).toThrow();
    // lazy migration: uiDelivery'siz düğüm hâlâ parse olur
    expect(TaskNodeSchema.parse(base).uiDelivery).toBeUndefined();
    // TaskNode üzerindeki sözleşme v2 alanlarını korur
    const n = TaskNodeSchema.parse({ ...base, uiDelivery: govTaban });
    expect(n.uiDelivery).toBeDefined();
    const nd = v2Gorunum(n.uiDelivery);
    expect(nd.riskClass).toBe("medium");
    expect(nd.ownerRef).toBe("team-payments");
  });

  it("U0 BÜTÇE — kombinasyon (7x3x3x2=126) bütçeyi aşarsa düşer; 200'e çıkınca geçer", () => {
    expect(() =>
      UiDeliverySchema.parse({
        ...govTaban,
        coverageBudget: { maxStories: 40, justification: "" },
      }),
    ).toThrow();
    expect(() => UiDeliverySchema.parse(govTaban)).not.toThrow();
  });

  it("U0 BÜTÇE — boş eksenler max(1,.) sayılır; sınırda geçer, sınırı aşınca düşer", () => {
    const tekEksen = {
      ...govTaban,
      requiredViewports: [],
      requiredLocales: [],
      requiredThemes: [],
    };
    // 7 state x 1 x 1 x 1 = 7 = bütçe sınırı → temiz
    expect(() =>
      UiDeliverySchema.parse({
        ...tekEksen,
        coverageBudget: { maxStories: 7, justification: "çekirdek yedi state tek eksende" },
      }),
    ).not.toThrow();
    // 7 > 6 → ihlal
    expect(() =>
      UiDeliverySchema.parse({
        ...tekEksen,
        coverageBudget: { maxStories: 6, justification: "" },
      }),
    ).toThrow();
  });

  it("U2 BASELINE GOVERNANCE — approved + görsel evidence üçlü kayıt ister", () => {
    expect(() => UiDeliverySchema.parse(onayliTaban)).not.toThrow();
    for (const eksik of ["approvedBy", "reason", "taskRef"] as const) {
      expect(() =>
        UiDeliverySchema.parse({
          ...onayliTaban,
          baselineGovernance: { ...onayliTaban.baselineGovernance, [eksik]: "" },
        }),
      ).toThrow();
    }
  });

  it("U2 BASELINE GOVERNANCE — approvedBy reviewer'dan ayrı olmalı", () => {
    // owner/design-reviewer ayrılığı: baseline'ı onaylayan, review'u yapanla aynı olamaz
    expect(() =>
      UiDeliverySchema.parse({
        ...onayliTaban,
        baselineGovernance: {
          ...onayliTaban.baselineGovernance,
          approvedBy: onayliTaban.reviewer,
        },
      }),
    ).toThrow();
  });

  it("U2 BASELINE GOVERNANCE — görsel evidence'sız approved'da üçlü zorunlu değil", () => {
    expect(() =>
      UiDeliverySchema.parse({
        ...govTaban,
        reviewStatus: "approved",
        reviewer: "design-reviewer-asli",
        storybookUrl: "https://storybook.example.com/pr-42",
        visualEvidenceRefs: [],
      }),
    ).not.toThrow();
  });

  it("U2 diffTaxonomy — yalnız tanımlı fark sınıflandırmaları kabul edilir", () => {
    expect(() =>
      UiDeliverySchema.parse({
        ...onayliTaban,
        baselineGovernance: { ...onayliTaban.baselineGovernance, diffTaxonomy: "token-wide" },
      }),
    ).not.toThrow();
    expect(() =>
      UiDeliverySchema.parse({
        ...onayliTaban,
        baselineGovernance: { ...onayliTaban.baselineGovernance, diffTaxonomy: "kozmetik" },
      }),
    ).toThrow();
  });

  it("U4/U27 PII — containsRealData=true HER risk sınıfında reddedilir", () => {
    for (const risk of ["critical", "high", "medium", "low"] as const) {
      expect(() =>
        UiDeliverySchema.parse({
          ...govTaban,
          riskClass: risk,
          fixtureContract: { ...govTaban.fixtureContract, containsRealData: true },
        }),
      ).toThrow();
    }
    expect(() => UiDeliverySchema.parse({ ...govTaban, riskClass: "low" })).not.toThrow();
  });

  it("U1 FIXTURE FINGERPRINT — critical/high fingerprintRef ister; medium'da serbest", () => {
    for (const risk of ["critical", "high"] as const) {
      expect(() =>
        UiDeliverySchema.parse({
          ...govTaban,
          riskClass: risk,
          fixtureContract: { ...govTaban.fixtureContract, fingerprintRef: "" },
        }),
      ).toThrow();
    }
    expect(() => UiDeliverySchema.parse({ ...govTaban, riskClass: "critical" })).not.toThrow();
    expect(() =>
      UiDeliverySchema.parse({
        ...govTaban,
        fixtureContract: { ...govTaban.fixtureContract, fingerprintRef: "" },
      }),
    ).not.toThrow();
  });

  it("U3 GÜVENLİK BAĞI — critical/high permission story backend authz referansı ister", () => {
    for (const risk of ["critical", "high"] as const) {
      expect(() =>
        UiDeliverySchema.parse({
          ...govTaban,
          riskClass: risk,
          securityLinkage: { permissionStoryRefs: [...izinStoryleri], backendAuthzTestRefs: [] },
        }),
      ).toThrow();
    }
    // backend authz referansı verilince temiz
    expect(() =>
      UiDeliverySchema.parse({
        ...govTaban,
        riskClass: "critical",
        securityLinkage: {
          permissionStoryRefs: [...izinStoryleri],
          backendAuthzTestRefs: ["apps/api/tests/authz/role-gate.authz.test.ts"],
        },
      }),
    ).not.toThrow();
    // kural critical/high kapsamındadır: medium'da backend referanssız permission story temiz
    expect(() =>
      UiDeliverySchema.parse({
        ...govTaban,
        securityLinkage: { permissionStoryRefs: [...izinStoryleri], backendAuthzTestRefs: [] },
      }),
    ).not.toThrow();
    // permission story yoksa critical'da da tetiklenmez
    expect(() => UiDeliverySchema.parse({ ...govTaban, riskClass: "critical" })).not.toThrow();
  });

  it("U11 MANUEL A11Y — critical/high manuel review ister; critical a11yTestRefs ister", () => {
    for (const risk of ["critical", "high"] as const) {
      expect(() =>
        UiDeliverySchema.parse({ ...govTaban, riskClass: risk, manualA11yReviewRef: "" }),
      ).toThrow();
    }
    expect(() =>
      UiDeliverySchema.parse({ ...govTaban, riskClass: "critical", a11yTestRefs: [] }),
    ).toThrow();
    // a11yTestRefs zorunluluğu yalnız critical'dadır
    expect(() =>
      UiDeliverySchema.parse({ ...govTaban, riskClass: "high", a11yTestRefs: [] }),
    ).not.toThrow();
    // medium'da manuel review ref'i zorunlu değildir
    expect(() => UiDeliverySchema.parse({ ...govTaban, manualA11yReviewRef: "" })).not.toThrow();
  });

  it("U22 BREAK-GLASS — used=true audit + remediation kaydı olmadan reddedilir", () => {
    expect(() =>
      UiDeliverySchema.parse({
        ...govTaban,
        breakGlass: { used: true, auditRef: "", remediationTaskRef: "AP-2001" },
      }),
    ).toThrow();
    expect(() =>
      UiDeliverySchema.parse({
        ...govTaban,
        breakGlass: { used: true, auditRef: "audits/2026-07-11-hotfix.md", remediationTaskRef: "" },
      }),
    ).toThrow();
    expect(() =>
      UiDeliverySchema.parse({
        ...govTaban,
        breakGlass: {
          used: true,
          auditRef: "audits/2026-07-11-hotfix.md",
          remediationTaskRef: "AP-2001",
        },
      }),
    ).not.toThrow();
  });

  it("U24 OWNER — approved sözleşme ownerRef'siz geçersizdir; planned'da serbesttir", () => {
    expect(() => UiDeliverySchema.parse({ ...onayliTaban, ownerRef: "" })).toThrow();
    expect(() => UiDeliverySchema.parse({ ...govTaban, ownerRef: "" })).not.toThrow();
  });

  it("U12 PERFORMANS PROFİLİ — dataDense + critical/high profil referansı ister", () => {
    for (const risk of ["critical", "high"] as const) {
      expect(() =>
        UiDeliverySchema.parse({
          ...govTaban,
          riskClass: risk,
          dataDense: true,
          performanceProfileRef: "",
        }),
      ).toThrow();
    }
    expect(() =>
      UiDeliverySchema.parse({
        ...govTaban,
        riskClass: "critical",
        dataDense: true,
        performanceProfileRef: "profiles/money-table.perf.json",
      }),
    ).not.toThrow();
    // medium + dataDense profil zorunluluğu doğurmaz; critical + dataDense=false da doğurmaz
    expect(() => UiDeliverySchema.parse({ ...govTaban, dataDense: true })).not.toThrow();
    expect(() => UiDeliverySchema.parse({ ...govTaban, riskClass: "critical" })).not.toThrow();
  });
});

describe("SB-GOV-2 validate", () => {
  it("U0 — bütçe aşımı ihlal üretir; genişletilmiş bütçeyle temiz geçer", () => {
    const ihlaller = validateUiDelivery(
      uiDugum("u-dar", { ...govTaban, coverageBudget: { maxStories: 40, justification: "" } }),
    );
    expect(ihlaller.length).toBeGreaterThan(0);
    expect(ihlaller.join("\n")).toMatch(/coverageBudget|maxStories|bütçe/i);
    expect(validateUiDelivery(uiDugum("u-genis", govTaban))).toEqual([]);
  });

  it("U4/U27 — containsRealData her risk sınıfında ihlal üretir", () => {
    for (const risk of ["critical", "high", "medium", "low"] as const) {
      const ihlaller = validateUiDelivery(
        uiDugum(`u-veri-${risk}`, {
          ...govTaban,
          riskClass: risk,
          fixtureContract: { ...govTaban.fixtureContract, containsRealData: true },
        }),
      );
      expect(ihlaller.join("\n")).toMatch(/containsRealData|gerçek veri/i);
    }
  });

  it("U1/U3/U11 — critical'da üç eksik ayrı ayrı ihlal olarak raporlanır", () => {
    const ihlaller = validateUiDelivery(
      uiDugum("u-kritik", {
        ...govTaban,
        riskClass: "critical",
        fixtureContract: { ...govTaban.fixtureContract, fingerprintRef: "" },
        manualA11yReviewRef: "",
        securityLinkage: { permissionStoryRefs: [...izinStoryleri], backendAuthzTestRefs: [] },
      }),
    );
    const metin = ihlaller.join("\n");
    expect(metin).toMatch(/fingerprintRef/);
    expect(metin).toMatch(/manualA11yReviewRef|manuel a11y/i);
    expect(metin).toMatch(/backendAuthzTestRefs|securityLinkage/);
    expect(ihlaller.length).toBeGreaterThanOrEqual(3);
  });

  it("U2/U24 — approved düğümde owner ve baseline governance ihlalleri", () => {
    const sahipsiz = validateUiDelivery(uiDugum("u-s1", { ...onayliTaban, ownerRef: "" }));
    expect(sahipsiz.join("\n")).toMatch(/ownerRef/);

    const kayitsiz = validateUiDelivery(
      uiDugum("u-k1", {
        ...onayliTaban,
        baselineGovernance: { approvedBy: "", reason: "", taskRef: "" },
      }),
    );
    expect(kayitsiz.join("\n")).toMatch(/baselineGovernance|approvedBy/);

    const ayriliksiz = validateUiDelivery(
      uiDugum("u-a1", {
        ...onayliTaban,
        baselineGovernance: {
          ...onayliTaban.baselineGovernance,
          approvedBy: onayliTaban.reviewer,
        },
      }),
    );
    expect(ayriliksiz.join("\n")).toMatch(/approvedBy|reviewer/);
  });

  it("U22/U12 — break-glass kayıtsız kullanım ve dataDense profil eksiği ihlal üretir", () => {
    const camKirigi = validateUiDelivery(
      uiDugum("u-cam", {
        ...govTaban,
        breakGlass: { used: true, auditRef: "", remediationTaskRef: "" },
      }),
    );
    expect(camKirigi.join("\n")).toMatch(/breakGlass|auditRef/);

    const yogunVeri = validateUiDelivery(
      uiDugum("u-yogun", {
        ...govTaban,
        riskClass: "high",
        dataDense: true,
        performanceProfileRef: "",
      }),
    );
    expect(yogunVeri.join("\n")).toMatch(/performanceProfileRef|performans/i);
  });

  it("GERİYE UYUM — temiz v2 ve v1-biçimli sözleşmeler validate'ten temiz geçer", () => {
    expect(
      validateUiDelivery(
        uiDugum("u-temiz-kritik", {
          ...govTaban,
          riskClass: "critical",
          securityLinkage: {
            permissionStoryRefs: [...izinStoryleri],
            backendAuthzTestRefs: ["apps/api/tests/authz/role-gate.authz.test.ts"],
          },
        }),
      ),
    ).toEqual([]);
    expect(validateUiDelivery(uiDugum("u-temiz-v1", v1BicimliSozlesme))).toEqual([]);
    // eski kural aynası: story dosyası biçimi v2'de de zorunlu
    expect(
      validateUiDelivery(
        uiDugum("u-eski-bicim", {
          ...v1BicimliSozlesme,
          storyRefs: ["apps/web/src/customer-list/CustomerList.tsx"],
        }),
      ).join("\n"),
    ).toMatch(/story dosyası/);
  });
});

describe("SB-GOV-3 gate sinyalleri", () => {
  it("kapı dönüşünde signals dizisi bulunur; temiz düğümde governance sinyali yoktur", () => {
    const r = evaluateUiDeliveryGate([uiDugum("g-temiz", govTaban)], { allowedWarnings: [] });
    const sinyaller = gateSinyalleri(r);
    expect(Array.isArray(sinyaller)).toBe(true);
    for (const sinyal of [
      "BUDGET_EXCEEDED",
      "OWNER_MISSING",
      "MANUAL_A11Y_REQUIRED",
      "SECURITY_REVIEW_REQUIRED",
    ]) {
      expect(sinyaller).not.toContain(sinyal);
    }
    expect(r.result).toBe("PASS");
  });

  it("U0 — bütçe aşan critical düğüm BUDGET_EXCEEDED sinyali üretir ve kapı FAIL olur", () => {
    const r = evaluateUiDeliveryGate(
      [
        uiDugum("g-dar", {
          ...govTaban,
          riskClass: "critical",
          coverageBudget: { maxStories: 40, justification: "" },
        }),
      ],
      { allowedWarnings: [] },
    );
    expect(gateSinyalleri(r)).toContain("BUDGET_EXCEEDED");
    expect(r.result).toBe("FAIL");
  });

  it("U24 — approved + ownersız düğüm OWNER_MISSING sinyali üretir", () => {
    const r = evaluateUiDeliveryGate(
      [
        uiDugum("g-s1", {
          ...govTaban,
          reviewStatus: "approved",
          reviewer: "design-reviewer-asli",
          storybookUrl: "https://storybook.example.com/pr-7",
          ownerRef: "",
        }),
      ],
      { allowedWarnings: [] },
    );
    expect(gateSinyalleri(r)).toContain("OWNER_MISSING");
    expect(r.result).toBe("FAIL");
  });

  it("U11 — critical + manuel-a11y'siz düğüm MANUAL_A11Y_REQUIRED sinyali üretir", () => {
    const r = evaluateUiDeliveryGate(
      [uiDugum("g-el", { ...govTaban, riskClass: "critical", manualA11yReviewRef: "" })],
      { allowedWarnings: [] },
    );
    expect(gateSinyalleri(r)).toContain("MANUAL_A11Y_REQUIRED");
    expect(r.result).toBe("FAIL");
  });

  it("U3 — permission-story'lü backend-ref'siz critical SECURITY_REVIEW_REQUIRED üretir", () => {
    const r = evaluateUiDeliveryGate(
      [
        uiDugum("g-izin", {
          ...govTaban,
          riskClass: "critical",
          securityLinkage: { permissionStoryRefs: [...izinStoryleri], backendAuthzTestRefs: [] },
        }),
      ],
      { allowedWarnings: [] },
    );
    expect(gateSinyalleri(r)).toContain("SECURITY_REVIEW_REQUIRED");
    expect(r.result).toBe("FAIL");
  });
});
