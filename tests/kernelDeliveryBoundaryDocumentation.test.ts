import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A2A2-DOC — Delivery sınırı anlatı standardının kontrat kapısı (H1 · GAP-1 · R2–R8).
 * Anlatı kararın ikinci sahibi DEĞİLDİR: bağlayıcı değerlerin sahibi karar kaydı ve doğrulayıcısıdır.
 *
 * Yürürlükteki bağlayıcı korumalar (halka tarihçesi değil, bugünkü iddia):
 * - Sınıflandırma TEKİL tablo satırının SINIF/ROL hücresinde okunur; üste/alta konan ya da CR ile
 *   yapıştırılan yem satır gerçek satırı gölgeleyemez, 0/>1 satırda kapı fail-closed durur.
 * - Denetim yüzeyi TEKİL gerçek `## ... Reference-only` bölümüdür; 0/>1 bölümde fail-closed. Bölüm
 *   DIŞI meşru tablo yanlış RED üretmez, bölüm dışı yem ne hücreyi besler ne gerçek satırı gölgeler.
 * - Altı çekirdek polarite yerinde tersine çevirmeye ve BİTİŞİK (önceki/sonraki) paragraf
 *   olumsuzlamasına karşı korunur; sınıflandırma GEREKÇESİ (GAP-1) readiness overclaim'ine ve
 *   bağlayıcı değer sızıntısına kapalıdır; dört kombinasyon PLANDIR, tamamlanma iddiası RED.
 * - Vaka bütçeleri ALT SINIR değil TAM sayıdır; her mutant en az bir BEKLENEN bulgu kimliği taşır;
 *   iddiasız, inert veya etiketi tekrarlayan vaka boşuna geçemez.
 * - TOP-LEVEL blok yapısı CommonMark sınırındadır ve TEK yerden okunur: satır modeli `linesOf`
 *   (CRLF/CR/LF) · fence DURUMU `fenced` · başlık yüklemi `ATX_H2`; `refSection` ile doküman içi
 *   `sectionOf` AYNI `h2Map` yolundan geçer, kapıda üç çelişkili H2 tanıyıcı yoktur. Kuralların
 *   tamamı `EOL_CASES` (3), `FENCE_CASES` (11), `CLOSER_CASES` (8), `ATX_CASES` (19) ile pinlidir.
 *
 * R8 iki KANITLANMIŞ false GREEN'i kapatır. F-2: bölme `split("\n")` idi, oysa CommonMark CR'ı da
 * satır sonu sayar; ham CR ile yapıştırılan İKİNCİ `## ... Reference-only` bölümü ve İKİNCİ DOC
 * tablo satırı render'da görünürken kapıya tek satır geliyor, gerçek satırın `tam standart`a
 * bozulması gizleniyordu (iki canlı indekste `audit()===[]`). F-1: doküman içi kesici kolon-0 `##` +
 * GENİŞ `\s` okuyordu; `##`+NBSP/em-space/form-feed/vertical-tab sahte bitiricisi "Dört kombinasyon"
 * bölümünü ERKEN kesip arkasındaki tamamlanma iddiasını denetim DIŞINDA bırakıyordu.
 *
 * Bu halka TAM adversarial mutation gate DEĞİLDİR ve öyle olduğunu iddia etmez. Bilinen ve kabul
 * edilen kalanlar: yedi teknoloji kanıt boyutunun içerik denetimi, readiness/tamamlanma ve
 * olumsuzlama sözlüklerinin tamamı, bitişik olmayan olumsuzlama, tire'siz doğal dil değer parafrazı,
 * `codeOnly` SHA pini ve blok modelinin TOP-LEVEL kapsamı (Setext başlık, liste/alıntı container'ı
 * içindeki göreli girinti, HTML bloğu ve link-referans tanımı modellenmez; pinli değildir ve yönleri
 * kanıtlanmamıştır). Doğal dil tavanı açık. capability delta = NONE.
 */
const ROOT = process.cwd();
const DOC = "docs/standards/15-kernel-delivery-boundary-standard.md";
const FOLDER_INDEX = "docs/standards/00-standards-index.md";
const HUB_INDEX = "docs/engineering-standards-index.md";
const DECISION = "reports/kernel-asgi-core-profile-decision-2026-08-11.json";
const VALIDATOR = "tools/lib/kernel-asgi-core-profile.mjs";
const CLASSIFICATION = "src/data/doc-task-content-classification.json";
const ADR_ANCHOR =
  "docs/adr-0027-engineering-standards.md#sahip-anlayışı-ve-teknoloji-kanıtı-sözleşmesi-ap-oc1";
const STANDARD_DIR = "src/data/standards";
const INDEXES = [FOLDER_INDEX, HUB_INDEX];
const REQUIRED_LINKS = [DECISION, VALIDATOR, ADR_ANCHOR];
const CAPABILITY_DELTA = "capability delta = NONE";
const ALLOWED_REFS = new Set(["standardRef", "standardRefs"]);
const FIELDS = ["once", "simdi", "fark", "kullaniciYolculugu", "kalanEngel"];
const JOURNEY = ["CRM", "HRMS", "İK yetkilisi", "Yeni Personel", "Kaydet", "Action Pipeline"];
/** Kaynakta literal görünmez karakter YOKTUR: hepsi sayısal escape'tir, aksi hâlde fixture yazım
 *  yolunda U+0020'ye normalize olur ve saldırı vakası sessizce etkisizleşir. */
// biome-ignore format: the invisible codepoint table stays one row for the whole set
const [NBSP, EM_SPACE, FORM_FEED, VTAB, CR] = ["\u00A0", "\u2003", "\u000C", "\u000B", "\u000D"];
// biome-ignore format: the ASCII whitespace table stays one row per CommonMark-legal shape
const [SP1, SP2, SP3, SP4, TAB, CRLF] = [" ", "  ", "   ", "    ", "\t", `${"\u000D"}\n`];
/** Anlatının taşımak zorunda olduğu sade anlam; bağlayıcı DEĞER kopyası değildir. */
// biome-ignore format: the meaning table packs several obligations per row
const MEANINGS: readonly string[] = [
  "Bağlayıcı değerlerin tek kanonik sahibi", "reference-only", "zorunlu ASGI 3 Core Profile",
  "public developer/Delivery sözleşmesi", "zorunlu kernel bağımlılığı değildir",
  "deterministik standart fallback", "dokuz iş sonucu boyutunun tamamı aynı kalır",
  "en dar kapsamda fail-closed", "açık yapılandırma hatası", "Bu doküman testi üretmez",
  "MetaFramer ASGI + Uvicorn", "MetaFramer ASGI + Hypercorn", "FastAPI-hosted MetaFramer + Uvicorn",
  "FastAPI-hosted MetaFramer + Hypercorn", CAPABILITY_DELTA, "runtime hazır değildir",
  "production-ready değildir", "SDK hazır değildir", "çalışan endpoint yoktur",
];
/** Rol ataması teknolojinin KENDİ tablo satırında okunur; ad ile rol ayrı yerde durursa belirsizdir. */
// biome-ignore format: the role table stays one row per technology
const ROLES: ReadonlyArray<readonly [string, RegExp]> = [
  ["MetaFramer", /Core Profile ve sözleşme sahibi/i], ["Uvicorn", /varsayılan referans/i],
  ["Hypercorn", /desteklenen bağımsız uyumluluk alternatifi/i],
  ["FastAPI", /isteğe bağlı Delivery adaptör konağı/i],
];
/** Application/Domain'in sahiplendiği yedi port; taşıma satırı aynı yediyi reddetmek zorundadır. */
// biome-ignore format: the owned port table stays one row per Application/Domain port
const OWNED_PORTS: ReadonlyArray<RegExp> = [
  /yetki|auth/i, /tenant/i, /iş karar/i, /transaction/i, /veritabanı|DB\b/i, /outbox/i, /audit/i,
];
/** Taşıma yedi portun HİÇBİRİNİN karar sahibi değildir; port SAYAN meşru satır GREEN kalır. */
const TRANSPORT_OWNS_PORT =
  /(FastAPI|Uvicorn|Hypercorn|Sunucu|Çerçeve|Taşıma katmanı)[^\n]{0,80}(yetkilendirme|yetki|auth|tenant|iş|transaction|veritabanı(na)?\s+yazma|veritabanı|outbox|audit)\s*karar(ını|ini|ı|i)?\s*(verir|belirler|sahiplenir|üstlenir|alır)/i;
/** Anlatının asla söyleyemeyeceği cümleler. Dürüst "hazır DEĞİL" GREEN kalır; iddia formu RED. */
// biome-ignore format: the forbidden claim table stays one row per violation class
const FORBIDDEN: ReadonlyArray<readonly [RegExp, string]> = [
  [/FastAPI\s+zorunludur|zorunlu\s+kernel\s+bağımlılığıdır/i, "fastapi-zorunlu-anlatiliyor"],
  [TRANSPORT_OWNS_PORT, "tasima-katmani-is-karari-veriyor"],
  [/runtime\s+hazır(?!["'`*\s]*değil)/i, "runtime-hazir-overclaim"],
  [/production[-\s]?ready(?!["'`*\s]*(değil|olmad))/i, "production-ready-overclaim"],
  [/SDK['’]?\s*(hazırdır|tamamland|yayınland)/i, "sdk-hazir-overclaim"],
  [/(endpoint|API)\s*(hazırdır|canlıdır|yayındadır|çalışmaktadır)/i, "endpoint-hazir-overclaim"],
  [/form\s+çalışıyor/i, "calisan-form-overclaim"],
];
/** Dört kombinasyon PLANDIR: tamamlanma iddiası RED. Sözlük DAR; tam eşanlamlı süpürme H2'dedir. */
// biome-ignore format: the completed-claim alternation stays one line
const COMPLETED_CLAIM = /(test edildi|testten geçti|başarıyla geçti|uyumlu olduğu (kanıtlandı|doğrulandı)|kanıtlandı|doğrulanmıştır|gösterilmiştir|tamamlan(dı|mıştır)|geçmiştir)/i;
/** H1 — `reference-only` bu SINIF/ROL sütununda durmalı; başka hücredeki geçiş sayılmaz. */
const CLASS_HEADER = /^(sınıf|rol[uü])$/i;
/** H1 — altı çekirdek polarite: çapa satırı bulunur ve YÖNÜ denetlenir; token saymak yetmez. */
// biome-ignore format: the polarity table stays one row per directional promise
const POLARITY: ReadonlyArray<readonly [string, string, RegExp, RegExp]> = [
  ["sunucu-degisimi", "Sunucu değişince iş sonucu", /değişmez/i, /değiş(ir|ebilir|ecek)/i],
  ["fastapi-opsiyonel", "zorunlu kernel bağımlılığı", /değildir/i, /(bağımlılığıdır|zorunludur)/i],
  ["ikinci-sahip-degil", "Kararın ikinci sahibi", /ikinci sahibi değildir/i, /ikinci sahibi(dir| olur)/i],
  ["dokuz-boyut-esitligi", "dokuz iş sonucu boyut", /tamamı aynı kalır/i, /(farklılaş|aynı kalmayabilir|değişebilir)/i],
  ["rastgele-red", "rastgele kullanıcı isteği", /reddedilmez/i, /reddedil(ir|ebilir)/i],
  ["baslangicta-fail-closed", "en dar kapsamda fail-closed", /başlangıçta/i, /(açık kalır|en geniş kapsamda)/i],
];
/** H1 — doğru cümleyi bırakıp yanına iptal cümlesi eklemek de ihlaldir. Sözlük DAR; tamamı H2'de. */
const NEGATION =
  /(artık\s+geçerli\s+değil|yanlıştır|artık\s+uygulan(maz|mıyor)|bağlayıcı\s+değildir|hükümsüz|iptal\s+edilmiştir)/i;
/** Korunan çekirdek sözler; blok penceresi SİMETRİK: önceki + kendi + sonraki paragraf. */
// biome-ignore format: the protected-promise table stays one row per core sentence
const PROTECTED: ReadonlyArray<readonly [string, string]> = [
  ["sunucu-degisimi", "Sunucu değişince iş sonucu değişmez"],
  ["fastapi-opsiyonel", "zorunlu kernel bağımlılığı değildir"],
  ["ikinci-sahip-degil", "Kararın ikinci sahibi değildir"],
  ["dort-kombinasyon", "ayrı bir pakette test edilecektir"],
  ["fallback-esitligi", "dokuz iş sonucu boyutunun tamamı aynı kalır"],
  ["fail-closed", "en dar kapsamda fail-closed"],
];
/** GAP-1 — gerekçe readiness iddia edemez ve bağlayıcı DEĞERİ ikinci kez yazamaz. Token seti DARdır
 *  ve her token'ın kaynakta geçtiği ayrıca doğrulanır: liste dekoratif olamaz. */
// biome-ignore format: the leaked-value table stays one binding decision token per entry
const LEAK_TOKENS: readonly string[] = [
  "default-reference", "supported-optional-adapter-host", "frozen-conformance-reference",
  "N/A-no-current-consumer", "metaframer-action-pipeline",
];
const RATIONALE_READINESS =
  /(runtime\s+hazır(?!["'`*\s]*değil)|ürün\s+hazır(?!["'`*\s]*değil)|production[-\s]?ready(?!["'`*\s]*(değil|olmad))|hiçbir\s+engel\s+kalmad|çalışan\s+form)/i;

type Entry = { docPath?: string; decision?: string; rationale?: string };
type Sources = { doc: string; indexes: Record<string, string>; classification: string };
const exists = (relative: string) => fs.existsSync(path.join(ROOT, relative));
const read = (relative: string): string =>
  exists(relative) ? fs.readFileSync(path.join(ROOT, relative), "utf8") : "";
/** R8/F-2 — TEK kanonik satır modeli (CRLF/CR/LF); kapının HER top-level yolu satırını buradan alır. */
const linesOf = (text: string): string[] => text.split(/\r\n|\r|\n/);
const canon = (text: string): string => linesOf(text).join("\n");
/** R2-1 regresyonu: Markdown hizalaması (`|  Uvicorn  |`) anlamı değiştirmez, hücre bazlı okunur. */
// biome-ignore format: the cell and row readers stay one chained expression each
const cells = (row: string) => row.split("|").map((c) => c.trim()).filter((c) => c !== "");
// biome-ignore format: the row lookup stays one chained expression
const roleRow = (doc: string, tech: string): string[] =>
  linesOf(doc).map(cells).find((row) => row.length >= 4 && row[0] === tech) ?? [];
const isRow = (line: string) => line.trimStart().startsWith("|");
const isDivider = (line: string) => /^\s*\|[\s:|-]+\|\s*$/.test(line);
const isDocRow = (line: string) => isRow(line) && line.includes(DOC);
/** Bir satırın KENDİ tablosunun başlığı: yukarı yürünür, ayırıcının üstündeki satır başlıktır. */
const headerCells = (lines: string[], at: number): string[] => {
  for (let i = at - 1; i >= 0 && isRow(lines[i]); i -= 1)
    if (isDivider(lines[i])) return cells(lines[i - 1] ?? "");
  return [];
};
/** R5/R7 — fence TOGGLE değil taşınan DURUMDUR. Açıcı: 0-3 boşluk + ≥3 AYNI ` veya ~; backtick
 *  açıcının info string'i backtick TAŞIYAMAZ. Kapatıcı: AYNI karakter, KISA OLMAYAN uzunluk, kalanı
 *  yalnız ASCII boşluk/sekme. Kapanmayan fence EOF'a dek sürer: yön fail-closed. Kapsam TOP-LEVEL. */
const OPENER = /^ {0,3}(`{3,}|~{3,})(.*)$/;
const ASCII_WS = /^[ \t]*$/;
const fenced = (lines: string[]): boolean[] => {
  let open: { char: string; size: number } | null = null;
  return lines.map((line) => {
    const match = OPENER.exec(line);
    const [char, size, rest] = match ? [match[1][0], match[1].length, match[2]] : ["", 0, ""];
    if (open === null) {
      if (match && !(char === "`" && rest.includes("`"))) open = { char, size };
      return open !== null;
    }
    if (match && char === open.char && size >= open.size && ASCII_WS.test(rest)) open = null;
    return true;
  });
};
/** R6/R7 — TOP-LEVEL ATX H2: 0-3 ASCII boşluk girinti (4 boşluk ve sekme KOD girintisidir), `#`
 *  dizisini yalnız U+0020/U+0009 veya satır sonu izler, `##` tek başına BOŞ H2. Eski `\s` yüklemi
 *  NBSP/em-space/form-feed/vtab'ı da ayırıcı sayıyordu. Yön değil PROFİL pinlidir. */
const ATX_H2 = /^ {0,3}#{2}(?=[ \t]|$)/;
const REF_ONLY = /Reference-only/i;
/** Kapının TEK H2 sınırı: satır modeli + fence maskesi + `ATX_H2` burada birleşir (R8/F-1). */
const h2Map = (text: string): [string[], boolean[]] => {
  const lines = linesOf(text);
  const code = fenced(lines);
  return [lines, lines.map((line, i) => !code[i] && ATX_H2.test(line))];
};
const until = (head: boolean[], from: number): number => {
  const end = head.findIndex((is, i) => i > from && is);
  return end < 0 ? head.length : end;
};
/** Denetim yüzeyi TEKİL gerçek reference-only bölümüdür; 0/>1 başlıkta fail-closed, içerik HAM. */
const refSection = (text: string): [number, string] => {
  const [lines, head] = h2Map(text);
  const at = lines.map((_, i) => i).filter((i) => head[i] && REF_ONLY.test(lines[i]));
  if (at.length !== 1) return [at.length, ""];
  return [1, lines.slice(at[0] + 1, until(head, at[0])).join("\n")];
};
/** Bir GERÇEK H2'den sonrakine kadarki bölüm; çapa gerçek H2 değilse boştur ve çağıran RED üretir. */
const sectionOf = (text: string, heading: string): string => {
  const [lines, head] = h2Map(text);
  const at = lines.findIndex((line, i) => head[i] && line.includes(heading));
  return at < 0 ? "" : lines.slice(at, until(head, at)).join("\n");
};
/** Olumsuzlama yüzeyi SİMETRİKTİR: önceki + kendi + sonraki paragraf (tek yön yukarıyı kaçırırdı). */
const blockWindow = (text: string, phrase: string): string => {
  const blocks = canon(text).split(/\n[ \t]*\n/);
  const at = blocks.findIndex((block) => block.includes(phrase));
  return at < 0 ? "" : blocks.slice(Math.max(0, at - 1), at + 2).join("\n\n");
};
/** Backtick içindeki her repo yolu gerçek dosyaya çözülmeli; çapa (#...) çözümlemeden düşer. */
// biome-ignore format: the link resolver stays one chained expression
const unresolved = (text: string, label: string) =>
  [...canon(text).matchAll(/`([^`\n]+)`/g)]
    .map((match) => match[1].split("#")[0])
    .filter((token) => /^(docs|src|tests|tools|reports)\//.test(token) && !exists(token))
    .map((file) => `kanonik-kaynak-linki-cozulmuyor:${label}:${file}`);

/** H1 — çapa satırının yönü ve korunan cümlenin blok penceresindeki iptal saldırısı. */
const auditPolarity = (doc: string): string[] => {
  const lines = linesOf(doc);
  const found: string[] = [];
  for (const [id, anchor, required, violation] of POLARITY) {
    const rows = lines.filter((line) => line.includes(anchor));
    if (rows.length === 0) found.push(`polarite-cumlesi-yok:${id}`);
    else if (rows.some((r) => violation.test(r))) found.push(`polarite-tersine-cevrildi:${id}`);
    else if (!rows.some((r) => required.test(r))) found.push(`polarite-bozuldu:${id}`);
  }
  for (const [id, phrase] of PROTECTED) {
    const window = blockWindow(doc, phrase);
    if (window === "") found.push(`korunan-cumle-yok:${id}`);
    else if (NEGATION.test(window)) found.push(`olumsuzlama-saldirisi:${id}`);
  }
  return found;
};

/** Dört kombinasyon PLANDIR: gelecek beyanı zorunlu, tamamlanma iddiası yasaktır. */
const auditCombinations = (doc: string): string[] => {
  const section = sectionOf(doc, "## 5. Dört kombinasyon");
  if (section === "") return ["dort-kombinasyon-bolumu-yok"];
  const found: string[] = [];
  if (!/(test edilecek|daha sonra|planlan)/i.test(section))
    found.push("dort-kombinasyon-gelecek-beyani-yok");
  if (!section.includes("Bu doküman testi üretmez")) found.push("dort-kombinasyon-plan-beyani-yok");
  if (COMPLETED_CLAIM.test(section)) found.push("dort-kombinasyon-tamamlandi-iddiasi");
  return found;
};

/** GAP-1 — sınıflandırma kaydının gerekçesi: readiness overclaim + bağlayıcı değer sızıntısı. */
const auditRationale = (raw: string): string[] => {
  const entries = (raw.trim() === "" ? [] : JSON.parse(raw)) as Entry[];
  const entry = entries.find((e) => e.docPath === DOC);
  if (!entry) return [`siniflandirma-kaydi-yok:${DOC}`];
  const found: string[] = [];
  if (entry.decision !== "reference-only")
    found.push(`siniflandirma-karari-reference-only-degil:${entry.decision}`);
  const rationale = entry.rationale ?? "";
  if (rationale.trim() === "") return [...found, "siniflandirma-gerekcesi-yok"];
  if (RATIONALE_READINESS.test(rationale))
    found.push("siniflandirma-gerekcesi-readiness-overclaim");
  for (const token of LEAK_TOKENS)
    if (rationale.includes(token))
      found.push(`siniflandirma-gerekcesi-baglayici-deger-sizintisi:${token}`);
  return found;
};

const auditDoc = (doc: string): string[] => {
  if (doc.trim() === "") return ["anlati-standardi-yok"];
  const found: string[] = [];
  const lines = linesOf(doc);
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
  found.push(...auditCombinations(doc), ...auditPolarity(doc));
  for (const [pattern, id] of FORBIDDEN) if (pattern.test(doc)) found.push(`${id}:${DOC}`);
  return [...found, ...unresolved(doc, DOC)];
};

/** H1/F1: sınıflandırma SINIF/ROL hücresinde okunur; hücreyi yalnız TEKİL tablo satırı besler ve
 *  tekillik kanonik sahip bölümde çözülür. Tablo DIŞI DOC anması satır sayılmaz. */
const auditClassRow = (relative: string, section: string): string[] => {
  const lines = linesOf(section);
  const at = lines.map((_, i) => i).filter((i) => isDocRow(lines[i]));
  if (at.length !== 1) return [`indeks-anlati-satiri-tekil-degil:${relative}:${at.length}`];
  const column = headerCells(lines, at[0]).findIndex((cell) => CLASS_HEADER.test(cell));
  if (column < 0) return [`indeks-sinif-sutunu-yok:${relative}`];
  return /reference-only/i.test(cells(lines[at[0]])[column] ?? "")
    ? []
    : [`indeks-reference-only-sinif-hucresinde-degil:${relative}`];
};

const auditIndex = (relative: string, text: string): string[] => {
  const found: string[] = [];
  const rows = linesOf(text).filter((line) => line.includes(DOC));
  if (rows.length === 0) found.push(`indeks-anlatiya-yonlendirmiyor:${relative}`);
  if (!rows.some((line) => /reference-only/i.test(line)))
    found.push(`indeks-reference-only-siniflandirmasi-yok:${relative}`);
  for (const ref of [DECISION, VALIDATOR])
    if (!text.includes(ref)) found.push(`indeks-karar-zincirine-yonlendirmiyor:${relative}:${ref}`);
  if (!text.includes(CAPABILITY_DELTA)) found.push(`indeks-capability-delta-yok:${relative}`);
  // Denetim yüzeyi tek satır değil, TEKİL gerçek reference-only BÖLÜMÜNÜN tamamıdır.
  const [heads, section] = refSection(text);
  if (heads !== 1)
    return [...found, `indeks-reference-only-bolumu-tekil-degil:${relative}:${heads}`];
  found.push(...auditClassRow(relative, section));
  // Düğüm `standardRef`'i YOKTUR: uydurulmuş bir anahtar bağlanabilirlik izlenimi verir.
  for (const token of section.match(/\b[a-z][A-Za-z0-9]*Ref\b/g) ?? [])
    if (!ALLOWED_REFS.has(token)) found.push(`indeks-uydurma-standardref:${relative}:${token}`);
  if (NEGATION.test(section)) found.push(`indeks-olumsuzlama-saldirisi:${relative}`);
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

/** Denetim girişi satır modelini TEK yerde kanonikleştirir: hiçbir alt yol `split("\n")`'e düşemez. */
// biome-ignore format: the audit fan-in stays compact
const audit = (raw: Sources): string[] => {
  const doc = canon(raw.doc);
  const idx = Object.fromEntries(INDEXES.map((i) => [i, canon(raw.indexes[i] ?? "")]));
  return [...new Set([...auditDoc(doc), ...INDEXES.flatMap((i) => auditIndex(i, idx[i])),
    ...auditCount(idx[FOLDER_INDEX]), ...auditRationale(raw.classification)])];
};
// biome-ignore format: the live loader stays one expression
const live = (): Sources => ({ doc: read(DOC), classification: read(CLASSIFICATION),
  indexes: Object.fromEntries(INDEXES.map((i) => [i, read(i)])) });
/** Kaynağın gerçekten sahiplendiği metinler; `LEAK_TOKENS` bunlardan türetilerek doğrulanır. */
// biome-ignore format: the string walker stays one expression
const walkStrings = (node: unknown): string[] =>
  typeof node === "string" ? [node]
  : Array.isArray(node) ? node.flatMap(walkStrings)
  : node && typeof node === "object" ? Object.values(node).flatMap(walkStrings) : [];
const decisionStrings = (): Set<string> => new Set(walkStrings(JSON.parse(read(DECISION))));

/** Fixture'lar diske değil BELLEKTEKİ geçici kopyaya uygulanır; canlı dosyalar hiç değişmez. */
const withDoc = (s: Sources, doc: string): Sources => ({ ...s, doc });
// biome-ignore format: the index and rationale overrides stay one expression each
const withIndex = (s: Sources, key: string, text: string): Sources =>
  ({ ...s, indexes: { ...s.indexes, [key]: text } });
// biome-ignore format: the rationale override stays one chained expression
const withRationale = (s: Sources, rationale: string): Sources => ({ ...s,
  classification: JSON.stringify((JSON.parse(s.classification) as Entry[])
    .map((e) => (e.docPath === DOC ? { ...e, rationale } : e))) });
const rationaleOf = (s: Sources): string =>
  (JSON.parse(s.classification) as Entry[]).find((e) => e.docPath === DOC)?.rationale ?? "";
const swap = (text: string, from: string, to: string) => text.split(from).join(to);
const append = (text: string, added: string) => `${text}\n${added}\n`;
/** Hedef satırın ARDINA / hedef paragrafın ÖNÜNE ayrı bir paragraf enjekte eder (olumsuzlama). */
const injectAfter = (text: string, anchor: string, injected: string): string => {
  const lines = linesOf(text);
  const at = lines.findIndex((line) => line.includes(anchor));
  return at < 0
    ? text
    : [...lines.slice(0, at + 1), "", injected, ...lines.slice(at + 1)].join("\n");
};
const injectBefore = (text: string, anchor: string, injected: string): string => {
  const lines = linesOf(text);
  const at = lines.findIndex((line) => line.includes(anchor));
  if (at < 0) return text;
  let start = at;
  while (start > 0 && lines[start - 1].trim() !== "") start -= 1;
  return [...lines.slice(0, start), injected, "", ...lines.slice(start)].join("\n");
};
/** Gerçek DOC satırının ÜSTÜNE/ALTINA aynı tablonun içine ikinci bir satır koyar (yem/kopya). */
const injectRow = (text: string, row: string, below: boolean): string => {
  const lines = linesOf(text);
  const at = lines.findIndex(isDocRow);
  return at < 0
    ? text
    : [...lines.slice(0, at + Number(below)), row, ...lines.slice(at + Number(below))].join("\n");
};
/** DOC'u anan düz metin cümlesini tablonun ÜSTÜNE koyar: satır değildir, tekilliği bozmaz. */
const proseBefore = (text: string, prose: string): string => {
  const lines = linesOf(text);
  const at = lines.findIndex(isDocRow);
  if (at < 0) return text;
  let start = at;
  while (start > 0 && isRow(lines[start - 1])) start -= 1;
  return [...lines.slice(0, start), prose, "", ...lines.slice(start)].join("\n");
};
const reorder = (text: string, first: string, second: string): string => {
  const lines = linesOf(text);
  const [a, b] = [first, second].map((p) => lines.findIndex((line) => line.startsWith(p)));
  if (a < 0 || b < 0) return text;
  const copy = [...lines];
  [copy[a], copy[b]] = [lines[b], lines[a]];
  return copy.join("\n");
};
/** Yalnız hizalama/boşluk oynatır: anlam değişmez, kapı SUSMALIDIR (R2-1 regresyonu). */
// biome-ignore format: the alignment padder stays one chained expression
const pad = (text: string, prefix: string) =>
  linesOf(text).map((l) => (l.startsWith(prefix) ? l.replace(/\|\s*/g, "|  ") : l)).join("\n");
const trail = (text: string) => `${linesOf(text).join(" \n")} `;
/** R8/F-2 — ham CR ile iki CommonMark satırını kapının gördüğü TEK satıra yapıştırır. */
const crJoin = (
  text: string,
  hit: (line: string, i: number, all: string[]) => boolean,
  extra: string,
  first = false,
) => {
  const lines = linesOf(text);
  const at = lines.findIndex(hit);
  if (at < 0) return text;
  const merged = first ? `${extra}${CR}${lines[at]}` : `${lines[at]}${CR}${extra}`;
  return [...lines.slice(0, at), merged, ...lines.slice(at + 1)].join("\n");
};
/** Tüm dosyayı verilen satır sonuyla yeniden yazar: CRLF ve CR checkout'u MEŞRUDUR. */
const eolAs = (text: string, eol: string) => linesOf(text).join(eol);

/** H1-R1 yem satırları: gerçek satırın yanına konan, `reference-only` taşıyan ikinci kayıtlar. */
const DECOY_ROW_00 = `| 15 kernel-delivery-boundary (\`${DOC}\`) | engineering | **reference-only** ikinci kayıt | — | — |`;
const DECOY_ROW_HUB = `| Anlatı standardı (ikinci kayıt) | \`${DOC}\` | **reference-only** insan-okur anlatı |`;
/** Tablo DIŞI meşru referans cümlesi: DOC'u anar ama tablo satırı değildir. */
const PROSE_MENTION = `Ayrıntılı anlatı \`${DOC}\` dosyasındadır; bu cümle bir tablo satırı değildir.`;
// biome-ignore format: each degrade pair stays one row per side
const DEGRADE_00: readonly [string, string] = ["| engineering | **reference-only** anlatı", "| engineering | **tam standart** anlatı"];
// biome-ignore format: each degrade pair stays one row per side
const DEGRADE_HUB: readonly [string, string] = [`| Anlatı standardı | \`${DOC}\` | **reference-only** insan-okur`, `| Anlatı standardı (reference-only dosya) | \`${DOC}\` | **tam standart** insan-okur`];
/** LOW-B — bölüm DIŞI ikinci tablo (geçmiş) meşrudur; başlığı `Reference-only` DEĞİLDİR. */
const HISTORY_HEAD = "## Ek — Anlatı değişiklik geçmişi (bilgi amaçlı)";
// biome-ignore format: the outside-section history tables stay one line per Markdown row
const OUTSIDE_TABLE_00 = [HISTORY_HEAD, "", "| standart | family | sınıf | not |", "|---|---|---|---|",
  `| 15 kernel-delivery-boundary (\`${DOC}\`) | engineering | **reference-only** geçmiş kaydı | eklendi |`].join("\n");
// biome-ignore format: the outside-section history tables stay one line per Markdown row
const OUTSIDE_TABLE_HUB = [HISTORY_HEAD, "", "| Katman | Yol | Rolü |", "|---|---|---|",
  `| Anlatı standardı (geçmiş) | \`${DOC}\` | **reference-only** geçmiş kaydı |`].join("\n");
/** MED-1 yem: aynı tablo ikinci H2'ye (harf varyantı) çevrilir; `fencedDecoy` kod örneğine sarar. */
const DECOY_HEAD = "## Ek — reference-ONLY yem bölümü";
const decoy = (table: string) => swap(table, HISTORY_HEAD, DECOY_HEAD);
const fencedDecoy = (table: string) => `\`\`\`markdown\n${decoy(table)}\n\`\`\``;
/** Fence yemleri: 4 boşluk girintili ``` CommonMark'ta fence AÇMAZ; backtick açıcının info string'i
 *  backtick TAŞIYAMAZ (tilde açıcıda aynı info string GEÇERLİDİR — meşru/yem kontrol çifti). */
// biome-ignore format: the fence delimiter table stays one row per delimiter shape
const [INDENT_FENCE, BACKTICK_FENCE, LONG_FENCE, TILDE_FENCE, INFO_BACKTICK_FENCE, TILDE_INFO_FENCE] =
  ["    ```", "```", "````", "~~~", "```md`x", "~~~md`x"];
/** R7/B yemi: kapatıcı kalanı GÖRÜNMEZ karakter taşır — CommonMark KAPATMAZ, eski kapı kapatırdı. */
// biome-ignore format: the closer table stays one row per remainder shape
const [NBSP_CLOSER, EM_SPACE_CLOSER, ASCII_WS_CLOSER] = [`${BACKTICK_FENCE}${NBSP}`, `${BACKTICK_FENCE}${EM_SPACE}`, `${BACKTICK_FENCE} ${TAB}`];
/** R5 saldırı deseni: gerçek (bozulmuş) bölümü yem fence ÇİFTİYLE saklar, ARDINA düzgün yem koyar.
 *  Meşru karşılığı `wrapped`: yemi GERÇEK fence içine alır, gerçek bölüm canlı kalır ve kapı susar. */
const hide = (text: string, open: string, close: string, table: string): string =>
  `${injectBefore(text, "Reference-only", open)}\n${close}\n${decoy(table)}`;
const wrapped = (text: string, open: string, close: string, table: string): string =>
  injectBefore(text, "Reference-only", `${open}\n${decoy(table)}\n${close}`);
/** R6: GERÇEK başlık 1-3 boşlukla girintilenir (render'da hâlâ H2) ve ARDINA düzgün yem bölüm konur;
 *  meşru karşılığında YEM başlık 4 boşluk/sekme ile gömülür ve bölüm SEÇEMEZ. Fixture kolon-0'ı KENDİ
 *  kalıbıyla bulur: kapının yüklemine bağlanmaz, yoksa bozuk kapı fixture'ı etkisizleştirirdi. */
// biome-ignore format: the heading indenter stays one chained expression
const indentRef = (text: string, indent: string): string =>
  linesOf(text).map((l) => (/^#{2}\s.*Reference-only/i.test(l) ? `${indent}${l}` : l)).join("\n");
const shifted = (text: string, indent: string, table: string) =>
  `${indentRef(text, indent)}\n${decoy(table)}`;
const buried = (text: string, indent: string, table: string) =>
  injectBefore(text, "Reference-only", `${indent}${decoy(table)}`);
/** R7/A yemi: `##` + NBSP satırı CommonMark'ta PARAGRAFTIR; eski kapı onu bölüm bitirici sayıyordu.
 *  Arkasına iki ihlal sınıfı saklanır; kontrol vakaları AYNI cümleyi bitiricisiz kurar. */
const FAKE_TERMINATOR = `##${NBSP}Ek — sahte bölüm bitirici (CommonMark'ta paragraf)`;
// biome-ignore format: the hidden-payload pair stays one row per violation class
const [HIDDEN_NEGATION, HIDDEN_READINESS] = ["Bu sınıflandırma artık geçerli değildir.", "Delivery runtime hazır durumdadır."];
const behindFakeHead = (text: string, payload: string) =>
  injectAfter(text, DOC, `${FAKE_TERMINATOR}\n\n${payload}`);
/** R8/F-1 saldırısı: bölüm 5'in İÇİNE görünmez ayırıcılı sahte bitirici + tamamlanma iddiası. */
const CLAIM_TAIL = "\n\nDört kombinasyon ayrı bir pakette test edildi ve başarıyla geçti.";
const fakeCut = (text: string, sep: string, tail: string) =>
  injectAfter(text, "ayrı bir pakette test edilecektir", `##${sep}Ek — sahte bitirici${tail}`);

/** İki canlı indeksin fixture takımı: aynı saldırı iki indekste de kurulur, etiketi `:00`/`:hub` ile
 *  deterministik ve tektir. Bu bir sayı doldurma değil kapsam çarpanıdır. */
type Kit = {
  tag: string;
  key: string;
  row: string;
  degrade: readonly [string, string];
  table: string;
};
// biome-ignore format: the live index kit table stays one row per index
const KITS: readonly Kit[] = [
  { tag: "00", key: FOLDER_INDEX, row: DECOY_ROW_00, degrade: DEGRADE_00, table: OUTSIDE_TABLE_00 },
  { tag: "hub", key: HUB_INDEX, row: DECOY_ROW_HUB, degrade: DEGRADE_HUB, table: OUTSIDE_TABLE_HUB },
];
type Mutation = readonly [string, (s: Sources) => Sources, readonly string[]];
type Legit = readonly [string, (s: Sources) => Sources];
type Build = (kit: Kit, text: string) => string;
const degraded: Build = (k, text) => swap(text, ...k.degrade);
const both = (label: string, build: Build, ids: (kit: Kit) => readonly string[]): Mutation[] =>
  KITS.map(
    (k): Mutation => [
      `${label}:${k.tag}`,
      (s) => withIndex(s, k.key, build(k, s.indexes[k.key])),
      ids(k),
    ],
  );
const bothLegit = (label: string, build: Build): Legit[] =>
  KITS.map(
    (k): Legit => [`${label}:${k.tag}`, (s) => withIndex(s, k.key, build(k, s.indexes[k.key]))],
  );
const mutateDoc = (label: string, edit: (doc: string) => string, ...ids: string[]): Mutation => [
  label,
  (s) => withDoc(s, edit(s.doc)),
  ids,
];
const legitDoc = (label: string, edit: (doc: string) => string): Legit => [
  label,
  (s) => withDoc(s, edit(s.doc)),
];
// biome-ignore format: the expected-id builders stay one row per finding family
const heads = (n: number) => (k: Kit) => [`indeks-reference-only-bolumu-tekil-degil:${k.key}:${n}`];
const rowsAt = (n: number) => (k: Kit) => [`indeks-anlati-satiri-tekil-degil:${k.key}:${n}`];
const clsCell = (k: Kit) => [`indeks-reference-only-sinif-hucresinde-degil:${k.key}`];
const idAt = (prefix: string) => (k: Kit) => [`${prefix}:${k.key}`];

/** Doküman metnini yerinde bozan mutasyonlar: `[etiket, aranan, yazılan, ...beklenen kimlik]`. */
// biome-ignore format: the in-place swap table stays one row per violation
const DOC_SWAPS: ReadonlyArray<readonly [string, string, string, ...string[]]> = [
  ["polarite-sunucu-tersine", "iş sonucu değişmez", "iş sonucu değişir", "polarite-tersine-cevrildi:sunucu-degisimi"],
  ["polarite-sunucu-cumlesi-silindi", "**Sunucu değişince iş sonucu değişmez.** ", "", "polarite-cumlesi-yok:sunucu-degisimi"],
  ["polarite-fastapi-zorunlu", "zorunlu kernel bağımlılığı değildir", "zorunlu kernel bağımlılığıdır", "polarite-tersine-cevrildi:fastapi-opsiyonel", `fastapi-zorunlu-anlatiliyor:${DOC}`],
  ["polarite-ikinci-sahip", "Kararın ikinci sahibi değildir", "Kararın ikinci sahibidir", "polarite-tersine-cevrildi:ikinci-sahip-degil"],
  ["polarite-dokuz-boyut", "dokuz iş sonucu boyutunun tamamı aynı kalır", "dokuz iş sonucu boyutu değişebilir", "polarite-tersine-cevrildi:dokuz-boyut-esitligi"],
  ["polarite-rastgele-red", "rastgele kullanıcı isteği reddedilmez", "rastgele kullanıcı isteği reddedilir", "polarite-tersine-cevrildi:rastgele-red"],
  ["polarite-fail-closed-acik-birakildi", "başlangıçta `en dar kapsamda fail-closed` kapanır", "`en dar kapsamda fail-closed` yerine en geniş kapsamda açık kalır", "polarite-tersine-cevrildi:baslangicta-fail-closed"],
  ["polarite-fail-closed-baslangic-silindi", "module başlangıçta", "module her istekte", "polarite-bozuldu:baslangicta-fail-closed"],
  ["kombinasyon-tamamlandi-iddiasi", "ayrı bir pakette test edilecektir", "ayrı bir pakette test edildi ve geçti", "dort-kombinasyon-tamamlandi-iddiasi"],
  ["kombinasyon-tamamlandi-edilgen-fiil", "ayrı bir pakette test edilecektir", "ayrı bir pakette çalıştırılmış ve eşitliği gösterilmiştir", "dort-kombinasyon-tamamlandi-iddiasi"],
  ["kombinasyon-plan-beyani-silindi", "Bu doküman testi üretmez; ", "", "dort-kombinasyon-plan-beyani-yok"],
  ["rol-hucresi-bozuldu:hypercorn", "**desteklenen bağımsız uyumluluk alternatifi**", "**ikinci varsayılan**", "tasiyici-rolu-belirsiz:Hypercorn"],
  ["rol-hucresi-bozuldu:fastapi", "| FastAPI | **isteğe bağlı Delivery adaptör konağı**", "| FastAPI | **zorunlu Delivery bağımlılığı**", "tasiyici-rolu-belirsiz:FastAPI"],
  ["port-metaframer-sahipligi-silindi", "outbox ve audit MetaFramer Application/Domain", "outbox ve audit taşıma", "metaframer-yedi-port-sahipligi-yok"],
  ["port-uvicorn-audit-dusuruldu", "transaction, DB, outbox, audit |", "transaction, DB, outbox |", "tasima-sahiplenmedigi-portlar-eksik:uvicorn"],
  ["bes-alan-etiketi-silindi", "`kalanEngel`", "kalan engel", "bes-alan-yok:kalanEngel"],
  ["yolculuk-formu-silindi", "Yeni Personel", "bir kayıt", "crm-hrms-form-yolculugu-yok:Yeni Personel"],
  ["kanonik-karar-linki-bozuldu", DOC, "docs/standards/yok.md", `kanonik-kaynak-linki-cozulmuyor:${DOC}:docs/standards/yok.md`],
];
/** Doğru cümle yerinde kalır, yanına iptal cümlesi eklenir: `[id, çapa, SONRAKİ, ÖNCEKİ paragraf]`.
 *  İki yön de ayrı vakadır; tek yönlü pencere bir paragraf YUKARI taşınanı kaçırırdı. */
// biome-ignore format: the negation table stays one row per protected sentence
const DOC_NEGATIONS: ReadonlyArray<readonly [string, string, string, string]> = [
  ["sunucu-degisimi", "Sunucu değişince iş sonucu değişmez", "Bu cümle yanlıştır.", "Bu kural artık geçerli değildir."],
  ["fastapi-opsiyonel", "zorunlu kernel bağımlılığı değildir", "Bu kural artık geçerli değildir.", "Aşağıdaki sınır artık geçerli değildir."],
  ["ikinci-sahip-degil", "Kararın ikinci sahibi değildir", "Bu sınır bağlayıcı değildir.", "Aşağıdaki başlık bloğu hükümsüz kalmıştır."],
  ["fail-closed", "en dar kapsamda fail-closed", "Bu kural artık uygulanmaz.", "Aşağıdaki kapanma kuralı bağlayıcı değildir."],
  ["dort-kombinasyon", "ayrı bir pakette test edilecektir", "Bu plan iptal edilmiştir.", "Aşağıdaki plan iptal edilmiştir."],
  ["fallback-esitligi", "dokuz iş sonucu boyutunun tamamı aynı kalır", "Bu eşitlik kuralı artık geçerli değildir.", "Aşağıdaki eşitlik kuralı artık uygulanmaz."],
];
/** Dokümanın SONUNA eklenen yasak cümle: `[etiket, cümle, beklenen kimlik]`. */
// biome-ignore format: the appended-claim table stays one row per overclaim class
const DOC_APPENDS: ReadonlyArray<readonly [string, string, string]> = [
  ["rol-tasima-is-karari-sahibi", "Uvicorn audit kararını verir.", `tasima-katmani-is-karari-veriyor:${DOC}`],
  ["readiness-sdk-hazir", "SDK hazırdır ve bugün tüketilebilir.", `sdk-hazir-overclaim:${DOC}`],
  ["readiness-runtime-hazir", "Delivery runtime hazır durumdadır.", `runtime-hazir-overclaim:${DOC}`],
];
/** İndeks metnini yerinde bozan mutasyonlar: `[etiket, indeks, aranan, yazılan, beklenen kimlik]`. */
// biome-ignore format: the index swap table stays one row per violation
const INDEX_SWAPS: ReadonlyArray<readonly [string, string, string, string, string]> = [
  ["f1-indeks-anlatiya-yonlendirmiyor:00", FOLDER_INDEX, DOC, "docs/standards/yok.md", `indeks-anlatiya-yonlendirmiyor:${FOLDER_INDEX}`],
  ["f1-karar-zinciri-koptu:hub", HUB_INDEX, VALIDATOR, "tools/lib/yok.mjs", `indeks-karar-zincirine-yonlendirmiyor:${HUB_INDEX}:${VALIDATOR}`],
  ["f1-uydurma-standardref:00", FOLDER_INDEX, "`standardRef` anahtarı YOK", "`deliveryBoundaryRef` anahtarı ile bağlanır", `indeks-uydurma-standardref:${FOLDER_INDEX}:deliveryBoundaryRef`],
  ["f1-capability-delta-silindi:hub", HUB_INDEX, CAPABILITY_DELTA, "", `indeks-capability-delta-yok:${HUB_INDEX}`],
  ["f1-guncel-sayi-donduruldu", FOLDER_INDEX, "(canlı):** 39", "(canlı):** 28", "guncel-sayi-canli-degil:28"],
];
/** GAP-1 gerekçe mutasyonları: `[etiket, önceki gerekçeden yeni gerekçe, beklenen kimlik]`. */
// biome-ignore format: the rationale table stays one row per leak or overclaim
const RATIONALES: ReadonlyArray<readonly [string, (prev: string) => string, string]> = [
  ["gap1-gerekce-runtime-hazir", (p) => `${p} Bu anlatı yazıldığına göre runtime hazırdır.`, "siniflandirma-gerekcesi-readiness-overclaim"],
  ["gap1-gerekce-urun-hazir", (p) => `${p} Ürün hazırdır ve Delivery halkası kapanmıştır.`, "siniflandirma-gerekcesi-readiness-overclaim"],
  ["gap1-gerekce-deger-sizintisi:default-reference", () => "15 — Delivery anlatısı: Uvicorn default-reference sunucudur; anlatı görev prose'una kopyalanmaz.", "siniflandirma-gerekcesi-baglayici-deger-sizintisi:default-reference"],
  ["gap1-gerekce-deger-sizintisi:adapter-host", () => "15 — Delivery anlatısı: FastAPI supported-optional-adapter-host'tur; anlatı görev prose'una kopyalanmaz.", "siniflandirma-gerekcesi-baglayici-deger-sizintisi:supported-optional-adapter-host"],
  ["gap1-gerekce-silindi", () => "   ", "siniflandirma-gerekcesi-yok"],
];
/** R8/F-1 — CommonMark'ta boşluk OLMAYAN ayırıcı adayları; her biri ayrı bir saldırı vakasıdır. */
// biome-ignore format: the invisible separator table stays one row per codepoint
const FAKE_SEPS: ReadonlyArray<readonly [string, string]> = [
  ["nbsp", NBSP], ["em-space", EM_SPACE], ["form-feed", FORM_FEED], ["vertical-tab", VTAB],
];

/** LOW-A — bütçe ALT SINIR değil TAM SAYIDIR: sessiz silme de etiket tekrarıyla sayı doldurmak da RED
 *  olur. 87 → 99 (R8): iki canlı indekste 4 CR saldırısı (yem bölüm + yem satır) ve 4 CR payload
 *  kontrolü, doküman kesicisinde 4 görünmez sahte bitirici. Meşru 40 → 48: iki indeks + doküman için
 *  CRLF/CR checkout'u, ihlalsiz sahte bitirici ve gerçek H2 ile kesilen nötr ek bölüm. */
const MUTATION_COUNT = 99;
const LEGITIMATE_COUNT = 48;
const duplicates = (labels: readonly string[]): string[] =>
  labels.filter((label, at) => labels.indexOf(label) !== at);

/** Her ihlal BEKLENEN bulgu kimliğiyle yakalanmalı; "bir şey kırmızı oldu" kanıt sayılmaz. */
// biome-ignore format: the adversarial mutation table stays one row per violation class
const MUTATIONS: readonly Mutation[] = [
  ...DOC_SWAPS.map(([label, from, to, ...ids]) => mutateDoc(label, (d) => swap(d, from, to), ...ids)),
  ...DOC_NEGATIONS.flatMap(([id, anchor, after, before]): Mutation[] => [
    mutateDoc(`olumsuzlama-sonraki-paragraf:${id}`, (d) => injectAfter(d, anchor, after), `olumsuzlama-saldirisi:${id}`),
    mutateDoc(`olumsuzlama-onceki-paragraf:${id}`, (d) => injectBefore(d, anchor, before), `olumsuzlama-saldirisi:${id}`),
  ]),
  ...DOC_APPENDS.map(([label, text, id]) => mutateDoc(label, (d) => append(d, text), id)),
  ...INDEX_SWAPS.map(([label, key, from, to, id]): Mutation =>
    [label, (s) => withIndex(s, key, swap(s.indexes[key], from, to)), [id]]),
  ...RATIONALES.map(([label, build, id]): Mutation =>
    [label, (s) => withRationale(s, build(rationaleOf(s))), [id]]),
  ["gap1-siniflandirma-karari-degistirildi", (s) => ({ ...s, classification: swap(s.classification, `"docPath": "${DOC}",\n    "documentClass": "engineering-standard",\n    "decision": "reference-only"`, `"docPath": "${DOC}",\n    "documentClass": "engineering-standard",\n    "decision": "task-materialize"`) }), ["siniflandirma-karari-reference-only-degil:task-materialize"]],
  // Sınıflandırma SINIF/ROL hücresinde okunur; kopya/yem satır gerçek satırı gölgeler ve tekillik
  // bölüm İÇİNDE fail-closed durur (üste, alta ve üst+alt yem: 2, 2, 3 satır).
  ...both("f1-sinif-hucresi-tam-standart", degraded, clsCell),
  ...both("yem-satir-gercek-satir-bozuk", (k, t) => injectRow(degraded(k, t), k.row, false), rowsAt(2)),
  ...both("kopya-satir-bozulmamis", (k, t) => injectRow(t, k.row, false), rowsAt(2)),
  ...both("yem-satir-altta", (k, t) => injectRow(t, k.row, true), rowsAt(2)),
  ...both("yem-satir-ust-ve-alt", (k, t) => injectRow(injectRow(t, k.row, false), k.row, true), rowsAt(3)),
  // İkinci gerçek H2 fail-closed'dır; FENCED kod örneğindeki başlık bölüm SEÇEMEZ ve 4 boşlukla
  // girintili ``` çifti gerçek bölümü "kod"a alamaz (render'da iki canlı H2 → fail-closed).
  ...both("yem-h2-bolumu-ustte", (k, t) => injectBefore(degraded(k, t), "Reference-only", decoy(k.table)), heads(2)),
  ...both("fenced-yem-h2-bolum-secemez", (k, t) => injectBefore(degraded(k, t), "Reference-only", fencedDecoy(k.table)), clsCell),
  ...both("girintili-fence-yem-h2", (k, t) => `${injectBefore(degraded(k, t), "Reference-only", INDENT_FENCE)}\n${INDENT_FENCE}\n${decoy(k.table)}`, heads(2)),
  // R5: info string'inde backtick taşıyan ``` AÇMAZ (gerçek bölüm canlı → 2); farklı karakterle ya da
  // kısa delimiter'la "kapatma" fence'i EOF'a dek sürdürür ve yem de düşer (→ 0). Üçü de fail-closed.
  ...both("r5-info-backtick-acici-yem-h2", (k, t) => hide(degraded(k, t), INFO_BACKTICK_FENCE, INFO_BACKTICK_FENCE, k.table), heads(2)),
  ...both("r5-farkli-karakter-kapatici-yem-h2", (k, t) => hide(degraded(k, t), BACKTICK_FENCE, TILDE_FENCE, k.table), heads(0)),
  ...both("r5-kisa-kapatici-yem-h2", (k, t) => hide(degraded(k, t), LONG_FENCE, BACKTICK_FENCE, k.table), heads(0)),
  // R6: GERÇEK H2 1-3 boşlukla girintilenir — CommonMark hâlâ H2 görür, kapı da görmek zorundadır.
  ...both("r6-bir-bosluk-girintili-gercek-h2", (k, t) => shifted(degraded(k, t), SP1, k.table), heads(2)),
  ...both("r6-iki-bosluk-girintili-gercek-h2", (k, t) => shifted(degraded(k, t), SP2, k.table), heads(2)),
  ...both("r6-uc-bosluk-girintili-gercek-h2", (k, t) => shifted(degraded(k, t), SP3, k.table), heads(2)),
  // R7/A: `##`+NBSP sahte bitiricinin ARKASINA konan ihlal; kontrol çifti AYNI ihlali bitiricisiz kurar.
  ...both("kontrol-olumsuzlama", (_k, t) => injectAfter(t, DOC, HIDDEN_NEGATION), idAt("indeks-olumsuzlama-saldirisi")),
  ...both("kontrol-readiness", (_k, t) => injectAfter(t, DOC, HIDDEN_READINESS), idAt("runtime-hazir-overclaim")),
  ...both("r7-sahte-bitirici-olumsuzlama", (_k, t) => behindFakeHead(t, HIDDEN_NEGATION), idAt("indeks-olumsuzlama-saldirisi")),
  ...both("r7-sahte-bitirici-readiness", (_k, t) => behindFakeHead(t, HIDDEN_READINESS), idAt("runtime-hazir-overclaim")),
  // R7/B: GEÇERLİ ``` açıcı + görünmez kalanlı sahte kapatıcı; fence kapanmaz, yem de maskelenir → 0.
  ...both("r7-sahte-nbsp-kapatici", (k, t) => hide(degraded(k, t), BACKTICK_FENCE, NBSP_CLOSER, k.table), heads(0)),
  ...both("r7-sahte-em-space-kapatici", (k, t) => hide(degraded(k, t), BACKTICK_FENCE, EM_SPACE_CLOSER, k.table), heads(0)),
  // Bölüm DIŞI yem, bölüm İÇİNDEKİ bozulmuş SINIF hücresini besleyemez ve gerçek satırı gölgeleyemez.
  ...both("bolum-disi-yem-sinif-hucresini-beslemez", (k, t) => `${degraded(k, t)}\n${k.table}`, clsCell),
  // R8/F-2: ham CR ile yapıştırılan ikinci bölüm ve ikinci DOC satırı kapıya TEK satır gibi geliyordu;
  // CR ile satıra yapıştırılan payload da (readiness + olumsuzlama) RED kontrolüdür.
  ...both("cr-yem-h2-bolumu", (_k, t) => crJoin(t, (_l, i, all) => i === all.length - 1, `${DECOY_HEAD}\n\n${HIDDEN_READINESS}`), heads(2)),
  ...both("cr-yem-satir-tekilligi", (k, t) => crJoin(degraded(k, t), isDocRow, k.row, true), rowsAt(2)),
  ...both("cr-payload-readiness", (_k, t) => crJoin(t, (l) => l.includes(DOC), HIDDEN_READINESS), idAt("runtime-hazir-overclaim")),
  ...both("cr-payload-olumsuzlama", (_k, t) => crJoin(t, (l) => l.includes(DOC), HIDDEN_NEGATION), idAt("indeks-olumsuzlama-saldirisi")),
  // R8/F-1: doküman içi kesici görünmez ayırıcıyla erken kesilip tamamlanma iddiasını saklayamaz.
  ...FAKE_SEPS.map(([tag, sep]) => mutateDoc(`r8-sectionof-sahte-bitirici:${tag}`, (d) => fakeCut(d, sep, CLAIM_TAIL), "dort-kombinasyon-tamamlandi-iddiasi")),
  // Dört kombinasyonun GELECEK beyanı hem başlıktan hem gövdeden silinince kapı RED olur.
  mutateDoc("kombinasyon-gelecek-beyani-silindi", (d) => swap(swap(d, " — daha sonra aynı boyutlarla test edilecek", ""), "ayrı bir pakette test edilecektir", "ayrı bir pakette eşitlenir"), "dort-kombinasyon-gelecek-beyani-yok"),
];

/** Meşru düzenleme anlamı korur: kapı SUSMALI. Gereksiz RED bir kapı hatasıdır (R2-1). */
// biome-ignore format: the legitimate-edit table stays one row per allowed change
const LEGITIMATE: readonly Legit[] = [
  // Hizalama, satır sonu boşluğu, satır sırası ve nötr yeniden ifade anlamı DEĞİŞTİRMEZ.
  legitDoc("legit-uvicorn-hizalama", (d) => pad(d, "| Uvicorn |")),
  legitDoc("legit-hypercorn-hizalama", (d) => pad(d, "| Hypercorn |")),
  legitDoc("legit-doc-satir-sonu-bosluk", trail),
  legitDoc("legit-rol-tablosu-satir-sirasi", (d) => reorder(d, "| Uvicorn |", "| Hypercorn |")),
  legitDoc("legit-kanit-tablosu-satir-sirasi", (d) => reorder(d, "| Sağlayıcı bağımsızlığı |", "| Çıkış ve rollback |")),
  legitDoc("legit-notr-reword", (d) => swap(d, "Sadece taşıma", "Yalnızca taşıma")),
  ["legit-indeks-hizalama:00", (s) => withIndex(s, FOLDER_INDEX, pad(s.indexes[FOLDER_INDEX], "| 15 kernel-delivery-boundary"))],
  ["legit-hub-satir-sonu-bosluk", (s) => withIndex(s, HUB_INDEX, trail(s.indexes[HUB_INDEX]))],
  // Dürüst OLUMSUZ cümleler ve nötr paragraf GREEN kalır: eksiklik itirafı iddia değildir.
  legitDoc("legit-durust-production-ready-degildir", (d) => append(d, "Bu paket **production-ready değildir**.")),
  legitDoc("legit-durust-sdk-hazir-degil", (d) => append(d, "SDK hazır değildir ve bu paket onu açmaz.")),
  legitDoc("legit-durust-endpoint-yok", (d) => append(d, "Çalışan endpoint yoktur; yalnız sözleşme yazılıdır.")),
  legitDoc("legit-notr-paragraf", (d) => append(d, "Bu paragraf okuyucuya kolaylık için eklenmiştir ve yeni bir kural üretmez.")),
  ["legit-gerekce-notr-reword", (s) => withRationale(s, "15 — MetaFramer Delivery Sınırı anlatısı: bağlayıcı değerlerin sahibi kanonik karar kaydı ile doğrulayıcısıdır; anlatı görev prose'una kopyalanmaz, katalogdan referans olarak okunur.")],
  ["legit-gerekce-durust-olumsuz", (s) => withRationale(s, `${rationaleOf(s)} Bu sınıflandırma çalışan bir runtime iddia etmez.`)],
  // Tablo DIŞI DOC anması kopya satır değildir; bölüm DIŞI ikinci tablo satırı ve `###` alt başlık da
  // meşrudur: `###` H2 DEĞİLDİR ve bölümü bölüp SINIF satırını dışarıda bırakamaz.
  ...bothLegit("legit-tablo-disi-doc-anmasi", (_k, t) => proseBefore(t, PROSE_MENTION)),
  ...bothLegit("legit-bolum-disi-doc-tablo-satiri", (k, t) => `${t}\n${k.table}`),
  ...bothLegit("legit-bolum-ici-alt-baslik", (_k, t) => proseBefore(t, "### Alt başlık — bölümü bölmez")),
  // R5 meşru: aynı karakterde UZUN kapatıcı, tilde açıcının backtick'li info string'i ve 0-3 boşluk
  // girintili fence GEÇERLİDİR; yem maskelenir, gerçek bölüm canlı kalır, kapı yanlış RED üretmez.
  ...bothLegit("legit-uzun-kapatici-fence", (k, t) => wrapped(t, BACKTICK_FENCE, LONG_FENCE, k.table)),
  ...bothLegit("legit-tilde-info-backtick-fence", (k, t) => wrapped(t, TILDE_INFO_FENCE, TILDE_FENCE, k.table)),
  ...bothLegit("legit-uc-bosluk-fence", (k, t) => wrapped(t, `${SP3}${BACKTICK_FENCE}`, `${SP3}${BACKTICK_FENCE}`, k.table)),
  // R6 meşru: TEKİL gerçek başlık 1/2/3 boşlukla girintilense de doğru bölüm seçilir; 4 boşluk ve
  // sekme ile başlayan YEM başlık H2 DEĞİLDİR ve asıl bölümü gizleyemez.
  ...bothLegit("legit-bir-bosluk-girintili-tekil-h2", (_k, t) => indentRef(t, SP1)),
  ...bothLegit("legit-iki-bosluk-girintili-tekil-h2", (_k, t) => indentRef(t, SP2)),
  ...bothLegit("legit-uc-bosluk-girintili-tekil-h2", (_k, t) => indentRef(t, SP3)),
  ...bothLegit("legit-dort-bosluk-yem-h2-gizleyemez", (k, t) => buried(t, SP4, k.table)),
  ...bothLegit("legit-tab-yem-h2-gizleyemez", (k, t) => buried(t, TAB, k.table)),
  // R7 meşru: `##`+NBSP satırı bölüm bitirici DEĞİLDİR (ihlal yoksa kapı susar) ve ASCII boşluk/sekme
  // kalanı GEÇERLİ kapatıcıdır; kalanı "tam boş" sanan bir daraltma burada yanlış RED verirdi.
  ...bothLegit("legit-sahte-bitirici-ihlalsiz", (_k, t) => injectAfter(t, DOC, FAKE_TERMINATOR)),
  ...bothLegit("legit-ascii-bosluk-kapatici", (k, t) => wrapped(t, BACKTICK_FENCE, ASCII_WS_CLOSER, k.table)),
  // R8 meşru: CRLF ve CR checkout'u anlamı DEĞİŞTİRMEZ; kanonik satır modeli üçünü de aynı okur.
  ...bothLegit("legit-crlf-indeks", (_k, t) => eolAs(t, CRLF)),
  ...bothLegit("legit-cr-indeks", (_k, t) => eolAs(t, CR)),
  legitDoc("legit-crlf-doc", (d) => eolAs(d, CRLF)),
  legitDoc("legit-cr-doc", (d) => eolAs(d, CR)),
  // R8 meşru: ihlalsiz sahte bitirici susar; GERÇEK ASCII ayırıcılı H2 bölümü meşruca keser ve
  // arkasındaki nötr ek bölüm dört kombinasyon yüzeyinin DIŞINDA kalır.
  legitDoc("legit-sahte-bitirici-doc-ihlalsiz", (d) => fakeCut(d, NBSP, "")),
  legitDoc("legit-gercek-h2-notr-bolum", (d) => fakeCut(d, SP1, "\n\nBu ek bölüm yeni bir kural üretmez.")),
];

/** Blok yapısı profilleri BAŞLIK SAYISIYLA ölçülür: gizlenen başlık maskelenmezse sayı büyür, meşru
 *  fence tanınmazsa sayı büyür, kapanmayan fence EOF'a dek sürerse sayı sıfırlanır — üçü de ayırt
 *  edicidir ve hiçbiri kendi kendini doğrulamaz. */
const [HIDDEN_HEAD, LIVE_HEAD] = ["## Reference-only gizlenen", "## Reference-only canlı"];
type HeadCase = readonly [string, readonly string[], number];
// biome-ignore format: the fence-state table stays one row per CommonMark rule
const FENCE_CASES: readonly HeadCase[] = [
  ["uzun-kapatici-kapatir", [BACKTICK_FENCE, HIDDEN_HEAD, LONG_FENCE, LIVE_HEAD], 1],
  ["farkli-karakter-kapatmaz", [BACKTICK_FENCE, HIDDEN_HEAD, TILDE_FENCE, HIDDEN_HEAD], 0],
  ["kisa-kapatici-kapatmaz", [LONG_FENCE, HIDDEN_HEAD, BACKTICK_FENCE, HIDDEN_HEAD], 0],
  ["backtick-info-backtick-acmaz", [INFO_BACKTICK_FENCE, LIVE_HEAD, INFO_BACKTICK_FENCE, LIVE_HEAD], 2],
  ["tilde-info-backtick-acar", [TILDE_INFO_FENCE, HIDDEN_HEAD, TILDE_FENCE, LIVE_HEAD], 1],
  ["uc-bosluk-fence-acar", [`${SP3}${BACKTICK_FENCE}`, HIDDEN_HEAD, `${SP3}${BACKTICK_FENCE}`, LIVE_HEAD], 1],
  ["dort-bosluk-fence-acmaz", [INDENT_FENCE, LIVE_HEAD, INDENT_FENCE, LIVE_HEAD], 2],
  ["tab-fence-acmaz", [`${TAB}${BACKTICK_FENCE}`, LIVE_HEAD, `${TAB}${BACKTICK_FENCE}`, LIVE_HEAD], 2],
  ["kapanmayan-fence-eof-a-kadar", [BACKTICK_FENCE, HIDDEN_HEAD, HIDDEN_HEAD], 0],
  ["kapatici-sonrasi-metin-kapatmaz", [BACKTICK_FENCE, HIDDEN_HEAD, `${BACKTICK_FENCE} hayır`, HIDDEN_HEAD], 0],
  ["kapatici-sonrasi-bosluk-kapatir", [BACKTICK_FENCE, HIDDEN_HEAD, `${BACKTICK_FENCE}${TAB} `, LIVE_HEAD], 1],
];
/** R7 — kapatıcı KALANININ tam profili (CommonMark 4.5): kapatıcıyı yalnız ASCII boşluk/sekme
 *  izleyebilir; görünmez kalan `.trim()` ile "boş" görünüp false GREEN üretiyordu. */
// biome-ignore format: the closer remainder table stays two rows per line
const CLOSER_REMAINDERS: ReadonlyArray<readonly [string, string, number]> = [
  ["closer-bos-kalan-kapatir", "", 1], ["closer-ascii-bosluk-kapatir", SP3, 1],
  ["closer-ascii-sekme-kapatir", `${TAB}${TAB}`, 1], ["closer-nbsp-kapatmaz", NBSP, 0],
  ["closer-em-space-kapatmaz", EM_SPACE, 0], ["closer-form-feed-kapatmaz", FORM_FEED, 0],
  ["closer-vertical-tab-kapatmaz", VTAB, 0], ["closer-gorunur-metin-kapatmaz", " hayır", 0],
];
const CLOSER_CASES: readonly HeadCase[] = CLOSER_REMAINDERS.map(([label, rest, count]) => [
  label,
  [BACKTICK_FENCE, HIDDEN_HEAD, `${BACKTICK_FENCE}${rest}`, LIVE_HEAD],
  count,
]);
/** R7 — ATX H2 AYIRICISININ tam profili (CommonMark 4.2): `#` dizisini ASCII boşluk, ASCII sekme VEYA
 *  satır sonu izlemelidir; girinti 0-3 ASCII boşluktur, 4 boşluk ve sekme kod girintisidir; `##` tek
 *  başına BOŞ H2'dir; `###`/`#`/`####` bu EXACT H2 profili için başlık DEĞİLDİR ve NBSP/em-space/
 *  form-feed/vertical-tab ayırıcı DEĞİLDİR. Yön değil PROFİL pinlidir. */
// biome-ignore format: the ATX profile table stays two rows per line
const ATX_CASES: ReadonlyArray<readonly [string, string, boolean]> = [
  ["atx-bosluk-ayirici", "## x", true], ["atx-sekme-ayirici", `##${TAB}x`, true],
  ["atx-bos-h2-satir-sonu", "##", true], ["atx-bos-h2-uc-bosluk-girintili", `${SP3}##`, true],
  ["atx-bir-bosluk-girinti", `${SP1}## x`, true], ["atx-iki-bosluk-girinti", `${SP2}## x`, true],
  ["atx-uc-bosluk-girinti", `${SP3}## x`, true], ["atx-sondaki-bosluk-kalani", `##${SP2}`, true],
  ["atx-dort-bosluk-girinti-kod", `${SP4}## x`, false], ["atx-sekme-girinti-kod", `${TAB}## x`, false],
  ["atx-h3-degil", "### x", false], ["atx-h1-degil", "# x", false],
  ["atx-h4-degil", "#### x", false], ["atx-ayiricisiz-metin", "##x", false],
  ["atx-nbsp-ayirici-degil", `##${NBSP}x`, false], ["atx-em-space-ayirici-degil", `##${EM_SPACE}x`, false],
  ["atx-form-feed-ayirici-degil", `##${FORM_FEED} x`, false], ["atx-vertical-tab-ayirici-degil", `##${VTAB} x`, false],
  ["atx-nbsp-tek-basina-degil", `##${NBSP}`, false],
];
/** R8 — satır modelinin profili: CommonMark satır sonu CRLF, CR ve LF'tir. Ölçü yine BAŞLIK
 *  SAYISIDIR; ham CR ile yapıştırılan ikinci başlık eski modelde hiç görünmüyordu. */
// biome-ignore format: the line-ending table stays one row for the whole model
const EOL_CASES: ReadonlyArray<readonly [string, string]> = [["eol-lf", "\n"], ["eol-crlf", CRLF], ["eol-cr", CR]];
const [FENCE_CASE_COUNT, CLOSER_CASE_COUNT, ATX_CASE_COUNT, EOL_CASE_COUNT] = [11, 8, 19, 3];
/** R8/F-1 — `sectionOf` sınırının ATX profilinden SAPMADIĞININ kanıtı: satır başlık değilse bölüm
 *  kesilmez ve arkasına saklanan payload denetim yüzeyinde KALIR. */
const [SECTION_HEAD, PAYLOAD_MARK] = ["## A bölümü", "gizlenen bağlayıcı iddia"];
const sectionCuts = (terminator: string): boolean =>
  !sectionOf(
    [SECTION_HEAD, "gövde", terminator, "", PAYLOAD_MARK].join("\n"),
    SECTION_HEAD,
  ).includes(PAYLOAD_MARK);
const headsOf = (lines: readonly string[]) => refSection(lines.join("\n"))[0];
const headMismatch = (cases: readonly HeadCase[]): string[] =>
  cases
    .filter(([, lines, count]) => headsOf(lines) !== count)
    .map(([label, lines, count]) => `${label} => beklenen ${count}, bulunan ${headsOf(lines)}`);
/** Bütçe TAM sayıdır ve etiket tekrarıyla doldurulamaz; sessiz silme burada RED olur. */
const budget = (labels: readonly string[], total: number, kind: string): void => {
  const repeated = duplicates(labels);
  expect(repeated, `${kind}-etiketi-tekrar:\n${repeated.join("\n")}`).toEqual([]);
  expect(labels.length, `${kind}-vaka-butcesi`).toBe(total);
};

describe("A2A2-DOC Delivery sınırı anlatı standardı ve indeks entegrasyonu", () => {
  it("anlatı, iki indeks, roller, sınırlar, beş alan ve kanonik zincir eksiksizdir", () => {
    const findings = audit(live());
    expect(findings, `delivery-boundary-documentation-gap:\n${findings.join("\n")}`).toEqual([]);
  });

  it("R5/R7: top-level fence durumu açıcı, kapatıcı ve ASCII kalan kurallarıyla çözülür", () => {
    budget(
      FENCE_CASES.map(([label]) => label),
      FENCE_CASE_COUNT,
      "fence",
    );
    budget(
      CLOSER_CASES.map(([label]) => label),
      CLOSER_CASE_COUNT,
      "kapatici",
    );
    const wrong = [...headMismatch(FENCE_CASES), ...headMismatch(CLOSER_CASES)];
    expect(wrong, `fence-durumu-yanlis:\n${wrong.join("\n")}`).toEqual([]);
  });

  it("R7: ATX H2 ayırıcısı yalnız ASCII boşluk/sekme veya satır sonudur", () => {
    budget(
      ATX_CASES.map(([label]) => label),
      ATX_CASE_COUNT,
      "atx",
    );
    // biome-ignore format: the ATX verdict fan-in stays one chained expression
    const wrong = ATX_CASES
      .filter(([, line, expected]) => ATX_H2.test(line) !== expected)
      .map(([label, , expected]) => `${label} => beklenen ${expected}, bulunan ${!expected}`);
    expect(wrong, `atx-h2-karari-yanlis:\n${wrong.join("\n")}`).toEqual([]);
  });

  it("R8: satır modeli CRLF/CR/LF'tir ve bölüm kesicisi ATX profilinden sapmaz", () => {
    budget(
      EOL_CASES.map(([label]) => label),
      EOL_CASE_COUNT,
      "satir-sonu",
    );
    // biome-ignore format: the line-model fan-in stays one chained expression
    const wrong = EOL_CASES
      .map(([label, eol]) => [label, headsOf([[LIVE_HEAD, "gövde", LIVE_HEAD].join(eol)]), headsOf([[LIVE_HEAD, "gövde"].join(eol)])] as const)
      .filter(([, two, one]) => two !== 2 || one !== 1)
      .map(([label, two, one]) => `${label} => beklenen 2/1, bulunan ${two}/${one}`);
    expect(wrong, `satir-modeli-yanlis:\n${wrong.join("\n")}`).toEqual([]);
    // Kesici ile başlık yüklemi TEK yerden okunur: profil satır satır aynı kararı vermek zorundadır.
    // biome-ignore format: the section boundary fan-in stays one chained expression
    const drifted = ATX_CASES
      .filter(([, line, isHead]) => sectionCuts(line) !== isHead)
      .map(([label, , isHead]) => `${label} => bölüm kesilmeli mi ${isHead}, bulunan ${!isHead}`);
    expect(drifted, `sectionof-atx-profilinden-sapti:\n${drifted.join("\n")}`).toEqual([]);
  });

  it("R2-1: rol tablosu Markdown hizalama varyasyonuyla okunur, yanlış pozitif üretmez", () => {
    const sources = live();
    const padded = pad(sources.doc, "| Uvicorn |");
    expect(padded, "hizalama-varyasyonu-uygulanamadi").not.toBe(sources.doc);
    expect(auditDoc(padded), "r2-1-yanlis-pozitif").toEqual(auditDoc(sources.doc));
  });

  it("GAP-1: sınıflandırma gerekçesi değer-sızıntısız ve readiness iddiasızdır", () => {
    const s = live();
    // Token listesi dekoratif olamaz: her biri kaynağın kendi metninde gerçekten geçer.
    const source = decisionStrings();
    const decorative = LEAK_TOKENS.filter((token) => !source.has(token));
    expect(decorative, `sizinti-token-kaynakta-yok:\n${decorative.join("\n")}`).toEqual([]);
    // Canlı gerekçe DEĞER TAŞIMAZ ve readiness iddia etmez: bugünkü doğru hâl GREEN kalır.
    expect(rationaleOf(s), "siniflandirma-gerekcesi-bos").not.toBe("");
    expect(auditRationale(s.classification), "canli-gerekce-red-oldu").toEqual([]);
  });

  it("her ihlal mutasyonu bellekteki kopyada beklenen bulgu kimliğiyle RED olur", () => {
    const s = live();
    budget(
      MUTATIONS.map(([label]) => label),
      MUTATION_COUNT,
      "mutasyon",
    );
    // LOW-2 meta-negatif: BOŞ liste `every` altında HER yüklem için BOŞUNA doğrudur; kanıt + yasak.
    const vacuous: readonly string[] = [];
    expect(vacuous.every(Boolean), "iddiasiz-mutant-bosuna-gecer").toBe(true);
    const blank = MUTATIONS.filter(([, , ids]) => ids.length === 0).map(([label]) => label);
    expect(blank, `mutasyon-beklenen-kimlik-yok:\n${blank.join("\n")}`).toEqual([]);
    const unapplied = MUTATIONS.filter(([, m]) => JSON.stringify(m(s)) === JSON.stringify(s)).map(
      ([label]) => label,
    );
    expect(unapplied, `mutasyon-uygulanmadi:\n${unapplied.join("\n")}`).toEqual([]);
    const escaped = MUTATIONS.filter(([, mutate, expected]) => {
      const found = audit(mutate(s));
      return !expected.every((id) => found.includes(id));
    }).map(([label, , expected]) => `${label} => ${expected.join(" + ")}`);
    expect(escaped, `mutasyon-kacti:\n${escaped.join("\n")}`).toEqual([]);
  });

  it("meşru düzenleme yanlış pozitif üretmez", () => {
    const s = live();
    budget(
      LEGITIMATE.map(([label]) => label),
      LEGITIMATE_COUNT,
      "mesru",
    );
    const same = (a: Sources) => JSON.stringify(a) === JSON.stringify(s);
    const inert = LEGITIMATE.filter(([, mutate]) => same(mutate(s))).map(([label]) => label);
    expect(inert, `mesru-vaka-uygulanmadi:\n${inert.join("\n")}`).toEqual([]);
    const baseline = new Set(audit(s));
    // biome-ignore format: the false-positive fan-in stays one chained expression
    const blocked = LEGITIMATE.flatMap(([label, mutate]) =>
      audit(mutate(s)).filter((id) => !baseline.has(id)).map((id) => `${label} => ${id}`));
    expect(blocked, `mesru-duzenleme-red-oldu:\n${blocked.join("\n")}`).toEqual([]);
  });
});
