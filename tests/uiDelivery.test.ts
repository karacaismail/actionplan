import { TaskNodeSchema, UiDeliverySchema } from "@/schemas";
import { describe, expect, it } from "vitest";
// Kapı + vitest aynı modülü kullanır (dimension-semantics deseni).
import {
  classifyUiImpact,
  evaluateUiDeliveryGate,
  validateUiDelivery,
} from "../tools/lib/ui-impact.mjs";

/**
 * SB-INT (docs/storybook-master-component-integration-directive.md §3/§14) —
 * Makine-okunur uiDelivery sözleşmesi + UI impact sınıflandırıcısı + conformance kapısı.
 * Test-önce: bu dosya implementasyondan ÖNCE yazıldı (kırmızı kanıtı CI/oturum kaydında).
 */

const base = { id: "x-node", level: "component", title: "x", slug: "x" } as const;

const fullMasterDelivery = {
  impact: "master-component",
  applies: true,
  reason: "Ortak MoneyInput API'si değişiyor",
  componentKind: "master",
  masterComponentRefs: ["ui/MoneyInput"],
  storyRefs: ["packages/ui/src/money-input/MoneyInput.stories.tsx"],
  requiredStoryStates: [
    "default",
    "hover",
    "focus-visible",
    "disabled",
    "loading",
    "empty",
    "error",
  ],
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
  // v2 governance uyumu (docs/storybook-governance-pack.md; SB-GOV testleriyle hizalı):
  // 7 state × 3 viewport × 3 locale × 2 theme = 126 kombinasyon default 40 bütçesini aşar —
  // taban fixture bütçeyi açıkça genişletir (U0) ve approved senaryoları için owner taşır (U24).
  coverageBudget: { maxStories: 200, justification: "SB-INT taban fixture'ı: 126 kombinasyon" },
  ownerRef: "ui/money-input-owner",
} as const;

describe("SB-INT-1 — uiDelivery şema temeli (lazy migration + tutarlılık)", () => {
  it("eski düğüm (uiDelivery yok) hâlâ parse olur — lazy migration", () => {
    const n = TaskNodeSchema.parse(base);
    expect(n.uiDelivery).toBeUndefined();
  });

  it("tam master-component sözleşmesi parse olur", () => {
    const d = UiDeliverySchema.parse(fullMasterDelivery);
    expect(d.componentKind).toBe("master");
    expect(d.requiredStoryStates.length).toBeGreaterThanOrEqual(7);
  });

  it("S14.2 — applies=false yalnız impact=none + componentKind=none + somut gerekçeyle geçer", () => {
    expect(() =>
      UiDeliverySchema.parse({
        impact: "none",
        applies: false,
        reason:
          "Yalnız append-only audit index migration'ı değişir; API shape, hata sözleşmesi, permission projection veya Surface çıktısı değişmez.",
        componentKind: "none",
      }),
    ).not.toThrow();
    // jenerik gerekçe reddedilir
    expect(() =>
      UiDeliverySchema.parse({
        impact: "none",
        applies: false,
        reason: "backend işi",
        componentKind: "none",
      }),
    ).toThrow();
    // applies=false iken impact!=none çelişkisi reddedilir
    expect(() =>
      UiDeliverySchema.parse({
        impact: "direct",
        applies: false,
        reason: "Yalnız migration değişir; hiçbir UI etkisi yok (somut).",
        componentKind: "none",
      }),
    ).toThrow();
  });

  it("S14.4 — master-component: componentKind=master + tam state matrisi zorunlu", () => {
    expect(() =>
      UiDeliverySchema.parse({ ...fullMasterDelivery, componentKind: "local" }),
    ).toThrow();
    expect(() =>
      UiDeliverySchema.parse({ ...fullMasterDelivery, requiredStoryStates: ["default"] }),
    ).toThrow();
  });

  it("S14.5 — surface: composition story + en az bir E2E ref zorunlu", () => {
    const surfaceDelivery = {
      ...fullMasterDelivery,
      impact: "surface",
      componentKind: "surface-composition",
      requiredStoryStates: ["default", "loading", "empty", "error"],
      e2eRefs: [],
    };
    expect(() => UiDeliverySchema.parse(surfaceDelivery)).toThrow();
    expect(() =>
      UiDeliverySchema.parse({ ...surfaceDelivery, e2eRefs: ["tests/e2e/customer-list.spec.ts"] }),
    ).not.toThrow();
  });

  it("S14.6 — reviewStatus=approved reviewer + Storybook evidence olmadan geçersiz", () => {
    expect(() =>
      UiDeliverySchema.parse({ ...fullMasterDelivery, reviewStatus: "approved", reviewer: null }),
    ).toThrow();
    expect(() =>
      UiDeliverySchema.parse({
        ...fullMasterDelivery,
        reviewStatus: "approved",
        reviewer: "design-system-owner",
        storybookUrl: null,
        visualEvidenceRefs: [],
      }),
    ).toThrow();
    expect(() =>
      UiDeliverySchema.parse({
        ...fullMasterDelivery,
        reviewStatus: "approved",
        reviewer: "design-system-owner",
        storybookUrl: "https://storybook.example.com/pr-42",
      }),
    ).not.toThrow();
  });

  it("S14.7 — story ref'i story dosyası biçiminde olmalı (paralel implementation/serbest dosya reddi)", () => {
    expect(() =>
      UiDeliverySchema.parse({
        ...fullMasterDelivery,
        storyRefs: ["packages/ui/src/money-input/MoneyInput.tsx"],
      }),
    ).toThrow();
  });

  it("S14.8 — deprecated master component replacement + migration story olmadan reddedilir", () => {
    expect(() =>
      UiDeliverySchema.parse({
        ...fullMasterDelivery,
        deprecation: { deprecated: true, replacementRef: "", migrationStoryRef: "" },
      }),
    ).toThrow();
    expect(() =>
      UiDeliverySchema.parse({
        ...fullMasterDelivery,
        deprecation: {
          deprecated: true,
          replacementRef: "ui/CurrencyInput",
          migrationStoryRef: "packages/ui/src/currency-input/Migration.stories.tsx",
        },
      }),
    ).not.toThrow();
  });

  it("impact!=none iken story veya master-component bağı zorunlu", () => {
    expect(() =>
      UiDeliverySchema.parse({
        ...fullMasterDelivery,
        impact: "indirect",
        componentKind: "local",
        requiredStoryStates: [],
        masterComponentRefs: [],
        storyRefs: [],
      }),
    ).toThrow();
  });
});

describe("SB-INT-2 — UI impact sınıflandırıcısı (içerik sinyalleri, §2.2/§2.3)", () => {
  it("S14.2 — backend-only içerik none döner", () => {
    const r = classifyUiImpact({
      ...base,
      title: "Audit index migration",
      summary: "Append-only audit tablosuna bileşik indeks ekler; API shape değişmez.",
      tags: ["backend", "migration"],
    });
    expect(r.impact).toBe("none");
  });

  it("S14.3 — 'backend' etiketli ama hata sözleşmesi/form eşlemesi değiştiren iş indirect olur", () => {
    const r = classifyUiImpact({
      ...base,
      title: "Backend validator",
      summary:
        "Hata kodu sözleşmesi değişiyor; form field mapping ve error message eşlemesi güncellenecek.",
      tags: ["backend"],
    });
    expect(r.impact).toBe("indirect");
    expect(r.signals.length).toBeGreaterThan(0);
  });

  it("görünür UI işi direct; surface kompozisyonu surface; ortak bileşen master-component", () => {
    expect(
      classifyUiImpact({
        ...base,
        summary: "Listeleme ekranında tablo kolonu ve boş-durum bloğu eklenir",
      }).impact,
    ).toBe("direct");
    expect(
      classifyUiImpact({
        ...base,
        summary: "Dashboard surface kompozisyonu yeniden düzenlenir",
        tags: ["surface"],
      }).impact,
    ).toBe("surface");
    expect(
      classifyUiImpact({
        ...base,
        summary: "Ortak MoneyInput master component API'sine yeni prop eklenir",
        tags: ["component-library"],
      }).impact,
    ).toBe("master-component");
  });

  it("standardRefs.uiComponentRef / dimensions.wcag dolu düğüm UI sinyali üretir", () => {
    const r = classifyUiImpact({
      ...base,
      summary: "",
      standardRefs: { uiComponentRef: "ui-components" },
    });
    expect(r.impact).not.toBe("none");
  });
});

describe("SB-INT-3 — validateUiDelivery (kapı-düzeyi kural aynası)", () => {
  it("aday düğümde uiDelivery yoksa ihlal üretir (S14.1)", () => {
    const violations = validateUiDelivery({
      ...base,
      summary: "Yeni form ekranı ve tablo görünümü",
    });
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]).toMatch(/uiDelivery/);
  });

  it("backend-only düğüm uiDelivery'siz temiz geçer (S14.2)", () => {
    const violations = validateUiDelivery({
      ...base,
      summary: "Append-only audit index migration; API shape değişmez.",
      tags: ["backend"],
    });
    expect(violations).toEqual([]);
  });
});

describe("SB-INT-4 — conformance kapısı sonuç sınıfları (§12/§13)", () => {
  const uiNode = (id: string, extra: Record<string, unknown> = {}) => ({
    ...base,
    id,
    summary: "Yeni form ekranı ve tablo görünümü",
    ...extra,
  });

  it("S14.9 — sıfır UI adayı NO_CANDIDATES verir (PASS değil)", () => {
    const r = evaluateUiDeliveryGate(
      [
        {
          ...base,
          id: "b1",
          summary: "Append-only audit index migration; API değişmez.",
          tags: ["backend"],
        },
      ],
      { allowedWarnings: [] },
    );
    expect(r.result).toBe("NO_CANDIDATES");
  });

  it("S14.1 — UI adayı uiDelivery'siz ve baseline dışıysa FAIL", () => {
    const r = evaluateUiDeliveryGate([uiNode("u1")], { allowedWarnings: [] });
    expect(r.result).toBe("FAIL");
  });

  it("S14.10 — baseline'daki legacy ihlal warning kalır (MIGRATION_INCOMPLETE), baseline dışı yeni ihlal FAIL", () => {
    const legacyOnly = evaluateUiDeliveryGate([uiNode("legacy-1")], {
      allowedWarnings: ["legacy-1"],
    });
    // kök-entegrasyon raporu (SB-ROOT-3): susturulmuş baseline PASS veremez — legacy warning
    // ihlali aklamaz, yalnız erteler; v3 kapıda warning>0 corpus'u MIGRATION_INCOMPLETE'tir.
    expect(legacyOnly.result).toBe("MIGRATION_INCOMPLETE");
    expect(legacyOnly.warnings.length).toBe(1);

    const withNew = evaluateUiDeliveryGate([uiNode("legacy-1"), uiNode("new-1")], {
      allowedWarnings: ["legacy-1"],
    });
    expect(withNew.result).toBe("FAIL");
  });

  it("uiDelivery'si tam ve in-review adayda kapı REVIEW_REQUIRED döner", () => {
    const r = evaluateUiDeliveryGate(
      [uiNode("u2", { uiDelivery: { ...fullMasterDelivery, reviewStatus: "in-review" } })],
      { allowedWarnings: [] },
    );
    expect(r.result).toBe("REVIEW_REQUIRED");
  });

  it("uiDelivery'si tam + approved adayda kapı PASS döner", () => {
    const r = evaluateUiDeliveryGate(
      [
        uiNode("u3", {
          uiDelivery: {
            ...fullMasterDelivery,
            reviewStatus: "approved",
            reviewer: "design-system-owner",
            storybookUrl: "https://storybook.example.com/main",
          },
        }),
      ],
      { allowedWarnings: [] },
    );
    expect(r.result).toBe("PASS");
  });
});
