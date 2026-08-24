import { z } from "zod";

/**
 * Mühendislik Standardı Sözleşmesi (ADR-0027) — TEK paylaşılan şema; her standart
 * (coding/design/test/devops/ai…) `src/data/standards/<id>.json` olarak bu şemaya uyar.
 * Düğüm bunlara `standardRefs` ile REFERANS verir; içeriği yeniden yazmaz (drift yok).
 * "Kart ekle" değil, makine-okunur + CI-zorlamalı sözleşme.
 */
export const StandardSeveritySchema = z.enum(["must", "should", "may"]);
export type StandardSeverity = z.infer<typeof StandardSeveritySchema>;

export const StandardFamilySchema = z.enum([
  "engineering",
  "design",
  "testing",
  "devops",
  "ai",
  "data",
  "governance",
]);
export type StandardFamily = z.infer<typeof StandardFamilySchema>;

export const StandardRuleSchema = z.object({
  id: z.string().min(1),
  /** Kuralın kendisi — somut, ölçülebilir, uygulanabilir. */
  rule: z.string().min(1),
  rationale: z.string().default(""),
  severity: StandardSeveritySchema.default("must"),
  /** Nasıl zorlanır: CI kapısı / lint kuralı / review / test. Boş = henüz otomatik değil. */
  check: z.string().default(""),
});
export type StandardRule = z.infer<typeof StandardRuleSchema>;

/**
 * Change-package satır bütçesi (short-code / `short-pr-size`) — TEK kanonik makine sahibi.
 * Fail-closed: strict nesne, kapalı enum, OWNER sayıları/koşul KÜMELERİ literal ve küme
 * eşitliğiyle kilitli; sınıf-churn tavanı merdivenden türer. Eski prose kopyaları P3 borcu.
 */
export const BudgetRequirementSchema = z.enum([
  "single-narrow-problem",
  "bounded-file-set",
  "no-redundant-repetition",
  "no-quality-tradeoff",
  "full-green",
  "fresh-reviewer-accept",
  "explicit-rollback",
  "strong-technical-justification",
  "independent-review",
  "explicit-waiver",
]);
export type BudgetRequirement = z.infer<typeof BudgetRequirementSchema>;
/** Enum sırası bant sırasıdır: waiver kanıtları güçlü teknik gerekçeden itibaren başlar. */
const REQS = BudgetRequirementSchema.options;
const WAIVER_REQS = REQS.slice(REQS.indexOf("strong-technical-justification"));
const CONDITIONAL_REQS = REQS.slice(0, REQS.length - WAIVER_REQS.length);
/** OWNER sayıları: kanonik verinin validator invariantı — ikinci bir prose kopyası DEĞİL. */
const OWNER_MAX_NET = { default: 400, conditional: 800, waiver: 1200 } as const;
const OWNER_MAX_CHANGED_FILES = 20;
const REPORTED_CATEGORIES = ["generated", "lockfile", "mechanical-projection"] as const;
const swallows = (p: string) => ["src/", "tests/", "tools/", "docs/"].some((r) => r.startsWith(p));
const MEASUREMENT_MODES = ["range", "working-tree"] as const;
const MEASUREMENT_REPORTS = ["gross-additions", "gross-deletions", "measured-net"] as const;
/** Küme eşitliği: eksik, fazla, tekrarlı ve "başka geçerli kimlik" sapmalarının hepsi RED. */
const sameSet = (got: readonly string[], want: readonly string[]) =>
  got.length === want.length && want.every((w) => got.includes(w));

/**
 * ULTRA_FAST_V1 — Actionplan hızlı teslim politikası (aktif-varsayılan, pilot DEĞİL). TEK kanonik
 * makine yuvası bu belgenin (short-code) `changePackageBudget.ultraFastV1` alanıdır; ayrı bir
 * dosya YOKTUR. `ultraFastPolicyRef` yalnız kendi öz-adresine İŞARET eder, sayıyı KOPYALAMAZ.
 * Strict + literal kilitli: OWNER kararları (bant, kadans, QA sırası, eşzamanlılık formülü, karar
 * yetkisi kategorileri) ikinci bir prose kopyasında sürüklenemez.
 */
const TERMINAL_OUTCOMES = [
  "READY_FOR_CI",
  "CLEAN_SPLIT_OR_ROLLBACK",
  "BLOCKED_WITH_ONE_EVIDENCE",
] as const;
const QA_ROLES = ["test", "implementation", "read-only-reviewer"] as const;
const MASTER_DECIDES = [
  "reversible-technical",
  "worktree",
  "test-framework",
  "git",
  "pr",
  "ci",
] as const;
const OWNER_QUESTION_CATEGORIES = [
  "product-brand-scope",
  "irreversible-impact",
  "external-cost",
  "security-risk-appetite",
  "credentials",
  "genuinely-required-external-authority",
] as const;

export const UltraFastV1Schema = z
  .strictObject({
    testScoping: z.strictObject({
      activeDefault: z.strictObject({
        minScenarios: z.literal(3),
        maxScenarios: z.literal(8),
        maxTestFiles: z.literal(2),
      }),
      nonBehavioral: z.strictObject({
        minScenarios: z.literal(0),
        maxScenarios: z.literal(2),
        explicitRedAllowed: z.literal("N/A"),
      }),
      namedRiskException: z.strictObject({
        requiresNamedRisk: z.literal(true),
        requiresBoundedLocalCeiling: z.literal(true),
        requiresIndependentReview: z.literal(true),
      }),
    }),
    checkpointCadence: z.strictObject({
      checkpointMinutes: z.literal(20),
      maxCorrectionWaves: z.literal(1),
      terminalOutcomes: z.tuple([
        z.literal(TERMINAL_OUTCOMES[0]),
        z.literal(TERMINAL_OUTCOMES[1]),
        z.literal(TERMINAL_OUTCOMES[2]),
      ]),
    }),
    qaDiscipline: z.strictObject({
      fullQaSequence: z.tuple([z.literal("writer-local"), z.literal("ci")]),
      unchangedSnapshotRerunAllowed: z.literal(false),
      browserVerificationScope: z.literal("visible-ui-journey-change-only"),
      separateRoles: z.array(z.enum(QA_ROLES)).length(QA_ROLES.length),
    }),
    paneAdmission: z.strictObject({
      admissionMode: z.literal("jit-exact-worktree"),
      speculativeCreationAllowed: z.literal(false),
      concurrencyFormula: z.literal(
        "min(guardianRecommended, dagReadyCount, sharedLockCapacity, 3)",
      ),
      staticConcurrencyCeiling: z.literal(3),
      gcTrigger: z.literal("event-driven"),
    }),
    decisionAuthority: z.strictObject({
      masterDecidesWithoutAsking: z.array(z.enum(MASTER_DECIDES)).min(MASTER_DECIDES.length),
      ownerQuestionCategories: z
        .array(z.enum(OWNER_QUESTION_CATEGORIES))
        .min(OWNER_QUESTION_CATEGORIES.length),
      /** En az beş sabit projeksiyon dosyası + en az bir `.claude/agents/` profili taşır. */
      pointerProjectionFiles: z.array(z.string().min(1)).min(6),
    }),
    /** Yalnız iki kanıt dosyasının adı + sha256'sı; rapor metni KOPYALANMAZ. */
    evidenceReports: z
      .array(
        z.strictObject({ file: z.string().min(1), sha256: z.string().regex(/^[0-9a-f]{40,80}$/) }),
      )
      .length(2),
    evidenceHashes: z.array(z.string().regex(/^[0-9a-f]{40,80}$/)).length(2),
  })
  .superRefine((policy, ctx) => {
    const add = (message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    const roles = new Set(policy.qaDiscipline.separateRoles);
    if (roles.size !== QA_ROLES.length || QA_ROLES.some((r) => !roles.has(r)))
      add("qaDiscipline.separateRoles tam üç rolü ayrı taşımalı");
    if (
      !policy.decisionAuthority.pointerProjectionFiles.some((p) => p.startsWith(".claude/agents/"))
    )
      add("pointerProjectionFiles en az bir .claude/agents/ profili içermeli");
    const hashSet = new Set(policy.evidenceHashes);
    if (hashSet.size !== policy.evidenceHashes.length) add("evidenceHashes tekrar içeremez");
    const reportHashSet = new Set(policy.evidenceReports.map((r) => r.sha256));
    if (hashSet.size !== reportHashSet.size || [...hashSet].some((h) => !reportHashSet.has(h)))
      add("evidenceHashes, evidenceReports'taki sha256 kümesiyle birebir eşleşmeli");
  });
export type UltraFastV1 = z.infer<typeof UltraFastV1Schema>;

export const BudgetClassSchema = z.enum(["production", "security-test-conformance"]);
export const BudgetBandIdSchema = z.enum(["default", "conditional", "waiver"]);
const positive = z.number().int().positive();

export const BudgetBandSchema = z.strictObject({
  id: BudgetBandIdSchema,
  maxNet: positive,
  /** İstenen kanıt; hangi kimliklerin arandığı küme-eşitliğiyle kilitli (superRefine). */
  requires: z.array(BudgetRequirementSchema),
  /** Alt bandın koşullarının devralınıp devralınmadığı; kararı sahibin, yazarın değil. */
  includesLowerBandRequirements: z.boolean(),
  note: z.string().min(1),
});
export type BudgetBand = z.infer<typeof BudgetBandSchema>;

const BudgetClassEntrySchema = z.strictObject({
  id: BudgetClassSchema,
  maxNet: positive,
  ceilingKind: z.enum(["default", "justified"]),
  scope: z.string().min(1),
});
/** Ayrı raporlanan kategori: en az bir yol/önek bildirir; önek kaynak kökünü YUTAMAZ. */
const ReportedCategorySchema = z
  .strictObject({
    id: z.enum(REPORTED_CATEGORIES),
    paths: z.array(z.string().min(1)),
    pathPrefixes: z.array(z.string().min(1)).refine((a) => !a.some(swallows), "kökü yutan önek"),
  })
  .refine((c) => c.paths.length + c.pathPrefixes.length > 0, { message: "yol/önek bildirilmedi" });

/**
 * B13 — merge koruması sözleşmesi. Bu alan canlı GitHub korumasını KURMAZ; hâlihazırda yürürlükte
 * olan korumayı makine tarafından karşılaştırılabilir kılar. Altı politika kararı LITERAL kilitli
 * (gevşetilmesi tip hatasıdır); `branch` ve `requiredCheck` boş-olmayan metindir çünkü kesin
 * kimlikleri iş akışı dosyasına conformance testinde bağlanır, ikinci kez buraya kopyalanmaz.
 */
const MERGE_PROTECTION_VERIFIER = "tools/agents/check-pr-size-branch-protection.mjs";
export const MergeProtectionSchema = z.strictObject({
  branch: z.string().min(1),
  requiredCheck: z.string().min(1),
  strict: z.literal(true),
  enforceAdmins: z.literal(true),
  pullRequestRequired: z.literal(true),
  forcePushAllowed: z.literal(false),
  deletionAllowed: z.literal(false),
  requiredConversationResolution: z.literal(true),
  verifier: z.literal(MERGE_PROTECTION_VERIFIER),
  note: z.string().min(1),
});
export type MergeProtection = z.infer<typeof MergeProtectionSchema>;

export const ChangePackageBudgetSchema = z
  .strictObject({
    /** Kanonik ULTRA_FAST_V1 sözleşmesine ÖZ-işaretçi (bu belgenin kendi alanına); ikinci bir
     *  dosya YOKTUR — sayı/enum KOPYALAMAZ, yalnız adresi taşır. */
    ultraFastPolicyRef: z
      .literal("src/data/standards/short-code.json#changePackageBudget.ultraFastV1")
      .optional(),
    unit: z.literal("change-package"),
    netFormula: z.literal("additions-deletions"),
    maxChangedFiles: z.literal(OWNER_MAX_CHANGED_FILES),
    bands: z.array(BudgetBandSchema).length(3),
    splitRequiredAboveNet: positive,
    classes: z.array(BudgetClassEntrySchema).min(2),
    /** Anlamsız silme bütçeye kredi yazamaz; brüt tavan bağımsız sayı değil, banttan türer. */
    churnGuard: z.strictObject({
      netCreditFloor: z.literal(0),
      netCreditPolicy: z.literal("net-clamped-at-floor-deletions-earn-no-credit"),
      grossMaxFromBand: z.literal("conditional"),
      appliesWhenNetAtOrBelowBand: z.literal("default"),
      requires: z.array(BudgetRequirementSchema).min(1),
      note: z.string().min(1),
    }),
    separatelyReported: z.array(ReportedCategorySchema).length(REPORTED_CATEGORIES.length),
    measurement: z.strictObject({
      defaultRange: z.string().min(1),
      modes: z.array(z.enum(MEASUREMENT_MODES)).min(1),
      /** Brüt ekleme, brüt silme ve ÖLÇÜLEN net ayrı ayrı raporlanır; biri saklanamaz. */
      reports: z.array(z.enum(MEASUREMENT_REPORTS)).min(1),
      /** Kapı zincirli paketleri ayrıştırmaz; bunun tersini iddia etmek yasaktır. */
      decomposesChainedPackages: z.literal(false),
      honestScopeNote: z.string().min(1),
    }),
    /** P1'de kapı YOK: `blocks` yalnız status `ci-enforced-blocking` iken true olabilir. */
    checker: z.strictObject({
      path: z.string().min(1),
      status: z.enum(["planned-not-implemented", "implemented-not-wired", "ci-enforced-blocking"]),
      blocks: z.boolean(),
      note: z.string().min(1),
      /** B13: canlı merge korumasının TEK makine-okunur sahibi; zorunlu, strict ve literal kilitli. */
      mergeProtection: MergeProtectionSchema,
    }),
    /** ULTRA_FAST_V1 — bu belgenin (short-code) TEK kanonik yuvası; ayrı dosya YOKTUR. */
    ultraFastV1: UltraFastV1Schema,
  })
  .superRefine((b, ctx) => {
    const add = (message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    const [def, conditional, waiver] = b.bands;
    if (b.bands.map((band) => band.id).join() !== "default,conditional,waiver")
      add("bant merdiveni default → conditional → waiver sırasında olmalı");
    for (const band of b.bands)
      if (band.maxNet !== OWNER_MAX_NET[band.id]) add(`${band.id}: OWNER tavanı değişmiş`);
    if (!sameSet(def.requires, [])) add("varsayılan bant ek kanıt isteyemez");
    // OWNER kararı yapısal invariant: yedi koşulun KİMLİĞİ pinli, waiver bu bantta yasak.
    if (!sameSet(conditional.requires, CONDITIONAL_REQS)) add("koşullu bant TAM yedi kimlik ister");
    if (!sameSet(waiver.requires, WAIVER_REQS)) add("waiver bandı TAM üç OWNER kanıtı ister");
    if (b.splitRequiredAboveNet !== waiver.maxNet) add("split eşiği en üst bant tavanı değil");
    const ids = b.classes.map((c) => c.id);
    if (new Set(ids).size !== ids.length) add("sınıf kimlikleri benzersiz değil");
    if (!b.classes.some((c) => c.ceilingKind === "default")) add("varsayılan sınıf tanımlı değil");
    for (const c of b.classes)
      if (c.maxNet !== (c.ceilingKind === "default" ? def.maxNet : conditional.maxNet))
        add(`${c.id}: sınıf tavanı ${c.ceilingKind} bandına eşit değil`);
    const categories = b.separatelyReported.map((c) => c.id);
    if (!sameSet(categories, REPORTED_CATEGORIES)) add("kategori kümesi eksik/tekrarlı");
    if (!sameSet(b.measurement.modes, MEASUREMENT_MODES)) add("ölçüm modları eksik/tekrarlı");
    if (!sameSet(b.measurement.reports, MEASUREMENT_REPORTS))
      add("brüt ekleme, brüt silme ve ölçülen net ayrı ayrı raporlanmalı");
    if (b.checker.blocks !== (b.checker.status === "ci-enforced-blocking"))
      add("kapı yalnız CI'a bağlıyken bloklar; blocks alanı status ile uyumsuz");
  });
export type ChangePackageBudget = z.infer<typeof ChangePackageBudgetSchema>;

export const StandardContractSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9][a-z0-9-]*$/),
  name: z.string().min(1),
  version: z.string().default("1.0.0"),
  family: StandardFamilySchema,
  basedOnAdr: z.array(z.string()).default([]),
  summary: z.string().default(""),
  /** Hangi yüzey sınıfı/seviyeye uygulanır (boş = hepsi). */
  appliesTo: z.array(z.string()).default([]),
  rules: z.array(StandardRuleSchema).min(3),
  banned: z.array(z.string()).default([]),
  allowed: z.array(z.string()).default([]),
  references: z.array(z.string()).default([]),
  /** Yalnız satır bütçesini sahiplenen standart taşır (short-code); varsa tam geçerli olmalı. */
  changePackageBudget: ChangePackageBudgetSchema.optional(),
});
export type StandardContract = z.infer<typeof StandardContractSchema>;

export const StandardCatalogSchema = z.array(StandardContractSchema);
export type StandardCatalog = z.infer<typeof StandardCatalogSchema>;
