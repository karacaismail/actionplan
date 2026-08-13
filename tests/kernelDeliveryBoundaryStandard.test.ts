import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { StandardContractSchema } from "@/schemas";
import { describe, expect, it } from "vitest";

/**
 * A1-G2 kapısı — REFERENCE-ONLY katalog girişi.
 *
 * Bu JSON mimari kararın sahibi DEĞİLDİR. Tek kanonik sahip A1 karar kaydı ve onun
 * doğrulayıcısıdır; giriş yalnız onlara işaret eder. ADR-0027 `arch-json-as-db` ilkesi gereği
 * ("standartlar düğüme kopyalanmaz, referans verilir") bağlayıcı değerlerin ikinci kopyası burada
 * yasaktır — ve bu yasak elle yazılmış bir listeyle değil KAYNAKTAN TÜRETİLEREK denetlenir:
 * kaynağın kendi değerleri girişin normatif metninde aranır, biri geçiyorsa kopya var demektir.
 * capability delta = NONE — bu paket runtime, conformance süiti veya çalışan form üretmez.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const JSON_PATH = "src/data/standards/kernel-delivery-boundary.json";
const DECISION = "reports/kernel-asgi-core-profile-decision-2026-08-11.json";
const VALIDATOR = "tools/lib/kernel-asgi-core-profile.mjs";
const DECISION_TEST = "tests/kernelAsgiCoreProfileDecision.test.ts";
const ANCHOR =
  "docs/adr-0027-engineering-standards.md#sahip-anlayışı-ve-teknoloji-kanıtı-sözleşmesi-ap-oc1";
const GOVERNANCE = "src/data/standards/ai-governance.json";
const MANIFEST = "src/data/workspace-manifest.json";
const REFERENCES = [DECISION, VALIDATOR, DECISION_TEST, ANCHOR, GOVERNANCE];
/** StandardContractSchema'nın kök anahtarları, birebir. Şema fazlalığı sessizce strip eder. */
const ROOT_KEYS =
  "id,name,version,family,basedOnAdr,summary,appliesTo,rules,banned,allowed,references";
/** Görünür projeksiyonun kendinden türetilmeyen sabit pini: masum ya da kötü her drift RED. */
const VISIBLE_SHA = "3564bcdc1120c3eadc9e37416e2d3b7ffd45a45eecd954e89fb58541c68b0c52";
type Doc = Record<string, unknown>;
type Evaluate = (input: { decision: unknown; manifest: unknown }) => {
  accepted: boolean;
  errors: string[];
};
const readJson = (relative: string): Doc =>
  JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const canonical = readJson(JSON_PATH);
const strings = (node: unknown, out: string[] = []): string[] => {
  if (typeof node === "string") out.push(node);
  else if (Array.isArray(node)) for (const item of node) strings(item, out);
  else if (node && typeof node === "object") for (const v of Object.values(node)) strings(v, out);
  return out;
};
/**
 * Kaynağın sahiplendiği değerler. İşaretçiler (URL ve var olan repo yolu) dışarıdadır: bu giriş
 * kaynağına işaret etmek ZORUNDADIR, yalnız kaynağın KARARINI ikinci kez yazması yasaktır.
 */
const SOURCE_VALUES = [...new Set(strings(readJson(DECISION)))].filter(
  (v) => v.length >= 6 && !v.includes("://") && !fs.existsSync(path.join(ROOT, v)),
);
/**
 * Sahibin okuduğu metin — `name` DÂHİL. Başlık alanı kimlik değil görünür metindir: engine onu
 * projeksiyona alır (`src/engine/standards.ts`) ve sahip-yüzlü Markdown export'unda başlık olarak
 * basar (`src/engine/exportDataShared.ts`), yani oraya yazılan bir değer kopyası ya da readiness
 * iddiası tam olarak sahibin gördüğü yere düşer. Yalnız kimlik/işaretçi alanları dışarıdadır
 * (`id/version/family/basedOnAdr` ve `appliesTo`); onlar ayrıca birebir pinlidir.
 */
const normative = (doc: Doc) =>
  JSON.stringify({
    name: doc.name,
    summary: doc.summary,
    rules: doc.rules,
    banned: doc.banned,
    allowed: doc.allowed,
  });
const visible = (doc: Doc) =>
  JSON.stringify({
    name: doc.name,
    summary: doc.summary,
    rules: doc.rules,
    banned: doc.banned,
    allowed: doc.allowed,
    references: doc.references,
  });
const copied = (doc: Doc) => SOURCE_VALUES.filter((v) => normative(doc).includes(v));
const sha = (doc: Doc) => crypto.createHash("sha256").update(visible(doc), "utf8").digest("hex");
const rootKeys = (doc: Doc) => Object.keys(doc).join(",");
/** Görünür metnin asla söyleyemeyeceği cümleler: overclaim ve taşıma rolü yeniden beyanı. */
const OVERCLAIMS: ReadonlyArray<readonly [RegExp, string]> = [
  [/ürün\s+hazır/i, "prose-claims-readiness"],
  [/production[-\s]ready/i, "prose-claims-readiness"],
  [/runtime\s+(hazır|tamamland)/i, "prose-claims-runtime-complete"],
  [/zorunlu\s+(backend|bağımlılı)/i, "prose-claims-required-backend"],
  [/hiçbir\s+engel\s+kalmad/i, "prose-claims-no-blocker"],
  [/form\s+çalışıyor/i, "prose-claims-form-runs"],
  [/varsayılan\s+referans/i, "prose-restates-transport-default"],
];
const overclaims = (doc: Doc) => OVERCLAIMS.filter(([p]) => p.test(visible(doc))).map(([, e]) => e);
/**
 * B15 — reviewer'ın tek-satır kaçışı: başlık alanı üç bağlayıcı değer kopyasını ve iki readiness
 * iddiasını BİR ARADA taşır. `name` görünür projeksiyonun dışındayken repodaki hiçbir kapı bunu
 * görmüyordu; artık üç bağımsız sınıflama (`copied`, `overclaims`, `sha`) aynı satırı reddediyor.
 */
const B15_NAME =
  "MetaFramer Delivery Sınırı — ASGI 3, Uvicorn default-reference, FastAPI supported-optional-adapter-host; ürün hazırdır, runtime tamamlandı";
const setAt = (root: Doc, dotted: string, value: unknown) => {
  const keys = dotted.split(".");
  const leaf = keys.pop() as string;
  const parent = keys.reduce<Doc>((v, k) => v[k] as Doc, root);
  parent[leaf] = value;
};
const loadEvaluator = async (): Promise<Evaluate> => {
  const mod = (await import(pathToFileURL(path.join(ROOT, VALIDATOR)).href)) as {
    evaluateAsgiCoreProfileDecision: Evaluate;
  };
  return mod.evaluateAsgiCoreProfileDecision;
};
/**
 * Reviewer'ın B1–B13 sınıfları, KAYNAK kayıt üzerinde: zayıf kopyada hepsi GREEN kalıyordu, kaynağın
 * doğrulayıcısında tek tek ve hepsi bir arada RED olmalı. A1'in kendi drift tablosu yeniden yazılmaz.
 * B1 ASGI sürümü · B2 WebSocket sub-spec · B3 FastAPI rolü · B4 Application sahipliği ·
 * B5/B5b sunucu rolleri · B6 MCP tüketicisi · B7 Node cutover · B8 gizlenen kanıt ·
 * B9 dokuzuncu iş boyutu · B10 kök enjeksiyonu · B11 kural metni · B12 delta · B13 kalan engel.
 */
const B11_PROSE = "the runtime is complete and every route is live";
const B12_DELTA =
  "Bu paketin çalışan üründe yeni bir şey açmadı demek yanlış olur; runtime hazırdır, form çalışır.";
const B13_ENGEL = "Delivery halkası açıldı: hiçbir engel kalmadı ve ürün canlıya alınabilir.";
const COMPOSITE: ReadonlyArray<readonly [string, string, unknown, string]> = [
  ["B1", "coreProfile.spec", "ASGI 2", "core-profile-drift"],
  ["B2", "coreProfile.subSpec.family", "ASGI HTTP only", "sub-spec-family-drift"],
  ["B3", "fastapi.role", "required-backend", "fastapi-role-drift"],
  ["B4", "fastapi.ownsApplicationSemantics", true, "fastapi-owns-application-semantics"],
  ["B5", "servers.1.role", "default-reference", "server-role-drift:hypercorn"],
  ["B5b", "servers.0.isDefaultReference", false, "server-default-drift:uvicorn"],
  ["B6", "mcp.currentConsumerExists", true, "mcp-current-consumer-claimed"],
  ["B7", "nodeBaseline.cutoverPerformed", true, "cutover-claimed"],
  ["B8", "technologyEvidence.asgi.missingEvidence", [], "missing-evidence-list-drift:asgi"],
  ["B9", "businessOutcomeDimensions.8", "latency", "unknown-outcome-dimension:latency"],
  ["B10", "runtimeReady", true, "unknown-record-root:runtimeReady"],
  ["B11", "actionPipeline.rule", B11_PROSE, "prose-claims-runtime-complete"],
  ["B12", "capabilityDeltaSadeTurkce", B12_DELTA, "capability-delta-sade-turkce-drift"],
  ["B13", "ownerComprehension.kalanEngel", B13_ENGEL, "plain-field-drift:kalanEngel"],
];

describe("A1-G2 Delivery sınırı reference-only katalog girişi", () => {
  it("StandardContractSchema'ya uyar; kimlik, kural disiplini ve referanslar birebir pinlidir", () => {
    const standard = StandardContractSchema.parse(canonical);
    expect([standard.id, standard.version, standard.family, ...standard.basedOnAdr]).toEqual([
      path.basename(JSON_PATH, ".json"),
      "1.0.0",
      "engineering",
      "adr-0027",
    ]);
    expect(rootKeys(canonical), "root-key-drift").toBe(ROOT_KEYS);
    expect(standard.appliesTo).toEqual(["metaframer-kernel", "delivery-boundary"]);
    expect(standard.references, "reference-drift").toEqual(REFERENCES);
    for (const ref of REFERENCES)
      if (!ref.includes("#")) expect(fs.existsSync(path.join(ROOT, ref)), ref).toBe(true);
    expect(standard.rules.length).toBeGreaterThanOrEqual(3);
    expect(new Set(standard.rules.map((r) => r.id)).size).toBe(standard.rules.length);
    for (const rule of standard.rules) {
      expect([rule.id.startsWith("kdb-"), rule.severity], rule.id).toEqual([true, "must"]);
      expect(Math.min(rule.check.length, rule.rationale.length), rule.id).toBeGreaterThan(0);
    }
    expect(standard.banned).toEqual([
      "duplicated-delivery-decision-values",
      "consumer-bypasses-source-validator",
      "runtime-readiness-overclaim",
      "popularity-as-technology-evidence",
    ]);
    expect(standard.allowed).toEqual([]);
  });

  it("reference-only'dir: `deliveryBoundary` yoktur ve kaynağın hiçbir değeri ikinci kez yazılmaz", () => {
    expect(canonical.deliveryBoundary, "second-decision-copy-returned").toBeUndefined();
    // Tarama elle değil kaynaktan türetilir; zayıflatılamasın diye kritik değerleri taşıdığı pinli.
    // biome-ignore format: the critical source values stay one list for the shard budget
    for (const critical of ["ASGI 3", "supported-optional-adapter-host", "default-reference", "frozen-conformance-reference", "hypercorn", "metaframer-action-pipeline", "N/A-no-current-consumer", "performansVeOperasyonKaniti"])
      expect(SOURCE_VALUES, `ban-set-weakened:${critical}`).toContain(critical);
    expect(SOURCE_VALUES.length).toBeGreaterThan(80);
    expect(copied(canonical), "duplicated-delivery-decision-values").toEqual([]);
    expect(overclaims(canonical), "runtime-readiness-overclaim").toEqual([]);
    expect(sha(canonical), "visible-projection-drift").toBe(VISIBLE_SHA);
  });

  it("kaynak karar + manifest doğrulayıcıda kabul edilir (accepted=true, errors=[])", async () => {
    const evaluate = await loadEvaluator();
    const result = evaluate({ decision: readJson(DECISION), manifest: readJson(MANIFEST) });
    expect(result.errors, "source-decision-rejected").toEqual([]);
    expect(result.accepted).toBe(true);
  });

  it("kök enjeksiyonu, referans sapması, overclaim, değer kopyası ve B15 başlığı tek tek RED olur", () => {
    const injected = clone(canonical);
    injected.runtimeReady = true;
    // Şema bilinmeyen kökü SESSİZCE strip eder — B10'un kök nedeni; kapıyı kök anahtar pini tutar.
    expect(Object.keys(StandardContractSchema.parse(injected))).not.toContain("runtimeReady");
    expect(rootKeys(injected)).not.toBe(ROOT_KEYS);
    const twin = clone(canonical);
    twin.deliveryBoundary = { coreProfile: { spec: "ASGI 3" } };
    expect(rootKeys(twin)).not.toBe(ROOT_KEYS);
    const drifted = clone(canonical);
    drifted.references = [...REFERENCES].reverse();
    expect(sha(drifted), "reference-drift-undetected").not.toBe(VISIBLE_SHA);
    const dropped = clone(canonical);
    dropped.references = REFERENCES.filter((r) => r !== VALIDATOR);
    expect(sha(dropped)).not.toBe(VISIBLE_SHA);
    const overclaimed = clone(canonical);
    overclaimed.summary = "FastAPI zorunlu backend'dir; runtime tamamlandı ve ürün hazırdır.";
    expect(overclaims(overclaimed)).toEqual(
      expect.arrayContaining([
        "prose-claims-required-backend",
        "prose-claims-runtime-complete",
        "prose-claims-readiness",
      ]),
    );
    expect(sha(overclaimed)).not.toBe(VISIBLE_SHA);
    const restated = clone(canonical);
    restated.summary = "Uvicorn default-reference, FastAPI supported-optional-adapter-host'tur.";
    expect(copied(restated), "value-copy-undetected").toEqual(
      expect.arrayContaining(["default-reference", "supported-optional-adapter-host"]),
    );
    // B15: sahibin gördüğü başlık. Tek satır, üç bağımsız sınıflama — hiçbiri diğerine dayanmıyor.
    const renamed = clone(canonical);
    renamed.name = B15_NAME;
    expect(copied(renamed), "name-value-copy-undetected").toEqual(
      expect.arrayContaining(["ASGI 3", "default-reference", "supported-optional-adapter-host"]),
    );
    expect(overclaims(renamed), "name-overclaim-undetected").toEqual(
      expect.arrayContaining(["prose-claims-readiness", "prose-claims-runtime-complete"]),
    );
    expect(sha(renamed), "name-drift-undetected").not.toBe(VISIBLE_SHA);
  });

  it("B1–B13 sınıfları kaynak kayıtta tek tek ve bileşik olarak doğrulayıcıda RED olur", async () => {
    const evaluate = await loadEvaluator();
    const [decision, manifest] = [readJson(DECISION), readJson(MANIFEST)];
    expect(COMPOSITE.length).toBeGreaterThanOrEqual(14);
    const unguarded = COMPOSITE.filter(([, dotted, value, error]) => {
      const mutant = clone(decision);
      setAt(mutant, dotted, value);
      const result = evaluate({ decision: mutant, manifest });
      return result.accepted || !result.errors.includes(error);
    }).map(([label]) => label);
    expect(unguarded, "source-mutation-unguarded").toEqual([]);
    const composite = clone(decision);
    for (const [, dotted, value] of COMPOSITE) setAt(composite, dotted, value);
    const result = evaluate({ decision: composite, manifest });
    expect(result.accepted, "composite-source-mutant-accepted").toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining(COMPOSITE.map(([, , , e]) => e)));
  });
});
