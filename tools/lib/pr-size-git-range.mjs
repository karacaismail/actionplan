/**
 * pr-size-git-range (ADR-0027 / short-code `short-pr-size`) — change-package GİT ARALIĞI TOPLAMA
 * yüzeyi (P2B1a). SAF ÖLÇÜM burada DEĞİLdir: bu modül yalnız iki ref arasındaki `--numstat -z`
 * telini GÜVENLİ biçimde toplar; ölçüm/karar `pr-size-core.mjs` / `pr-size-decision.mjs`'nindir.
 *
 * KAPSAM DAR: yalnız `range` modu. Çalışma-ağacı modu, CLI entegrasyonu, kanonik durum ve
 * bütçe/eşik/bant kararı burada YOKTUR. Tek görev: verilen `repoRoot`/`base`/`head` için tam olarak
 * `git diff --no-ext-diff --no-textconv --numstat -z <mergeBase>..<head> --` telini, tek bir
 * hesaplanmış merge-base ile, alt kabuk olmadan ve zehirlenmiş miras ortam değişkenlerinden
 * etkilenmeden toplamak.
 *
 * FAIL-CLOSED: geçersiz kök/ref biçimi, sığ/olmayan/tamamlanmamış depo, çözülemeyen/çok-anlamlı/
 * commit-olmayan ref, birden fazla merge-base, sıfır-olmayan çıkış, SIFIR çıkışlı beklenmedik/
 * biçimsiz stderr, sinyal, zaman aşımı ve tampon taşması KARAR YERİNE adlandırılmış hata döndürür. Hata ayrıntısı HAM stderr, komut, ortam,
 * girdi ref metni veya mutlak yol TAŞIMAZ — yalnız kendi ürettiğimiz genel sınıflandırma cümlesi.
 *
 * GÜVENLİK: alt süreç `execFileSync`/`spawnSync` ile `shell:false`, SABİT `cwd`, sınırlı
 * `timeout`/`maxBuffer` ve TAM ortam ALLOWLIST'i ile çağrılır — miras ortamdan hiçbir `GIT_*`
 * değişkeni KOPYALANMAZ; yalnız burada açıkça belirlenen güvenli/noninteractive değerler set edilir.
 * Ağ/fetch/mutasyon YOKTUR; yalnız salt-okunur `rev-parse`/`merge-base`/`diff` çağrılır.
 */
import childProcess from "node:child_process";
import crypto from "node:crypto";

export const SOURCE = "range";
export const MAX_ROOT_LENGTH = 4096;
export const MAX_REF_LENGTH = 512;
export const DEFAULT_TIMEOUT_MS = 10_000;
export const DEFAULT_MAX_BUFFER_BYTES = 64 * 1024 * 1024;

const HEX_COMMIT = /^[0-9a-f]{40}$|^[0-9a-f]{64}$/i;
/**
 * Git ref adı için DAR izin listesi; bayrak/enjeksiyon görünümlü hiçbir karakter geçmez. `~`/`^`
 * göreli biçimlere (`HEAD~1`, `HEAD^`) izin verir; ikisi de git'e SÖZDİZİMSEL anlamı olan güvenli
 * karakterlerdir, kabuk metakarakteri DEĞİLdir (süreç `shell:false` ile çağrılır).
 */
const REF_SAFE = /^[A-Za-z0-9._/+~^-]+$/;

const fail = (id, detail) => ({ ok: false, error: { id, detail } });

/** Kök yalnız biçimce doğrulanır; var olup olmadığı ilk git çağrısında ortaya çıkar. */
export const validateRepoRoot = (value) => {
  if (typeof value !== "string" || value === "") return "root-empty-or-not-string";
  if (value.length > MAX_ROOT_LENGTH) return "root-too-long";
  if (value.includes("\0")) return "root-contains-nul";
  if (!value.startsWith("/")) return "root-not-absolute";
  return null;
};

/**
 * Ref biçimi DAR bir izin listesiyle kapanır: bayrakla başlayan (`-…`), boşluk/kabuk metakarakteri
 * taşıyan veya NUL içeren hiçbir değer git'e ULAŞMAZ. `--end-of-options` ayrıca ikinci bir savunma
 * katmanıdır; bu doğrulama onu gereksiz kılmaz, TAMAMLAR.
 */
export const validateRef = (value) => {
  if (typeof value !== "string" || value === "") return "ref-empty-or-not-string";
  if (value.length > MAX_REF_LENGTH) return "ref-too-long";
  if (value.includes("\0")) return "ref-contains-nul";
  if (value.startsWith("-")) return "ref-leading-dash";
  if (!REF_SAFE.test(value)) return "ref-invalid-characters";
  if (value.includes("..") || value.includes("//") || value.includes("@{"))
    return "ref-invalid-shape";
  return null;
};

/**
 * Miras ortam SIFIRDAN yeniden kurulur: yalnız burada adı geçen anahtarlar kopyalanır, yani hiçbir
 * `GIT_DIR`/`GIT_WORK_TREE`/`GIT_INDEX_FILE`/`GIT_CONFIG*`/`GIT_EXTERNAL_DIFF`/`GIT_DIFF_OPTS` ya
 * da benzeri depo/config geçersiz kılıcısı miras ALINAMAZ; bu bir kara liste değil beyaz listedir.
 * `HOME` yol çözümü için kopyalanır, ama global config `GIT_CONFIG_GLOBAL=/dev/null` ile AÇIKÇA
 * kapatılır: aksi halde `~/.gitconfig` (örn. `core.attributesFile` ile `* binary`) saf metin farkını
 * sayılamaz hale getirip bütçeyi sessizce sıfırlayabilirdi. Sistem config'i `GIT_CONFIG_NOSYSTEM`
 * ile kapalı KALIR; iki katman birlikte aranır.
 */
export const sanitizeEnv = (parentEnv = {}) => {
  const safe = {};
  for (const key of ["PATH", "HOME", "TMPDIR", "USER", "LOGNAME"])
    if (typeof parentEnv[key] === "string") safe[key] = parentEnv[key];
  if (!safe.PATH) safe.PATH = "/usr/bin:/bin:/usr/local/bin";
  return {
    ...safe,
    GIT_TERMINAL_PROMPT: "0",
    GIT_PAGER: "cat",
    GIT_ASKPASS: "true",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_OPTIONAL_LOCKS: "0",
    LC_ALL: "C",
  };
};

/** Boru-güvenli varsayılan yürütücü: `shell:false`, sabit `cwd`, sınırlı süre/tampon, Buffer stdout. */
export const defaultExecutor = (args, { cwd, env, timeoutMs, maxBufferBytes }) =>
  childProcess.spawnSync("git", args, {
    cwd,
    env,
    timeout: timeoutMs,
    maxBuffer: maxBufferBytes,
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
  });

/** Yürütücü sonucu tek bir sınıfa indirgenir; sınıf adı raporun TEK içeriğidir, ham neden DEĞİL. */
const classify = (result) => {
  const code = result?.error?.code;
  if (code === "ETIMEDOUT") return "timeout";
  if (code === "ENOBUFS") return "maxbuffer";
  if (result?.error) return "spawn-error";
  if (result?.signal) return "signal";
  if (typeof result?.status !== "number" || result.status !== 0) return "nonzero";
  return null;
};

const CLASS_ERROR_ID = {
  timeout: "git-timeout",
  maxbuffer: "git-maxbuffer-exceeded",
  "spawn-error": "git-spawn-error",
  signal: "git-signal-terminated",
  nonzero: "git-nonzero-exit",
};

const runGit = (executor, args, opts) => {
  let result;
  try {
    result = executor(args, opts);
  } catch {
    return fail("git-spawn-threw", "git süreci başlatılamadı");
  }
  const problem = classify(result);
  if (problem) return fail(CLASS_ERROR_ID[problem], `git komutu tamamlanamadı: ${problem}`);
  if (!Buffer.isBuffer(result.stdout))
    return fail("git-output-not-buffer", "git çıktısı beklenen biçimde değil");
  /**
   * BAŞARILI bir git çağrısı SESSİZ olmalıdır. `warning: refname 'x' is ambiguous` gibi tanı
   * satırları SIFIR çıkışla gelir ve yanlış ref'in sessizce ölçülmesine yol açar; biçimsiz
   * (Buffer olmayan/eksik) stderr ise sözleşme dışıdır. İkisi de fail-closed durur ve stderr
   * İÇERİĞİ rapora ASLA taşınmaz.
   */
  if (!Buffer.isBuffer(result.stderr) || result.stderr.length !== 0)
    return fail("git-unexpected-stderr", "git komutu beklenmedik tanı çıktısı üretti");
  return { ok: true, stdout: result.stdout };
};

const utf8 = new TextDecoder("utf-8", { fatal: true });
const linesOf = (buffer) =>
  buffer
    .toString("utf8")
    .split("\n")
    .filter((line) => line !== "");

/**
 * Tek deterministik toplama: kök/ref biçimi → depo/sığlık → base/head commit çözümü → TEK
 * merge-base → `--numstat -z` teli. Her adım fail-closed durur; kısmi sonuç ASLA sızmaz.
 */
export const collectRange = ({
  repoRoot,
  base,
  head,
  executor = defaultExecutor,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxBufferBytes = DEFAULT_MAX_BUFFER_BYTES,
} = {}) => {
  const rootError = validateRepoRoot(repoRoot);
  if (rootError) return fail(rootError, "repoRoot biçimi geçersiz");
  const baseError = validateRef(base);
  if (baseError) return fail(`base-${baseError}`, "base ref biçimi geçersiz");
  const headError = validateRef(head);
  if (headError) return fail(`head-${headError}`, "head ref biçimi geçersiz");

  const opts = { cwd: repoRoot, env: sanitizeEnv(process.env), timeoutMs, maxBufferBytes };
  const run = (args) => runGit(executor, args, opts);

  const inside = run(["rev-parse", "--is-inside-work-tree"]);
  if (!inside.ok || inside.stdout.toString("utf8").trim() !== "true")
    return fail("repo-not-found", "verilen kök geçerli bir git deposu değil");

  const shallow = run(["rev-parse", "--is-shallow-repository"]);
  if (!shallow.ok) return fail("repo-not-found", "verilen kök geçerli bir git deposu değil");
  if (shallow.stdout.toString("utf8").trim() !== "false")
    return fail("repo-shallow", "sığ (shallow) veya tamamlanmamış depo reddedildi");

  const resolveCommit = (role, ref) => {
    const result = run(["rev-parse", "--verify", "--end-of-options", `${ref}^{commit}`]);
    if (!result.ok) return fail(`${role}-ref-unresolved`, `${role} ref çözülemedi`);
    const lines = linesOf(result.stdout);
    if (lines.length !== 1 || !HEX_COMMIT.test(lines[0]))
      return fail(`${role}-ref-unresolved`, `${role} ref tek bir commit'e çözülemedi`);
    return { ok: true, hash: lines[0].toLowerCase() };
  };

  const baseResolved = resolveCommit("base", base);
  if (!baseResolved.ok) return baseResolved;
  const headResolved = resolveCommit("head", head);
  if (!headResolved.ok) return headResolved;

  const mergeBaseResult = run(["merge-base", "--all", baseResolved.hash, headResolved.hash]);
  if (!mergeBaseResult.ok) return fail("merge-base-unresolved", "merge-base hesaplanamadı");
  const mergeBaseLines = linesOf(mergeBaseResult.stdout);
  if (mergeBaseLines.length === 0) return fail("merge-base-none", "ortak ata (merge-base) yok");
  if (mergeBaseLines.length > 1)
    return fail("merge-base-ambiguous", "birden fazla merge-base bulundu");
  const [mergeBase] = mergeBaseLines;
  if (!HEX_COMMIT.test(mergeBase))
    return fail("merge-base-unresolved", "merge-base biçimi geçersiz");

  const diffResult = run([
    "diff",
    "--no-ext-diff",
    "--no-textconv",
    "--numstat",
    "-z",
    `${mergeBase.toLowerCase()}..${headResolved.hash}`,
    "--",
  ]);
  if (!diffResult.ok) return diffResult;

  let numstatZ;
  try {
    numstatZ = utf8.decode(diffResult.stdout);
  } catch {
    return fail("diff-output-not-utf8", "diff çıktısı geçerli UTF-8 değil");
  }

  return {
    ok: true,
    numstatZ,
    metadata: {
      source: SOURCE,
      base: baseResolved.hash,
      head: headResolved.hash,
      mergeBase: mergeBase.toLowerCase(),
      byteLength: diffResult.stdout.length,
      sha256: crypto.createHash("sha256").update(diffResult.stdout).digest("hex"),
    },
  };
};
