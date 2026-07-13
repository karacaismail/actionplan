import { z } from "zod";

/**
 * uiDelivery — makine-okunur UI teslimat sözleşmesi.
 * Kaynak yönerge: docs/storybook-master-component-integration-directive.md §3.
 * v2 governance genişletmesi: docs/storybook-governance-pack.md (U0-U27; risk sınıfı,
 * kapsam bütçesi, fixture sözleşmesi, güvenlik bağı, baseline governance, manuel a11y,
 * performans profili, break-glass ve owner kaydı). Tüm v2 alanları default'ludur;
 * v1-biçimli sözleşmeler alan vermeden parse olur (geriye uyum).
 * Davranış kurallarının kapı-tarafı aynası: tools/lib/ui-impact.mjs (birebir ayna;
 * fark bulunursa bu şema kazanır ve ayna düzeltilir — dimension-semantics deseni).
 * TaskNode üzerinde OPSİYONELDİR (lazy migration); UI-impact adayı yürütmeye
 * açıldığında check-ui-delivery kapısı tam sözleşmeyi zorlar.
 */

export const UiImpactSchema = z.enum(["none", "indirect", "direct", "master-component", "surface"]);
export type UiImpact = z.infer<typeof UiImpactSchema>;

export const UiComponentKindSchema = z.enum([
  "master",
  "pattern",
  "surface-composition",
  "local",
  "none",
]);
export type UiComponentKind = z.infer<typeof UiComponentKindSchema>;

export const UiReviewStatusSchema = z.enum([
  "not-required",
  "planned",
  "in-review",
  "approved",
  "rejected",
]);
export type UiReviewStatus = z.infer<typeof UiReviewStatusSchema>;

/** Master Component yaşam döngüsü (§6): deprecated → replacement + migration story zorunlu. */
export const UiDeprecationSchema = z.object({
  deprecated: z.boolean().default(false),
  replacementRef: z.string().default(""),
  migrationStoryRef: z.string().default(""),
});
export type UiDeprecation = z.infer<typeof UiDeprecationSchema>;

/** UI risk sınıfı — v2 governance kurallarının (U1/U3/U11/U12) eşik anahtarı. */
export const UiRiskClassSchema = z.enum(["critical", "high", "medium", "low"]);
export type UiRiskClass = z.infer<typeof UiRiskClassSchema>;

/** U2: onaylanan baseline farkının sınıflandırması — yalnız tanımlı sınıflar kabul edilir. */
export const UiDiffTaxonomySchema = z.enum([
  "bugfix",
  "intentional-design",
  "token-wide",
  "environment-noise",
  "content-only",
]);
export type UiDiffTaxonomy = z.infer<typeof UiDiffTaxonomySchema>;

/** U0: kapsam bütçesi — kombinasyon patlamasına üst sınır; genişletme gerekçe ister. */
export const UiCoverageBudgetSchema = z.object({
  maxStories: z.number().int().positive().default(40),
  justification: z.string().default(""),
});
export type UiCoverageBudget = z.infer<typeof UiCoverageBudgetSchema>;

/** U1/U4/U27: fixture sözleşmesi — parmak izi, sanitizasyon ve gerçek-veri beyanı. */
export const UiFixtureContractSchema = z.object({
  fingerprintRef: z.string().default(""),
  sanitized: z.boolean().default(false),
  containsRealData: z.boolean().default(false),
});
export type UiFixtureContract = z.infer<typeof UiFixtureContractSchema>;

/** U3: permission story'lerini backend authz testlerine bağlar (UI-yalnız yetki kanıtı reddi). */
export const UiSecurityLinkageSchema = z.object({
  permissionStoryRefs: z.array(z.string()).default([]),
  backendAuthzTestRefs: z.array(z.string()).default([]),
});
export type UiSecurityLinkage = z.infer<typeof UiSecurityLinkageSchema>;

/** U2: baseline güncelleme kaydı — kim onayladı, neden, hangi iş; fark sınıfı opsiyonel. */
export const UiBaselineGovernanceSchema = z.object({
  approvedBy: z.string().default(""),
  reason: z.string().default(""),
  taskRef: z.string().default(""),
  diffTaxonomy: UiDiffTaxonomySchema.optional(),
});
export type UiBaselineGovernance = z.infer<typeof UiBaselineGovernanceSchema>;

/** U22: break-glass kaydı — kapı atlama ancak denetim + telafi göreviyle geçerlidir. */
export const UiBreakGlassSchema = z.object({
  used: z.boolean().default(false),
  auditRef: z.string().default(""),
  remediationTaskRef: z.string().default(""),
});
export type UiBreakGlass = z.infer<typeof UiBreakGlassSchema>;

/** Master Component'in zorunlu çekirdek state kümesi (ui-components.json uic-required-states). */
export const MASTER_STORY_STATES = [
  "default",
  "hover",
  "focus-visible",
  "disabled",
  "loading",
  "empty",
  "error",
] as const;

/** Jenerik/içeriksiz N/A gerekçesi reddi (check-dimension-applicability ile aynı disiplin). */
export const GENERIC_UI_REASON =
  /^(n\/?a|yok|gerek(siz| yok)|uygulanmaz|backend( işi)?|frontend değil|geçersiz|-+)\.?$/i;

export const UiDeliverySchema = z
  .object({
    impact: UiImpactSchema,
    applies: z.boolean(),
    reason: z.string().default(""),
    componentKind: UiComponentKindSchema,
    masterComponentRefs: z.array(z.string()).default([]),
    storyRefs: z.array(z.string()).default([]),
    requiredStoryStates: z.array(z.string()).default([]),
    requiredViewports: z.array(z.string()).default([]),
    requiredLocales: z.array(z.string()).default([]),
    requiredThemes: z.array(z.string()).default([]),
    interactionTestRefs: z.array(z.string()).default([]),
    a11yTestRefs: z.array(z.string()).default([]),
    visualEvidenceRefs: z.array(z.string()).default([]),
    e2eRefs: z.array(z.string()).default([]),
    /** Gerçek URL/CI evidence yoksa uydurulmaz; null kalır. */
    storybookUrl: z.string().nullable().default(null),
    reviewStatus: UiReviewStatusSchema.default("planned"),
    reviewer: z.string().nullable().default(null),
    deprecation: UiDeprecationSchema.optional(),
    // --- v2 governance alanları (docs/storybook-governance-pack.md) ---
    // Hepsi default'lu: v1-biçimli sözleşmeler bu alanları vermeden parse olur.
    riskClass: UiRiskClassSchema.default("medium"),
    dataDense: z.boolean().default(false),
    ownerRef: z.string().default(""),
    coverageBudget: UiCoverageBudgetSchema.default({}),
    fixtureContract: UiFixtureContractSchema.default({}),
    securityLinkage: UiSecurityLinkageSchema.default({}),
    baselineGovernance: UiBaselineGovernanceSchema.default({}),
    manualA11yReviewRef: z.string().default(""),
    performanceProfileRef: z.string().default(""),
    breakGlass: UiBreakGlassSchema.default({}),
  })
  .superRefine((d, ctx) => {
    const err = (path: string, message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });

    // applies=false ⇔ impact=none + componentKind=none + somut gerekçe (§1.5, §3)
    if (d.applies === false) {
      if (d.impact !== "none") err("impact", "applies=false iken impact 'none' olmalıdır");
      if (d.componentKind !== "none")
        err("componentKind", "applies=false iken componentKind 'none' olmalıdır");
      const reason = d.reason.trim();
      if (reason.length < 12 || GENERIC_UI_REASON.test(reason))
        err("reason", `UI N/A gerekçesi somut olmalı; jenerik gerekçe kabul edilmez: "${reason}"`);
    }
    if (d.impact === "none" && d.applies === true)
      err("applies", "impact=none iken applies=false olmalıdır (UI etkisi yok beyanı)");

    // impact != none → story veya master-component bağı zorunlu (§3)
    if (d.applies && d.impact !== "none") {
      if (d.storyRefs.length === 0 && d.masterComponentRefs.length === 0)
        err("storyRefs", "UI etkili işte story veya masterComponent bağı zorunludur");
    }

    // master-component → componentKind=master + tam çekirdek state matrisi (§3, §14.4)
    if (d.impact === "master-component") {
      if (d.componentKind !== "master")
        err("componentKind", "impact=master-component iken componentKind 'master' olmalıdır");
      const missing = MASTER_STORY_STATES.filter((s) => !d.requiredStoryStates.includes(s));
      if (missing.length > 0)
        err(
          "requiredStoryStates",
          `Master Component tam state matrisi ister; eksik: ${missing.join(", ")}`,
        );
    }

    // surface → composition story + en az bir E2E ref (§3, §14.5)
    if (d.impact === "surface") {
      if (d.storyRefs.length === 0)
        err("storyRefs", "Surface etkisinde en az bir composition story zorunludur");
      if (d.e2eRefs.length === 0)
        err(
          "e2eRefs",
          "Surface etkisinde en az bir E2E ref zorunludur (story E2E'nin yerine geçmez)",
        );
    }

    // approved → reviewer + Storybook evidence (§3, §14.6)
    if (d.reviewStatus === "approved") {
      if (!d.reviewer || d.reviewer.trim() === "")
        err("reviewer", "reviewStatus=approved reviewer olmadan geçersizdir");
      if (!d.storybookUrl && d.visualEvidenceRefs.length === 0)
        err(
          "storybookUrl",
          "reviewStatus=approved Storybook evidence (preview URL veya visual evidence) olmadan geçersizdir",
        );
    }

    // story ref biçimi: story dosyası olmalı — paralel implementation/serbest dosya reddi (§1.2, §14.7)
    for (const ref of d.storyRefs) {
      if (!/\.stories\.[a-z]+$/i.test(ref) && !ref.includes(".stories."))
        err("storyRefs", `Story ref'i story dosyası olmalıdır (*.stories.*): "${ref}"`);
    }

    // deprecated → replacement + migration story (§6, §14.8)
    if (d.deprecation?.deprecated) {
      if (!d.deprecation.replacementRef.trim())
        err("deprecation", "Deprecated component replacementRef olmadan reddedilir");
      if (!d.deprecation.migrationStoryRef.trim())
        err("deprecation", "Deprecated component migrationStoryRef olmadan reddedilir");
    }

    // -----------------------------------------------------------------------
    // v2 governance kuralları (docs/storybook-governance-pack.md U0-U27).
    // Yalnız applies=true iken çalışır; applies=false N/A yolu v1'deki gibi kalır.
    // -----------------------------------------------------------------------
    if (d.applies) {
      const yuksekRisk = d.riskClass === "critical" || d.riskClass === "high";

      // U0 — kapsam bütçesi: state x viewport x locale x theme kombinasyonu bütçeyi aşamaz.
      // Boş eksen tek varyant sayılır (max(1, n)); sınıra eşitlik geçer, aşım düşer.
      const kombinasyon =
        d.requiredStoryStates.length *
        Math.max(1, d.requiredViewports.length) *
        Math.max(1, d.requiredLocales.length) *
        Math.max(1, d.requiredThemes.length);
      if (kombinasyon > d.coverageBudget.maxStories)
        err(
          "coverageBudget",
          `U0: story kombinasyonu (${kombinasyon}) coverageBudget.maxStories (${d.coverageBudget.maxStories}) sınırını aşıyor; matrisi daraltın veya bütçeyi gerekçeyle genişletin`,
        );

      // U2 — baseline governance: approved + görsel evidence, kim/neden/hangi iş üçlüsü ister.
      if (d.visualEvidenceRefs.length > 0 && d.reviewStatus === "approved") {
        const bg = d.baselineGovernance;
        if (!bg.approvedBy.trim() || !bg.reason.trim() || !bg.taskRef.trim())
          err(
            "baselineGovernance",
            "U2: approved + görsel evidence baseline kaydı ister (approvedBy, reason, taskRef boş bırakılamaz)",
          );
      }
      // U2 — owner/design-reviewer ayrılığı: baseline onayı review'u yapana verilemez.
      if (
        d.baselineGovernance.approvedBy.trim() !== "" &&
        d.baselineGovernance.approvedBy === d.reviewer
      )
        err(
          "baselineGovernance",
          "U2: baselineGovernance.approvedBy reviewer ile aynı olamaz (onay/review ayrılığı)",
        );

      // U4/U27 — fixture'da gerçek veri HER risk sınıfında reddedilir (PII/sızıntı önlemi).
      if (d.fixtureContract.containsRealData)
        err(
          "fixtureContract",
          "U4/U27: fixtureContract.containsRealData=true kabul edilmez; fixture sentetik/sanitize olmalıdır",
        );

      // U3 — güvenlik bağı: critical/high işte permission story backend authz testi ister.
      if (
        yuksekRisk &&
        d.securityLinkage.permissionStoryRefs.length > 0 &&
        d.securityLinkage.backendAuthzTestRefs.length === 0
      )
        err(
          "securityLinkage",
          "U3: critical/high riskte permission story'leri backendAuthzTestRefs olmadan geçersizdir (UI-yalnız yetki kanıtı sayılmaz)",
        );

      // U1 — fixture fingerprint: critical/high işte fingerprintRef zorunludur (drift tespiti).
      if (yuksekRisk && d.fixtureContract.fingerprintRef.trim() === "")
        err(
          "fixtureContract",
          "U1: critical/high riskte fixtureContract.fingerprintRef zorunludur",
        );

      // U11 — manuel a11y: critical/high manuel review ister; critical ayrıca a11yTestRefs ister.
      if (yuksekRisk && d.manualA11yReviewRef.trim() === "")
        err(
          "manualA11yReviewRef",
          "U11: critical/high riskte manualA11yReviewRef zorunludur (otomatik tarama tek başına yetmez)",
        );
      if (d.riskClass === "critical" && d.a11yTestRefs.length === 0)
        err("a11yTestRefs", "U11: critical riskte en az bir a11y test referansı zorunludur");

      // U22 — break-glass: kullanım ancak denetim + telafi kaydıyla geçerlidir.
      if (d.breakGlass.used) {
        if (!d.breakGlass.auditRef.trim())
          err("breakGlass", "U22: breakGlass.used=true auditRef olmadan reddedilir");
        if (!d.breakGlass.remediationTaskRef.trim())
          err("breakGlass", "U22: breakGlass.used=true remediationTaskRef olmadan reddedilir");
      }

      // U24 — owner: approved sözleşme sahipsiz (ownerRef'siz) geçersizdir.
      if (d.reviewStatus === "approved" && d.ownerRef.trim() === "")
        err("ownerRef", "U24: reviewStatus=approved ownerRef olmadan geçersizdir");

      // U12 — performans profili: dataDense + critical/high, profil referansı ister.
      if (d.dataDense && yuksekRisk && d.performanceProfileRef.trim() === "")
        err(
          "performanceProfileRef",
          "U12: dataDense + critical/high riskte performanceProfileRef zorunludur",
        );
    }
  });
export type UiDelivery = z.infer<typeof UiDeliverySchema>;
