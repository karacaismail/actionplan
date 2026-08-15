import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A2A2-DOC — Delivery sınırı anlatı standardının TEMEL kontrat kapısı. Anlatı kararın ikinci
 * sahibi DEĞİLDİR: değerlerin sahibi karar kaydı ve doğrulayıcısıdır, doküman sade ANLAMI taşır.
 * Kapı o anlamı, iki indeksin anlatı + kanonik karar/validator zincirine yönlendirmesini ve
 * kritik rol tersine çevirmelerinin RED olmasını denetler. Bu halka TAM adversarial mutation
 * gate DEĞİLDİR ve öyle olduğunu iddia etmez: geniş saldırgan batarya (polarite, olumsuzlama
 * saldırısı, kanıt-boyutu gizleme, meşru-düzenleme süiti) sonraki zincir halkasına `kalanEngel`
 * olarak bırakılmıştır. capability delta = NONE.
 */
const ROOT = process.cwd();
const DOC = "docs/standards/15-kernel-delivery-boundary-standard.md";
const FOLDER_INDEX = "docs/standards/00-standards-index.md";
const HUB_INDEX = "docs/engineering-standards-index.md";
const DECISION = "reports/kernel-asgi-core-profile-decision-2026-08-11.json";
const VALIDATOR = "tools/lib/kernel-asgi-core-profile.mjs";
const ADR_ANCHOR =
  "docs/adr-0027-engineering-standards.md#sahip-anlayışı-ve-teknoloji-kanıtı-sözleşmesi-ap-oc1";
const STANDARD_DIR = "src/data/standards";
const INDEXES = [FOLDER_INDEX, HUB_INDEX];
const REQUIRED_LINKS = [DECISION, VALIDATOR, ADR_ANCHOR];
const CAPABILITY_DELTA = "capability delta = NONE";
const ALLOWED_REFS = new Set(["standardRef", "standardRefs"]);
const FIELDS = ["once", "simdi", "fark", "kullaniciYolculugu", "kalanEngel"];
const JOURNEY = ["CRM", "HRMS", "İK yetkilisi", "Yeni Personel", "Kaydet", "Action Pipeline"];
/** Anlatının taşımak zorunda olduğu sade anlam; bağlayıcı DEĞER kopyası değildir. */
// biome-ignore format: the meaning table packs one obligation per phrase
const MEANINGS: readonly string[] = [
  "Bağlayıcı değerlerin tek kanonik sahibi", "reference-only", "zorunlu ASGI 3 Core Profile",
  "public developer/Delivery sözleşmesi", "zorunlu kernel bağımlılığı değildir",
  "deterministik standart fallback", "dokuz iş sonucu boyutunun tamamı aynı kalır",
  "en dar kapsamda fail-closed", "açık yapılandırma hatası", "Bu doküman testi üretmez",
  "MetaFramer ASGI + Uvicorn", "MetaFramer ASGI + Hypercorn",
  "FastAPI-hosted MetaFramer + Uvicorn", "FastAPI-hosted MetaFramer + Hypercorn",
  CAPABILITY_DELTA, "runtime hazır değildir", "production-ready değildir", "SDK hazır değildir",
  "çalışan endpoint yoktur",
];
/** Rol ataması teknolojinin KENDİ tablo satırında okunur; ad ile rol ayrı yerde durursa belirsizdir. */
// biome-ignore format: the role table stays one row per technology
const ROLES: ReadonlyArray<readonly [string, RegExp]> = [
  ["MetaFramer", /Core Profile ve sözleşme sahibi/i],
  ["Uvicorn", /varsayılan referans/i],
  ["Hypercorn", /desteklenen bağımsız uyumluluk alternatifi/i],
  ["FastAPI", /isteğe bağlı Delivery adaptör konağı/i],
];
/** Application/Domain'in sahiplendiği yedi port; taşıma satırı aynı yediyi reddetmek zorundadır. */
// biome-ignore format: the owned port table stays one row per Application/Domain port
const OWNED_PORTS: ReadonlyArray<RegExp> = [
  /yetki|auth/i, /tenant/i, /iş karar/i, /transaction/i, /veritabanı|DB\b/i, /outbox/i, /audit/i,
];
/** Taşıma yedi portun HİÇBİRİNİN karar sahibi değildir; fiil zorunlu, port SAYAN meşru satır GREEN kalır. */
const TRANSPORT_OWNS_PORT =
  /(FastAPI|Uvicorn|Hypercorn|Sunucu|Çerçeve|Taşıma katmanı)[^\n]{0,80}(yetkilendirme|yetki|auth|tenant|iş|transaction|veritabanı(na)?\s+yazma|veritabanı|outbox|audit)\s*karar(ını|ini|ı|i)?\s*(verir|belirler|sahiplenir|üstlenir|alır)/i;
/** Anlatının asla söyleyemeyeceği cümleler: rol tersine çevirme ve hazırlık iddiası. */
// biome-ignore format: the forbidden claim table stays one row per violation class
const FORBIDDEN: ReadonlyArray<readonly [RegExp, string]> = [
  [/FastAPI\s+zorunludur|zorunlu\s+kernel\s+bağımlılığıdır/i, "fastapi-zorunlu-anlatiliyor"],
  [TRANSPORT_OWNS_PORT, "tasima-katmani-is-karari-veriyor"],
  // Dürüst "hazır DEĞİL" cümleleri GREEN kalır; yalnız iddia formu RED olur.
  [/runtime\s+hazır(?!["'`*\s]*değil)/i, "runtime-hazir-overclaim"],
  [/production[-\s]?ready(?!["'`*\s]*(değil|olmad))/i, "production-ready-overclaim"],
  [/SDK['’]?\s*(hazırdır|tamamland|yayınland)/i, "sdk-hazir-overclaim"],
  [/(endpoint|API)\s*(hazırdır|canlıdır|yayındadır|çalışmaktadır)/i, "endpoint-hazir-overclaim"],
  [/form\s+çalışıyor/i, "calisan-form-overclaim"],
];
/** Dört kombinasyon PLANDIR: tamamlanmış test veya readiness iddiası RED olur. */
// biome-ignore format: the completed-claim alternation stays one line
const COMPLETED_CLAIM = /(test edildi|testten geçti|başarıyla geçti|uyumlu olduğu (kanıtlandı|doğrulandı)|kanıtlandı|doğrulanmıştır)/i;

type Sources = { doc: string; indexes: Record<string, string> };
const exists = (relative: string) => fs.existsSync(path.join(ROOT, relative));
const read = (relative: string): string =>
  exists(relative) ? fs.readFileSync(path.join(ROOT, relative), "utf8") : "";
/** R2-1 regresyonu: Markdown hizalaması (`|  Uvicorn  |`) anlamı değiştirmez, hücre bazlı okunur. */
// biome-ignore format: the cell reader stays one chained expression
const cells = (row: string) => row.split("|").map((c) => c.trim()).filter((c) => c !== "");
// biome-ignore format: the row lookup stays one chained expression
const roleRow = (doc: string, tech: string): string[] =>
  doc.split("\n").map(cells).find((row) => row.length >= 4 && row[0] === tech) ?? [];
/** Bir başlıktan bir sonraki `##` başlığına kadar olan bölüm. */
const sectionOf = (text: string, heading: string): string => {
  const at = text.indexOf(heading);
  return at < 0 ? "" : text.slice(at + heading.length).split(/\n(?=#{2}\s)/)[0];
};
const refSection = (text: string): string => {
  const heading = text.split("\n").find((line) => /^##\s.*Reference-only/i.test(line)) ?? "";
  return heading === "" ? "" : sectionOf(text, heading);
};
/** Backtick içindeki her repo yolu gerçek dosyaya çözülmeli; çapa (#...) çözümlemeden düşer. */
// biome-ignore format: the link resolver stays one chained expression
const unresolved = (text: string, label: string) =>
  [...text.matchAll(/`([^`\n]+)`/g)]
    .map((match) => match[1].split("#")[0])
    .filter((token) => /^(docs|src|tests|tools|reports)\//.test(token) && !exists(token))
    .map((file) => `kanonik-kaynak-linki-cozulmuyor:${label}:${file}`);

const auditDoc = (doc: string): string[] => {
  if (doc.trim() === "") return ["anlati-standardi-yok"];
  const found: string[] = [];
  const lines = doc.split("\n");
  const carriesAll = (text: string) => OWNED_PORTS.every((matcher) => matcher.test(text));
  for (const phrase of MEANINGS) if (!doc.includes(phrase)) found.push(`sade-anlam-yok:${phrase}`);
  for (const [tech, role] of ROLES) {
    const row = roleRow(doc, tech);
    if (row.length === 0) found.push(`rol-satiri-yok:${tech}`);
    else if (!role.test(row[1])) found.push(`tasiyici-rolu-belirsiz:${tech}`);
  }
  if (!lines.some((line) => /MetaFramer\s+Application\/Domain/i.test(line) && carriesAll(line)))
    found.push("metaframer-yedi-port-sahipligi-yok");
  const uvicorn = roleRow(doc, "Uvicorn");
  if (uvicorn.length >= 4 && !carriesAll(uvicorn[uvicorn.length - 1]))
    found.push("tasima-sahiplenmedigi-portlar-eksik:uvicorn");
  for (const token of JOURNEY)
    if (!doc.includes(token)) found.push(`crm-hrms-form-yolculugu-yok:${token}`);
  for (const field of FIELDS) {
    const row = lines.find((line) => line.includes(`\`${field}\``));
    if (!row) found.push(`bes-alan-yok:${field}`);
    else if (row.length < 120) found.push(`bes-alan-bos:${field}`);
  }
  for (const ref of REQUIRED_LINKS)
    if (!doc.includes(ref)) found.push(`kanonik-kaynak-referansi-yok:${ref}`);
  if (COMPLETED_CLAIM.test(sectionOf(doc, "## 5. Dört kombinasyon")))
    found.push("dort-kombinasyon-tamamlandi-iddiasi");
  for (const [pattern, id] of FORBIDDEN) if (pattern.test(doc)) found.push(`${id}:${DOC}`);
  return [...found, ...unresolved(doc, DOC)];
};

const auditIndex = (relative: string, text: string): string[] => {
  const found: string[] = [];
  const rows = text.split("\n").filter((line) => line.includes(DOC));
  if (rows.length === 0) found.push(`indeks-anlatiya-yonlendirmiyor:${relative}`);
  if (!rows.some((line) => /reference-only/i.test(line)))
    found.push(`indeks-reference-only-siniflandirmasi-yok:${relative}`);
  for (const ref of [DECISION, VALIDATOR])
    if (!text.includes(ref)) found.push(`indeks-karar-zincirine-yonlendirmiyor:${relative}:${ref}`);
  if (!text.includes(CAPABILITY_DELTA)) found.push(`indeks-capability-delta-yok:${relative}`);
  // Denetim yüzeyi tek satır değil, reference-only ek BÖLÜMÜNÜN tamamıdır.
  const section = refSection(text);
  if (section === "") return [...found, `indeks-reference-only-bolumu-yok:${relative}`];
  // Düğüm `standardRef`'i YOKTUR: uydurulmuş bir anahtar bağlanabilirlik izlenimi verir.
  for (const token of section.match(/\b[a-z][A-Za-z0-9]*Ref\b/g) ?? [])
    if (!ALLOWED_REFS.has(token)) found.push(`indeks-uydurma-standardref:${relative}:${token}`);
  for (const [pattern, id] of FORBIDDEN) if (pattern.test(section)) found.push(`${id}:${relative}`);
  return [...found, ...unresolved(section, relative)];
};

/** Güncel toplam beyanı CANLI dosya sayısından türetilir; tarihsel sayılar "current" sunulamaz. */
const auditCount = (text: string): string[] => {
  const files = fs.readdirSync(path.join(ROOT, STANDARD_DIR)).filter((f) => f.endsWith(".json"));
  const declared = text.match(/Güncel makine-sözleşmesi sayısı \(canlı\):\*\* (\d+)/)?.[1];
  if (!declared) return ["guncel-sozlesme-sayisi-beyani-yok"];
  return Number(declared) === files.length ? [] : [`guncel-sayi-canli-degil:${declared}`];
};

// biome-ignore format: the audit fan-in and live loader stay compact
const audit = (s: Sources): string[] => [...new Set([...auditDoc(s.doc),
  ...INDEXES.flatMap((i) => auditIndex(i, s.indexes[i] ?? "")),
  ...auditCount(s.indexes[FOLDER_INDEX] ?? "")])];
// biome-ignore format: the live loader stays one expression
const live = (): Sources =>
  ({ doc: read(DOC), indexes: Object.fromEntries(INDEXES.map((i) => [i, read(i)])) });
/** Fixture'lar diske değil BELLEKTEKİ geçici kopyaya uygulanır; canlı dosyalar hiç değişmez. */
const withDoc = (sources: Sources, doc: string): Sources => ({ ...sources, doc });
const swap = (text: string, from: string, to: string) => text.split(from).join(to);

describe("A2A2-DOC Delivery sınırı anlatı standardı ve indeks entegrasyonu", () => {
  it("anlatı, iki indeks, roller, sınırlar, beş alan ve kanonik zincir eksiksizdir", () => {
    const findings = audit(live());
    expect(findings, `delivery-boundary-documentation-gap:\n${findings.join("\n")}`).toEqual([]);
  });

  it("R2-1: rol tablosu Markdown hizalama varyasyonuyla okunur, yanlış pozitif üretmez", () => {
    const sources = live();
    const padded = sources.doc
      .split("\n")
      .map((line) => (line.startsWith("| Uvicorn |") ? line.replace(/\|\s*/g, "|  ") : line))
      .join("\n");
    expect(padded, "hizalama-varyasyonu-uygulanamadi").not.toBe(sources.doc);
    expect(auditDoc(padded), "r2-1-yanlis-pozitif").toEqual(auditDoc(sources.doc));
  });

  it("kritik rol tersine çevirmesi bellekteki kopyada adıyla RED olur", () => {
    const s = live();
    // biome-ignore format: the negative fixture table stays one row per reversal
    const fixtures: ReadonlyArray<readonly [string, Sources, string]> = [
      ["fastapi-zorunlu-yapildi", withDoc(s, swap(s.doc, "zorunlu kernel bağımlılığı değildir", "zorunlu kernel bağımlılığıdır")), `fastapi-zorunlu-anlatiliyor:${DOC}`],
      ["tasima-is-karari-sahibi-yapildi", withDoc(s, `${s.doc}\nUvicorn audit kararını verir.\n`), `tasima-katmani-is-karari-veriyor:${DOC}`],
      ["metaframer-sahiplik-cumlesi-silindi", withDoc(s, swap(s.doc, "outbox ve audit MetaFramer Application/Domain", "outbox ve audit taşıma")), "metaframer-yedi-port-sahipligi-yok"],
    ];
    const escaped = fixtures
      .filter(([, mutated, expected]) => !audit(mutated).includes(expected))
      .map(([label, , expected]) => `${label} => ${expected}`);
    expect(escaped, `fixture-unguarded:\n${escaped.join("\n")}`).toEqual([]);
  });
});
