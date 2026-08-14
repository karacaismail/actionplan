/**
 * pr-size-core (ADR-0027 / short-code `short-pr-size`) — change-package ÖLÇÜM çekirdeği.
 *
 * SAFtır ve KARAR VERMEZ: bütçe eşiği, bant merdiveni, sınıf tavanı, kanıt kimliği ve çıkış kodu
 * burada YOKTUR. Çekirdek yalnız verilen numstat girdisini okur, yolu normalize eder, kategori
 * sözleşmesini doğrular ve kapanan bir muhasebe üretir; kanonik alandan eşik okuyup bandı ve
 * verdict'i karara bağlamak P2A-2 CLI'ının işidir.
 *
 * DÜRÜSTLÜK KURALI: ölçemediğini ne sıfır sayar ne ölçtüm diye iddia eder. Bozuk girdi, bozuk
 * kategori sözleşmesi ve normalize edilemeyen yol ÖLÇÜM YAPILMADAN yapısal hata döndürür ve
 * "paket çok büyük" gibi bir bütçe teşhisine ASLA dönüşmez.
 */
import fs from "node:fs";

/** Bütçenin sahiplendiği kaynak kökleri; bir kategori öneki bunları yutamaz. */
export const SOURCE_ROOTS = ["src/", "tests/", "tools/", "docs/"];
/** Kaynak kodu uzantıları: üretim dosyası kategori TAM YOLU olarak bütçeden gizlenemez. */
// biome-ignore format: the closed source-extension vocabulary stays compact for the shard budget
export const SOURCE_CODE_EXTENSIONS = [".ts", ".tsx", ".js", ".mjs", ".cjs", ".py", ".go", ".rs",
  ".java", ".kt", ".cs", ".php", ".rb", ".swift", ".vue", ".svelte"];
export const NUMERIC_FIELD = /^(0|[1-9][0-9]*)$/; // işaretsiz ASCII tamsayı; sıfır dolgusu yasak

const fail = (id, detail) => ({ ok: false, error: { id, detail } });
const quote = (value) => JSON.stringify(value);

/**
 * Yol YAZILIŞI DEĞİŞTİRİLMEZ: mutlak, sürücü harfli, NUL'lu, boş, `.`/`..`, çift segment,
 * KENAR BOŞLUKLU ya da TERS EĞİK ÇİZGİLİ yol REDdir; Unix'te `dist\hidden.ts` TEK bir addır ve
 * slash'a çevrilseydi üretim kodu "generated" kutusuna gizlenirdi — kırpma ile aynı sınıf.
 */
export const safePath = (raw) => {
  if (typeof raw !== "string" || !raw || /^\s|\s$|[\0\\]/.test(raw)) return null;
  if (raw.startsWith("/") || /^[A-Za-z]:\//.test(raw)) return null;
  return raw.split("/").some((s) => s === "" || s === "." || s === "..") ? null : raw;
};

/**
 * Rename satırı TEK dosyadır: hedef yol sayılır, kaynak yol ikinci kez sayılmaz. Süslü sözdizimi
 * bir dizin seviyesini kaldırabildiği için çift eğik çizgi yalnız BURADA kapanır; sonuç yine
 * `safePath`ten geçtiği için rename bir kaçış yoluna dönüşemez.
 */
export const renameTarget = (file) => {
  const braced = file.match(/^(.*)\{(.*) => (.*)\}(.*)$/);
  if (braced) return `${braced[1]}${braced[3]}${braced[4]}`.replace(/\/{2,}/g, "/");
  const plain = file.split(" => ");
  return plain.length === 2 ? plain[1] : file;
};

/**
 * Satır biçimi `<ekleme>\t<silme>\t<yol>`. Sayısal alan DOĞRULANMADAN Number()'a verilmez:
 * onaltılık, üstel, ondalık, boş, negatif, tam-genişlik ya da güvenli tamsayı aralığı dışındaki
 * bir alan sessizce kabul edilirse kapı "ölçemedim" yerine yanlış bir SAYI raporlar. `-` ikili
 * (satır olarak ölçülemeyen) değişikliktir: null KALIR, 0 OLMAZ.
 */
export const parseNumstat = (text) => {
  const rows = [];
  const invalid = [];
  const lines = String(text).split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].replace(/\r$/, ""); // CRLF yalnız SATIR düzeyinde; ad kırpılmaz
    if (!line.trim()) continue;
    const parts = line.split("\t");
    const file = parts.slice(2).join("\t");
    if (parts.length < 3 || !file.trim()) {
      invalid.push({ line: i + 1, detail: `alan sayısı veya yol eksik: ${quote(line)}` });
      continue;
    }
    const numeric = [parts[0], parts[1]];
    const bad = numeric.filter(
      (f) => f !== "-" && (!NUMERIC_FIELD.test(f) || !Number.isSafeInteger(Number(f))),
    );
    if (bad.length) {
      invalid.push({ line: i + 1, detail: `sayısal alan geçersiz: ${bad.map(quote).join(", ")}` });
      continue;
    }
    const [additions, deletions] = numeric.map((f) => (f === "-" ? null : Number(f)));
    rows.push({ additions, deletions, file: renameTarget(file) });
  }
  return { rows, invalid };
};

/**
 * Kategori sözleşmesi İKİ YÖNDEN doğrulanır. Önek kaynak kökünü YUTAMAZ — yutan önek tüm üretimi
 * "ayrı raporlanan" yapardı. Tam yol da güvenli olmak zorundadır ve bir kaynak kodu dosyası tam
 * yol olarak listelenip bütçe dışına çıkarılamaz; korumanın yalnız önek yarısı asimetrik olurdu.
 */
export const validateCategories = (categories, sourceRoots = SOURCE_ROOTS) => {
  if (!Array.isArray(categories) || categories.length === 0) return ["kategori listesi yok"];
  const errors = [];
  const seen = new Set();
  for (const category of categories) {
    const id = typeof category?.id === "string" ? category.id : "";
    const { paths, pathPrefixes } = category ?? {};
    if (!id || !Array.isArray(paths) || !Array.isArray(pathPrefixes)) {
      errors.push(`${id || "(kimliksiz)"}: id/paths/pathPrefixes eksik veya geçersiz`);
      continue;
    }
    if (seen.has(id)) errors.push(`${id}: kategori kimliği tekrarlı`);
    seen.add(id);
    for (const prefix of pathPrefixes) {
      const trimmed = typeof prefix === "string" ? prefix.replace(/\/+$/, "") : "";
      if (!trimmed || !safePath(trimmed)) errors.push(`${id}: güvensiz önek ${quote(prefix)}`);
      else if (sourceRoots.some((root) => root.startsWith(trimmed)))
        errors.push(`${id}: kaynak kökünü yutan önek ${quote(prefix)}`);
    }
    for (const exact of paths) {
      const safe = safePath(exact);
      if (!safe) errors.push(`${id}: güvensiz tam yol ${quote(exact)}`);
      else if (SOURCE_CODE_EXTENSIONS.some((ext) => safe.toLowerCase().endsWith(ext)))
        errors.push(`${id}: kaynak kodu tam yol olarak gizlenemez: ${safe}`);
    }
  }
  return errors;
};

/** Kategori sınırı SEGMENT sınırıdır: `generatedX/`, `dist-notreally/`, `x.json.bak` üretimdir. */
export const inCategory = (category, file) =>
  category.paths.includes(file) ||
  category.pathPrefixes.some((prefix) => file.startsWith(`${prefix.replace(/\/+$/, "")}/`));

// biome-ignore format: the zeroed measurement bucket stays compact for the shard budget
export const bucket = () => ({
  grossAdditions: 0, grossDeletions: 0, measuredNet: 0, gross: 0, files: 0,
});

/** İkili satır toplamı artırmaz (null 0 olmaz) ama dosya olarak sayılır ve ayrıca işaretlenir. */
export const accrue = (target, row) => {
  target.grossAdditions += row.additions ?? 0;
  target.grossDeletions += row.deletions ?? 0;
  target.measuredNet = target.grossAdditions - target.grossDeletions;
  target.gross = target.grossAdditions + target.grossDeletions;
  target.files += 1;
  return target;
};

/**
 * Tek deterministik ölçüm. Girdi, sözleşme veya yol güvenli değilse ÖLÇÜM YAPILMAZ ve hata kimliği
 * ölçemediğini söyler. Muhasebe kapanır: her satır ya bir kategoriye ya bütçeye yazılır, ikisine
 * birden değil; `totals` ikisinin toplamıdır ve ikili satır her iki yanda da işaretli kalır.
 */
export const measure = ({ numstat, categories, sourceRoots = SOURCE_ROOTS }) => {
  const configErrors = validateCategories(categories, sourceRoots);
  if (configErrors.length) return fail("category-config-invalid", configErrors.join("; "));
  const { rows, invalid } = parseNumstat(numstat);
  const badInput = invalid.map((i) => `satır ${i.line}: ${i.detail}`).join("; ");
  if (invalid.length) return fail("measurement-input-invalid", badInput);
  const unsafe = [...new Set(rows.filter((r) => !safePath(r.file)).map((r) => r.file))];
  if (unsafe.length) return fail("path-unsafe", `normalize edilemeyen yol: ${unsafe.join(", ")}`);
  const totals = bucket();
  const governed = bucket();
  const byCategory = new Map(categories.map((c) => [c.id, { id: c.id, ...bucket() }]));
  const binaryFiles = [];
  for (const row of rows) {
    const file = safePath(row.file);
    accrue(totals, row);
    if (row.additions === null || row.deletions === null) binaryFiles.push(file);
    const category = categories.find((c) => inCategory(c, file));
    accrue(category ? byCategory.get(category.id) : governed, row);
  }
  return { ok: true, totals, governed, categories: [...byCategory.values()], binaryFiles };
};

/**
 * Boru-güvenli TAM yazım. Node'da stdout bir pipe olduğunda `console.log` ASENKRONdur; hemen gelen
 * bir çıkış boşaltılmamış kuyruğu atar ve rapor tam da diff büyükken — kapının en çok gerektiği
 * anda — ortasından kesilir. Burada yazım senkron ve tamdır; non-blocking pipe EAGAIN döndürürse
 * yeniden denenir. Çekirdek süreç çıkışını SAHİPLENMEZ, yalnız yazımın tamamlandığını garanti eder.
 */
export const writeAllSync = (fd, text) => {
  const buffer = Buffer.from(text, "utf8");
  let written = 0;
  while (written < buffer.length) {
    try {
      written += fs.writeSync(fd, buffer, written, buffer.length - written);
    } catch (error) {
      if (error.code !== "EAGAIN") throw error;
    }
  }
  return written;
};
