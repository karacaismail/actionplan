import {
  type AtomTestVector,
  type ValueAtomDefinition,
  ValueAtomDefinitionSchema,
  type ValueAtomDimensions,
} from "@/schemas/atom";

const dimensions = (typeId: string): ValueAtomDimensions => ({
  storageMapping: `${typeId} için PostgreSQL fiziksel temsili açıkça sürümlenir.`,
  validation: `${typeId} bütün-değer doğrulaması fail-closed çalışır.`,
  parameterization: `${typeId} yalnız kendi discriminated params sözleşmesini kabul eder.`,
  canonicalization: `${typeId} kanonik formu sürüm-kilitli ve deterministiktir.`,
  comparison: `${typeId} karşılaştırması yalnız semantik olarak uyumlu değerlerde tanımlıdır.`,
  equality: `${typeId} eşitliği kanonik bütün-değerde exact çalışır; fuzzy davranış ayrıca beyan edilir.`,
  indexability: `${typeId} için tenant ve sorgu desenine uygun index stratejisi tanımlıdır.`,
  i18n: `${typeId} saklaması locale bağımsız, sunumu locale duyarlıdır.`,
  valueStates: `${typeId} null, empty, unknown, N-A ve zero durumlarını karıştırmaz.`,
  serialization: `${typeId} API serileştirmesi kanonik ve round-trip kayıpsızdır.`,
  surfaceProjection: `${typeId} widget projeksiyonu params ve validation sözleşmesinden türer.`,
  securityClass: `${typeId} veri sınıfı, maskeleme ve audit davranışı açıkça beyan edilir.`,
  versioning: `${typeId} parametre veya temsil değişimi compatibility ve migration gerektirir.`,
});

const testVectors = (typeId: string): AtomTestVector[] => [
  {
    kind: "positive",
    name: `${typeId} geçerli değer round-trip`,
    testRef: `test_${typeId.replaceAll("-", "_")}_valid_round_trip`,
    expected: "Geçerli değer parse, serialize ve tekrar parse sonrasında aynıdır.",
  },
  {
    kind: "negative",
    name: `${typeId} geçersiz değer reddi`,
    testRef: `test_${typeId.replaceAll("-", "_")}_rejects_invalid_value`,
    expected: "Geçersiz değer fail-closed doğrulama hatası üretir.",
  },
  {
    kind: "edge",
    name: `${typeId} sınır ve boş durumları`,
    testRef: `test_${typeId.replaceAll("-", "_")}_edge_states`,
    expected: "Sınır değerleri ile null, empty, unknown ve N-A ayrımı korunur.",
  },
];

type DefinitionInput = Pick<ValueAtomDefinition, "typeId" | "baseType" | "params"> &
  Partial<Pick<ValueAtomDefinition, "registryRefs" | "atomicityReason">>;

const define = ({
  typeId,
  baseType,
  params,
  registryRefs = [],
  atomicityReason,
}: DefinitionInput) =>
  ValueAtomDefinitionSchema.parse({
    kind: "value-type",
    typeId,
    atomicityReason:
      atomicityReason ??
      `${typeId} kimlik veya bağımsız yaşam döngüsü taşımaz; tek kanonik bütün-değerdir.`,
    baseType,
    params,
    dimensions: dimensions(typeId),
    registryRefs,
    runtime: {
      backendAdapter: `meta_api.atomic.${typeId.replaceAll("-", "_")}`,
      frontendAdapter: `src/atomic/${typeId}.ts`,
      contractFingerprint: `sha256:${typeId}-contract-v1`,
    },
    migration: {
      strategy: "expand-contract",
      backwardReader: `${typeId} v1 ve önceki desteklenen temsilleri okuyan compatibility adapter`,
      downgrade: `${typeId} değişikliğini veri kaybetmeden önceki desteklenen temsile döndür`,
    },
    testVectors: testVectors(typeId),
    deprecation: { status: "active", replacement: "", sunsetAt: "" },
    owner: "kernel-team",
    reviewer: "atomic-types-reviewer",
  });

const datedRef = (id: string, version: string) => ({
  id,
  version,
  effectiveFrom: "2026-01-01",
});

export const VALUE_ATOM_DEFINITIONS = {
  money: define({
    typeId: "money",
    baseType: "decimal",
    params: {
      kind: "money",
      currencySet: ["TRY", "USD", "EUR"],
      precision: 19,
      scale: 4,
      rounding: "half-up",
    },
    registryRefs: [datedRef("iso-4217", "2026-01")],
  }),
  measure: define({
    typeId: "measure",
    baseType: "decimal",
    params: {
      kind: "measure",
      dimension: "registry-defined",
      unitSystem: "ucum",
      precision: 19,
      scale: 6,
      rounding: "half-even",
    },
    registryRefs: [datedRef("ucum", "2-2")],
  }),
  percentage: define({
    typeId: "percentage",
    baseType: "decimal",
    params: {
      kind: "percentage",
      basis: "fraction",
      precision: 9,
      scale: 6,
      rounding: "half-up",
    },
  }),
  "i18n-text": define({
    typeId: "i18n-text",
    baseType: "json",
    params: { kind: "i18n-text", localesRef: "bcp-47", fallbackRef: "locale-fallback-v1" },
    registryRefs: [datedRef("bcp-47", "2026-01"), datedRef("cldr", "v48")],
  }),
  duration: define({
    typeId: "duration",
    baseType: "string",
    params: { kind: "temporal", timezoneMode: "none", precision: "second" },
    registryRefs: [datedRef("iso-8601", "2019")],
  }),
  term: define({
    typeId: "term",
    baseType: "duration",
    params: { kind: "temporal", timezoneMode: "iana-zone", precision: "day" },
    registryRefs: [datedRef("iana-tz", "2026a")],
  }),
  recurrence: define({
    typeId: "recurrence",
    baseType: "string",
    params: {
      kind: "recurrence",
      ruleStandard: "rfc-5545",
      timezoneMode: "iana-zone",
      terminationRequired: true,
    },
    registryRefs: [datedRef("iana-tz", "2026a")],
  }),
  range: define({
    typeId: "range",
    baseType: "json",
    params: { kind: "range", elementType: "date", bounds: "[)", allowUnbounded: true },
  }),
  uuid: define({
    typeId: "uuid",
    baseType: "string",
    params: { kind: "identifier", scheme: "uuid-v7", checksum: "none", jurisdiction: "" },
  }),
  timestamptz: define({
    typeId: "timestamptz",
    baseType: "string",
    params: { kind: "temporal", timezoneMode: "utc", precision: "microsecond" },
    registryRefs: [datedRef("iana-tz", "2026a")],
  }),
  decimal: define({
    typeId: "decimal",
    baseType: "string",
    params: { kind: "decimal", precision: 38, scale: 12, rounding: "half-even" },
  }),
  "party-ref": define({
    typeId: "party-ref",
    baseType: "uuid",
    params: { kind: "reference", targetKind: "party", onDelete: "restrict", scope: "same-tenant" },
  }),
  "asset-ref": define({
    typeId: "asset-ref",
    baseType: "uuid",
    params: {
      kind: "reference",
      targetKind: "digital-asset",
      onDelete: "restrict",
      scope: "same-tenant",
    },
  }),
  "clause-ref": define({
    typeId: "clause-ref",
    baseType: "uuid",
    params: { kind: "reference", targetKind: "clause", onDelete: "restrict", scope: "same-tenant" },
  }),
  "external-id": define({
    typeId: "external-id",
    baseType: "string",
    params: { kind: "identifier", scheme: "source-scoped", checksum: "optional", jurisdiction: "" },
  }),
  "signature-field": define({
    typeId: "signature-field",
    baseType: "asset-ref",
    params: {
      kind: "reference",
      targetKind: "signature-evidence",
      onDelete: "deny",
      scope: "same-tenant",
    },
  }),
  fragment: define({
    typeId: "fragment",
    baseType: "json",
    params: { kind: "fragment-ref", fragmentRef: "platform-fragment", cardinality: "one" },
  }),
  "local-date": define({
    typeId: "local-date",
    baseType: "string",
    params: { kind: "temporal", timezoneMode: "none", precision: "day" },
    registryRefs: [datedRef("iso-8601", "2019")],
    atomicityReason:
      "local-date saat diliminden bağımsız takvim tarihidir (doğum tarihi, son teslim günü gibi); UTC timestamp'e indirgenmez ve timestamptz'nin yerine geçmez; kimlik veya bağımsız yaşam döngüsü taşımaz; tek kanonik bütün-değerdir.",
  }),
  "local-time": define({
    typeId: "local-time",
    baseType: "string",
    params: { kind: "temporal", timezoneMode: "none", precision: "second" },
    registryRefs: [datedRef("iso-8601", "2019")],
    atomicityReason:
      "local-time saat diliminden bağımsız yerel saattir (mağaza açılış saati, günlük hatırlatma saati gibi duvar-saati değeri); UTC'ye çevrilerek saklanmaz; kimlik veya bağımsız yaşam döngüsü taşımaz; tek kanonik bütün-değerdir.",
  }),
  "zoned-datetime": define({
    typeId: "zoned-datetime",
    baseType: "string",
    params: { kind: "temporal", timezoneMode: "iana-zone", precision: "microsecond" },
    registryRefs: [datedRef("iana-tz", "2026a")],
    atomicityReason:
      'zoned-datetime belirli bir saat dilimindeki tarih-saattir; saat dilimi alanı IANA saat dilimi kimliğiyle ("Europe/Istanbul" gibi) ZORUNLUDUR, sabit UTC+3 gibi offset saklamak yasaktır; kimlik veya bağımsız yaşam döngüsü taşımaz; tek kanonik bütün-değerdir.',
  }),
  "business-day": define({
    typeId: "business-day",
    baseType: "local-date",
    params: { kind: "temporal", timezoneMode: "iana-zone", precision: "day" },
    registryRefs: [datedRef("iana-tz", "2026a")],
    atomicityReason:
      "business-day pazara ve kuruma bağlı iş günüdür; hafta sonu kümesi, tatil takvimi ve kesim saati (cutoff) parametreleriyle çözülür, evrensel Pazartesi-Cuma varsayımı yasaktır; kimlik veya bağımsız yaşam döngüsü taşımaz; tek kanonik bütün-değerdir.",
  }),
} satisfies Record<string, ValueAtomDefinition>;

/**
 * JSON-STD-3b dizi görünümü: entegrasyon tüketicileri registry'yi `id` alanlı liste olarak
 * okur (id === typeId). Kanonik tanım kaydı VALUE_ATOM_DEFINITIONS'tadır.
 */
export const VALUE_ATOM_REGISTRY = Object.entries(VALUE_ATOM_DEFINITIONS).map(
  ([id, definition]) => ({ id, ...definition }),
);

export const REQUIRED_VALUE_ATOM_IDS = Object.freeze(Object.keys(VALUE_ATOM_DEFINITIONS));
