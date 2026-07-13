import {
  AtomDefinitionSchema,
  TaskMicroStepDefinitionSchema,
  TaskNodeSchema,
  ValueAtomDefinitionSchema,
} from "@/schemas";
import { describe, expect, it } from "vitest";

const taskAtom = {
  kind: "task-micro-step",
  parentLevel: "work_unit",
  invariant: "Geçersiz tenant bağlamı fail-closed reddedilir.",
  change: "get_tenant_id eksik bağlamda TenantContextMissingError fırlatır.",
  failureMode: "Eksik tenant bağlamıyla sorgu çalışır ve veri sınırı aşılır.",
  allowedFiles: ["apps/api/src/meta_api/tenancy.py", "apps/api/tests/test_tenancy.py"],
  nonGoals: ["RLS politikasını veya tenant yaşam döngüsünü değiştirmek"],
  sideEffect: "none",
  riskLevel: "high",
  rollback: "Üst component değişikliğini geri al; şema veya dış etki yoktur.",
  testVectors: [
    {
      kind: "positive",
      name: "tenant bağlamı okunur",
      testRef: "test_get_tenant_id_returns_context",
      expected: "Bağlamdaki UUID döner.",
    },
    {
      kind: "negative",
      name: "eksik bağlam reddedilir",
      testRef: "test_get_tenant_id_rejects_missing_context",
      expected: "TenantContextMissingError fırlatılır.",
    },
  ],
  evidenceRollup: "platform-tenancy-context",
  reviewer: "security-team",
} as const;

const dimensions = {
  storageMapping: "numeric(19,4) + char(3) currency",
  validation: "Currency ISO-4217 registry'sinde bulunur; amount Decimal'dır.",
  parameterization: "currencySet, precision ve rounding zorunludur.",
  canonicalization: "Currency uppercase; amount seçilen scale'e quantize edilir.",
  comparison: "Yalnız aynı currency içindeki amount sıralanır.",
  equality: "Canonical amount ve currency birlikte eşittir; fuzzy match yasaktır.",
  indexability: "tenant + currency + amount bileşik indekslenebilir.",
  i18n: "Gösterim locale'e bağlı; saklama locale'den bağımsızdır.",
  valueStates: "null=bilinmiyor, zero=bedelsiz; empty payload geçersizdir.",
  serialization: "{amount:string,currency:string} kanonik JSON şeklidir.",
  surfaceProjection: "Currency seçici ve decimal amount alanı birlikte render edilir.",
  securityClass: "financial",
  versioning: "Precision değişimi expand-contract migration gerektirir.",
} as const;

const valueAtom = {
  kind: "value-type",
  typeId: "money",
  atomicityReason: "Amount ve currency ayrı iş varlığı değil, tek para değerinin parametreleridir.",
  baseType: "decimal",
  params: {
    kind: "money",
    currencySet: ["TRY", "USD"],
    precision: 19,
    scale: 4,
    rounding: "half-up",
  },
  dimensions,
  registryRefs: [{ id: "iso-4217", version: "2026-01", effectiveFrom: "2026-01-01" }],
  runtime: {
    backendAdapter: "meta_api.atomic.money.MoneyType",
    frontendAdapter: "src/atomic/money.ts",
    contractFingerprint: "sha256:money-v1",
  },
  migration: {
    strategy: "expand-contract",
    backwardReader: "currency alanını Money şekline çeviren v1 okuyucu",
    downgrade: "Money değerini amount+currency kolonlarına kayıpsız ayır",
  },
  testVectors: taskAtom.testVectors,
  deprecation: { status: "active", replacement: "", sunsetAt: "" },
  owner: "kernel-team",
  reviewer: "finance-platform-reviewer",
} as const;

describe("atom tanımı sözleşmeleri", () => {
  it("tam WBS micro-step atomunu kabul eder", () => {
    expect(TaskMicroStepDefinitionSchema.parse(taskAtom).kind).toBe("task-micro-step");
  });

  it("pozitif ve negatif test vektörü olmayan micro-step atomunu reddeder", () => {
    expect(() =>
      TaskMicroStepDefinitionSchema.parse({
        ...taskAtom,
        testVectors: [taskAtom.testVectors[0]],
      }),
    ).toThrow();
  });

  it("allowedFiles veya nonGoals eksik micro-step atomunu reddeder", () => {
    expect(() => TaskMicroStepDefinitionSchema.parse({ ...taskAtom, allowedFiles: [] })).toThrow();
    expect(() => TaskMicroStepDefinitionSchema.parse({ ...taskAtom, nonGoals: [] })).toThrow();
  });

  it("tam 13 boyut ve runtime/migration bağı olan değer atomunu kabul eder", () => {
    expect(ValueAtomDefinitionSchema.parse(valueAtom).typeId).toBe("money");
    expect(Object.keys(ValueAtomDefinitionSchema.parse(valueAtom).dimensions)).toHaveLength(13);
  });

  it("13 boyuttan biri eksik değer atomunu reddeder", () => {
    const { versioning: _versioning, ...incomplete } = dimensions;
    expect(() =>
      ValueAtomDefinitionSchema.parse({ ...valueAtom, dimensions: incomplete }),
    ).toThrow();
  });

  it("Money parametrelerini eksik veya yanlış tipte reddeder", () => {
    expect(() =>
      ValueAtomDefinitionSchema.parse({
        ...valueAtom,
        params: { kind: "money", currencySet: [], precision: 19, scale: 4, rounding: "half-up" },
      }),
    ).toThrow();
  });

  it("WBS atomu ve değer atomunu discriminated union ile ayırır", () => {
    expect(AtomDefinitionSchema.parse(taskAtom).kind).toBe("task-micro-step");
    expect(AtomDefinitionSchema.parse(valueAtom).kind).toBe("value-type");
    expect(() => AtomDefinitionSchema.parse({ kind: "atom" })).toThrow();
  });

  it("demonstrasyon atomunu code-start dışı tam tanım olarak kabul eder", () => {
    const demo = AtomDefinitionSchema.parse({
      kind: "task-demonstration",
      parentLevel: "work_unit",
      purpose: "Yedi seviyeli WBS zincirinde atom konumunu öğretir.",
      nonExecutableReason: "Dosya, invariant ve çalıştırılabilir test hedeflemez.",
      promotionCriteria: [
        "Tek invariant seçilir.",
        "Allowed-files ve test komutu bağlanır.",
        "Pozitif ve negatif test vektörleri yazılır.",
      ],
    });
    expect(demo.kind).toBe("task-demonstration");
  });

  it("task-micro-step tanımını yalnız micro_step WBS seviyesinde kabul eder", () => {
    expect(() =>
      TaskNodeSchema.parse({
        id: "yanlis-seviye",
        level: "feature",
        title: "Yanlış seviye",
        slug: "yanlis-seviye",
        atomDefinition: taskAtom,
      }),
    ).toThrow();
    expect(
      TaskNodeSchema.parse({
        id: "dogru-seviye",
        level: "micro_step",
        title: "Doğru seviye",
        slug: "dogru-seviye",
        atomDefinition: taskAtom,
      }).atomDefinition?.kind,
    ).toBe("task-micro-step");
  });
});
