/**
 * pr-size-git-working-tree (ADR-0027 / short-code `short-pr-size`) — change-package ÇALIŞMA AĞACI
 * TOPLAMA yüzeyi (P2B2a-1 ÇEKİRDEK). SAF ÖLÇÜM burada DEĞİLdir: bu modül yalnız HEAD'e göre
 * çalışma ağacının `--numstat -z` telini toplar; ölçüm/karar `pr-size-core.mjs` /
 * `pr-size-decision.mjs`'nindir. CLI, kanonik durum ve bütçe/eşik/bant kararı burada YOKTUR.
 *
 * SEMANTİK: staged ve unstaged AŞAMALAR TOPLANMAZ — `git diff HEAD` NİHAİ durumu tek satır verir.
 * İzlenmeyen dosya o farkta hiç görünmediği için ayrıca listelenir ve her biri `--no-index` ile
 * `/dev/null`'a karşı ölçülür; `.gitignore` kapsamı `--exclude-standard` ile dışarıda kalır. İki
 * liste birleştirilip yol BAYT sırasına göre yeniden çerçevelenir: aynı ağaç her çağrıda bayt bayt
 * aynı teli üretir ve rename satırı yalnız HEDEF yolu bir kez taşır.
 *
 * FAIL-CLOSED: geçersiz/tepe-olmayan kök, olmayan/sığ depo, doğmamış HEAD, çakışmalı ağaç, güvensiz/kaybolan/
 * düzenli-olmayan izlenmeyen yol, iki listenin ÖRTÜŞMESİ, kaynak sınırı aşımı, sıfır-olmayan çıkış,
 * SIFIR çıkışlı beklenmedik stderr, sinyal, zaman aşımı, tampon taşması ve UTF-8/çerçeve bozukluğu
 * KARAR YERİNE adlandırılmış hata döndürür; ayrıntı ham stderr, yol veya mutlak kök TAŞIMAZ.
 *
 * MUTASYONSUZLUK: yalnız salt-okunur `rev-parse`/`ls-files`/`diff` çağrılır ve `GIT_OPTIONAL_LOCKS=0`
 * ile indeks tazelenip YAZILMAZ; nesne deposu ve refler dokunulmadan kalır. Ağ/fetch YOKTUR. Süreç
 * sertleştirmesi (shell:false, sabit `cwd`, sınırlı süre/tampon, TAM ortam allowlist'i)
 * `pr-size-git-range.mjs` ile ORTAKtır: birinde kapanan kaçak diğerinde açık kalamaz.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { parseNumstatZ, safePath } from "./pr-size-core.mjs";
import { defaultExecutor, sanitizeEnv, validateRepoRoot } from "./pr-size-git-range.mjs";

export const SOURCE = "working-tree";
export const DEFAULT_TIMEOUT_MS = 10_000;
export const DEFAULT_MAX_BUFFER_BYTES = 64 * 1024 * 1024;
/**
 * İzlenmeyen dosya BAŞINA bir `--no-index` süreci doğar; bu sınır o süreç sayısını üstten kapatır.
 * Ölçüm eşiği DEĞİLdir — kanonik bant/sınıf tavanları burada kopyalanmaz.
 */
export const MAX_UNTRACKED_PATHS = 4000;

const HEX_COMMIT = /^[0-9a-f]{40}$|^[0-9a-f]{64}$/i;
const DIFF_BASE = ["diff", "--no-ext-diff", "--no-textconv", "--numstat", "-z"];
const fail = (id, detail) => ({ ok: false, error: { id, detail } });
const utf8 = new TextDecoder("utf-8", { fatal: true });

/** Yürütücü sonucu tek bir sınıfa indirgenir; sınıf adı raporun TEK içeriğidir, ham neden DEĞİL. */
const CLASS_ERROR_ID = {
  timeout: "git-timeout",
  maxbuffer: "git-maxbuffer-exceeded",
  "spawn-error": "git-spawn-error",
  signal: "git-signal-terminated",
  nonzero: "git-nonzero-exit",
};

const classify = (result, allowed) => {
  const code = result?.error?.code;
  if (code === "ETIMEDOUT") return "timeout";
  if (code === "ENOBUFS") return "maxbuffer";
  if (result?.error) return "spawn-error";
  if (result?.signal) return "signal";
  if (typeof result?.status !== "number" || !allowed.includes(result.status)) return "nonzero";
  return null;
};

/**
 * `allowed` çoğunlukla `[0]`'dır; YALNIZ `--no-index` için `[0, 1]` olur, orada 1 "fark var" demektir. Beklenen çıkış çağıran tarafta ayrıca doğrulanır, böylece "fark yok" (0) sessizce
 * boş ölçüme dönüşemez. BAŞARILI bir git çağrısı ayrıca SESSİZ olmalıdır: `warning: …` gibi tanı
 * satırları SIFIR çıkışla gelip yanlış ağacın sessizce ölçülmesine yol açar, o yüzden boş olmayan
 * stderr fail-closed durur ve stderr İÇERİĞİ rapora ASLA taşınmaz.
 */
const runGit = (executor, args, opts, allowed = [0]) => {
  let result;
  try {
    result = executor(args, opts);
  } catch {
    return fail("git-spawn-threw", "git süreci başlatılamadı");
  }
  const problem = classify(result, allowed);
  if (problem) return fail(CLASS_ERROR_ID[problem], `git komutu tamamlanamadı: ${problem}`);
  if (!Buffer.isBuffer(result.stdout))
    return fail("git-output-not-buffer", "git çıktısı beklenen biçimde değil");
  if (!Buffer.isBuffer(result.stderr) || result.stderr.length !== 0)
    return fail("git-unexpected-stderr", "git komutu beklenmedik tanı çıktısı üretti");
  return { ok: true, stdout: result.stdout, status: result.status };
};

/** Realpath ile kanonikleşir (bağlı worktree/takma ad); çözülemeyen yol sözlükseldir, ASLA atmaz. */
const canonicalDir = (value) => {
  try {
    return fs.realpathSync(value);
  } catch {
    return path.resolve(value);
  }
};

const decode = (buffer, id, detail) => {
  try {
    return { ok: true, text: utf8.decode(buffer) };
  } catch {
    return fail(id, detail);
  }
};

/**
 * NUL çerçevesi kapanmak ZORUNDADIR: kesik akış eksik listeyi "temiz ağaç" gibi gösterirdi. Boş
 * kayıt da reddedilir; adsız bir yol sözleşme dışıdır.
 */
const splitZ = (text) => {
  if (text === "") return [];
  if (!text.endsWith("\0")) return null;
  const parts = text.slice(0, -1).split("\0");
  return parts.some((part) => part === "") ? null : parts;
};

const field = (value) => (value === null ? "-" : String(value));
const frame = (rows) =>
  rows.map((row) => `${field(row.additions)}\t${field(row.deletions)}\t${row.file}\0`).join("");
/** Sıralama git'in kendi sırası gibi BAYT düzeyindedir; UTF-16 kod birimi sırası değil. */
const byPathBytes = (a, b) =>
  Buffer.compare(Buffer.from(a.file, "utf8"), Buffer.from(b.file, "utf8"));

/** İzlenen tel doğrudan git'ten gelir: çerçeve, UTF-8 ve yol güvenliği ayrı ayrı kapanır. */
const readTracked = (run) => {
  const result = run([...DIFF_BASE, "HEAD", "--"]);
  if (!result.ok) return result;
  const read = decode(result.stdout, "tracked-output-not-utf8", "izlenen tel UTF-8 değil");
  if (!read.ok) return read;
  const parsed = parseNumstatZ(read.text);
  if (parsed.invalid.length)
    return fail("tracked-output-malformed", "izlenen tel NUL çerçevesine uymuyor");
  for (const row of parsed.rows)
    if (!safePath(row.file))
      return fail("tracked-path-unsafe", "izlenen tel normalize edilemeyen yol taşıyor");
  return { ok: true, rows: parsed.rows };
};

/**
 * İzlenmeyen TEK dosya `/dev/null`'a karşı ölçülür. Yol `--` sonrasında verilir, dolayısıyla bayrak
 * olarak yorumlanamaz; git'in döndürdüğü ad beklenenle EŞLEŞMEK zorundadır, aksi halde başka bir
 * dosyanın ölçüsü bu ada yazılırdı.
 */
const readUntrackedFile = (run, file) => {
  const result = run([...DIFF_BASE, "--no-index", "--", "/dev/null", file], [0, 1]);
  if (!result.ok) return result;
  if (result.status !== 1)
    return fail("untracked-diff-unexpected-exit", "`--no-index` belgelenmiş fark çıkışını vermedi");
  const read = decode(result.stdout, "untracked-diff-malformed", "`--no-index` teli UTF-8 değil");
  if (!read.ok) return read;
  const parsed = parseNumstatZ(read.text);
  if (parsed.invalid.length || parsed.rows.length !== 1)
    return fail("untracked-diff-malformed", "`--no-index` teli tek geçerli satır vermedi");
  const [row] = parsed.rows;
  if (row.file !== file)
    return fail("untracked-diff-path-mismatch", "`--no-index` beklenenden başka bir yol döndürdü");
  return { ok: true, row };
};

/**
 * Her yol ÖNCE doğrulanır (çerçeve, sınır, güvenlik, örtüşme), SONRA ölçülür: güvensiz bir yol için
 * hiçbir alt süreç doğmaz. Sembolik bağ KABUL edilir ve hedefine AÇILMAZ — git bağın kendi yol
 * metnini ölçer; FIFO/aygıt gibi düzenli-olmayan yol ise okuma sonsuza kadar bloklayabileceği için
 * git'e HİÇ verilmez.
 */
const readUntracked = (run, repoRoot, trackedFiles) => {
  const listed = run(["ls-files", "--others", "--exclude-standard", "-z"]);
  if (!listed.ok) return listed;
  const read = decode(listed.stdout, "untracked-output-not-utf8", "izlenmeyen liste UTF-8 değil");
  if (!read.ok) return read;
  const files = splitZ(read.text);
  if (files === null)
    return fail("untracked-output-malformed", "izlenmeyen listede NUL çerçevesi kapanmadı");
  if (files.length > MAX_UNTRACKED_PATHS)
    return fail("untracked-too-many", "izlenmeyen yol sayısı kaynak sınırını aşıyor");
  const rows = [];
  for (const file of files) {
    if (!safePath(file)) return fail("untracked-path-unsafe", "izlenmeyen yol normalize edilemedi");
    if (trackedFiles.has(file))
      return fail("untracked-tracked-overlap", "aynı yol iki listede birden göründü");
    let stat;
    try {
      stat = fs.lstatSync(`${repoRoot}/${file}`);
    } catch {
      return fail("untracked-path-disappeared", "listelenen izlenmeyen yol artık yok");
    }
    if (!stat.isFile() && !stat.isSymbolicLink())
      return fail("untracked-path-not-regular-file", "izlenmeyen yol düzenli bir dosya değil");
    const measured = readUntrackedFile(run, file);
    if (!measured.ok) return measured;
    rows.push(measured.row);
  }
  return { ok: true, rows };
};

/**
 * Tek deterministik toplama: kök biçimi → depo/sığlık → HEAD commit'i → çakışma → izlenen tel →
 * izlenmeyen tel → tek kanonik çerçeve. Her adım fail-closed durur; kısmi sonuç ASLA sızmaz.
 */
export const collectWorkingTree = ({
  repoRoot,
  executor = defaultExecutor,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxBufferBytes = DEFAULT_MAX_BUFFER_BYTES,
} = {}) => {
  const rootError = validateRepoRoot(repoRoot);
  if (rootError) return fail(rootError, "repoRoot biçimi geçersiz");
  const opts = { cwd: repoRoot, env: sanitizeEnv(process.env), timeoutMs, maxBufferBytes };
  const run = (args, allowed) => runGit(executor, args, opts, allowed);
  const text = (result) => result.stdout.toString("utf8").trim();

  const inside = run(["rev-parse", "--is-inside-work-tree"]);
  if (!inside.ok || text(inside) !== "true")
    return fail("repo-not-found", "verilen kök geçerli bir git deposu değil");
  // Kök TAM OLARAK tepe olmalı: alt dizinde `diff` yolu KÖKE, `ls-files --others` yolu CWD'ye
  // görelidir; iki liste sessizce FARKLI tabanda birleşirdi (sahte örtüşme / yanlış kategori).
  const toplevel = run(["rev-parse", "--show-toplevel"]);
  if (!toplevel.ok || canonicalDir(repoRoot) !== canonicalDir(text(toplevel)))
    return fail("root-not-worktree-toplevel", "repoRoot çalışma ağacının tepesi değil");

  const shallow = run(["rev-parse", "--is-shallow-repository"]);
  if (!shallow.ok) return fail("repo-not-found", "verilen kök geçerli bir git deposu değil");
  if (text(shallow) !== "false")
    return fail("repo-shallow", "sığ (shallow) veya tamamlanmamış depo reddedildi");

  /** Doğmamış dalda `HEAD^{commit}` çözülmez; bu bir git arızası değil, ÖLÇÜLEMEZ bir durumdur. */
  const resolved = run(["rev-parse", "--verify", "--end-of-options", "HEAD^{commit}"]);
  const head = resolved.ok ? text(resolved) : "";
  if (!HEX_COMMIT.test(head))
    return fail("head-unborn", "HEAD tek bir commit'e çözülemedi (doğmamış dal)");

  /** Çakışmalı ağaçta diff çakışma İŞARETLERİNİ gerçek değişiklik gibi sayardı; önce durulur. */
  const unmerged = run(["ls-files", "--unmerged", "-z"]);
  if (!unmerged.ok) return unmerged;
  if (unmerged.stdout.length !== 0)
    return fail("repo-unmerged", "çakışması çözülmemiş (unmerged) ağaç reddedildi");

  const tracked = readTracked(run);
  if (!tracked.ok) return tracked;
  const untracked = readUntracked(run, repoRoot, new Set(tracked.rows.map((row) => row.file)));
  if (!untracked.ok) return untracked;

  const numstatZ = frame([...tracked.rows, ...untracked.rows].sort(byPathBytes));
  const bytes = Buffer.from(numstatZ, "utf8");
  return {
    ok: true,
    numstatZ,
    metadata: {
      source: SOURCE,
      head: head.toLowerCase(),
      byteLength: bytes.length,
      sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    },
  };
};
