import childProcess, { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

// P2B1a: change-package GİT ARALIĞI TOPLAMA yüzeyi. Burada ÖLÇÜM/KARAR YOKTUR — yalnız iki ref
// arasındaki `--numstat -z` telinin GÜVENLİ toplanması test edilir: kabuk yok, sabit cwd, sınırlı
// süre/tampon, allowlist ortam, tek merge-base, ham stderr/komut/ortam/ref/yol SIZINTISI yok.
const ROOT = process.cwd();
const MODULE = "tools/lib/pr-size-git-range.mjs";
// biome-ignore lint/suspicious/noExplicitAny: shipped pure JavaScript module has no declaration file.
const range: any = await import(pathToFileURL(path.join(ROOT, MODULE)).href);

const runGit = (cwd: string, args: string[]) => {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} başarısız: ${result.stderr}`);
  return result.stdout.trim();
};

const initRepo = (dir: string) => {
  fs.mkdirSync(dir, { recursive: true });
  runGit(dir, ["init", "-q", "-b", "main"]);
  runGit(dir, ["config", "user.email", "range-test@example.com"]);
  runGit(dir, ["config", "user.name", "range-test"]);
};

const commitFile = (dir: string, file: string, content: string, message: string) => {
  fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  fs.writeFileSync(path.join(dir, file), content);
  runGit(dir, ["add", "--", file]);
  runGit(dir, ["commit", "-q", "-m", message]);
  return runGit(dir, ["rev-parse", "HEAD"]);
};

let tmpDirs: string[] = [];
const makeTmpDir = (label: string) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `pr-size-git-range-${label}-`));
  tmpDirs.push(dir);
  return dir;
};

/** Miras ortamı geçici olarak zehirler ve `finally` ile eski değere (ya da yokluğa) döndürür. */
const withEnv = (overrides: Record<string, string>, run: () => void) => {
  const saved = Object.keys(overrides).map((k) => [k, process.env[k]] as const);
  Object.assign(process.env, overrides);
  try {
    run();
  } finally {
    for (const [k, v] of saved) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
};

afterEach(() => {
  for (const dir of tmpDirs) fs.rmSync(dir, { recursive: true, force: true });
  tmpDirs = [];
  vi.restoreAllMocks();
});

describe("pr-size-git-range — kök ve ref biçim doğrulaması (git ASLA çağrılmaz)", () => {
  it("geçersiz repoRoot biçimleri git çağrılmadan reddedilir", () => {
    const executor = vi.fn();
    // biome-ignore format: the invalid-root fixture set stays compact for the shard budget
    const badRoots = [undefined, null, 123, "", "relative/path", "/x".repeat(3000),
      `/tmp/${"a".repeat(10)}\0x`];
    for (const repoRoot of badRoots) {
      const result = range.collectRange({ repoRoot, base: "main", head: "main", executor });
      expect(result.ok, `kabul edilmemeliydi: ${JSON.stringify(repoRoot)}`).toBe(false);
    }
    expect(executor).not.toHaveBeenCalled();
  });

  it("bayrak/enjeksiyon görünümlü ref biçimleri git çağrılmadan reddedilir", () => {
    const executor = vi.fn();
    // biome-ignore format: the adversarial ref fixture set stays compact for the shard budget
    const badRefs = ["-x", "--upload-pack=/bin/sh", "; rm -rf /", "a b", "$(whoami)", "`id`",
      "a\0b", "a".repeat(1000), "a..b", "a//b", "a@{1}", "", " "];
    for (const ref of badRefs) {
      const asBase = range.collectRange({ repoRoot: "/tmp", base: ref, head: "main", executor });
      const asHead = range.collectRange({ repoRoot: "/tmp", base: "main", head: ref, executor });
      expect(asBase.ok, `base reddedilmeliydi: ${JSON.stringify(ref)}`).toBe(false);
      expect(asHead.ok, `head reddedilmeliydi: ${JSON.stringify(ref)}`).toBe(false);
    }
    expect(executor, "hiçbir enjeksiyon denemesi süreç başlatmamalı").not.toHaveBeenCalled();
  });

  it("hata gövdesi ne ham ref metnini ne mutlak yolu taşır", () => {
    const executor = vi.fn();
    const result = range.collectRange({
      repoRoot: "/tmp",
      base: "; cat /etc/passwd #",
      head: "main",
      executor,
    });
    expect(result.ok).toBe(false);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("/etc/passwd");
    expect(serialized).not.toContain("cat");
  });
});

describe("pr-size-git-range — gerçek geçici depo üzerinde uçtan uca toplama", () => {
  it("kök-cwd bağımsızdır: process.cwd() başka yerdeyken de doğru depoyu ölçer", () => {
    const dir = makeTmpDir("cwd-independence");
    initRepo(dir);
    commitFile(dir, "a.txt", "one\n", "init");
    const elsewhere = makeTmpDir("elsewhere");
    const previousCwd = process.cwd();
    process.chdir(elsewhere);
    try {
      const result = range.collectRange({ repoRoot: dir, base: "main", head: "main" });
      expect(result.ok).toBe(true);
    } finally {
      process.chdir(previousCwd);
    }
  });

  it("ayrışan dallarda merge-base semantiği: yalnız ortak atadan SONRAKİ değişiklik ölçülür", () => {
    const dir = makeTmpDir("divergent");
    initRepo(dir);
    commitFile(dir, "shared.txt", "base\n", "ortak ata");
    runGit(dir, ["branch", "feature"]);
    commitFile(dir, "base-only.txt", "base tarafı\n", "yalnız base dalında");
    runGit(dir, ["checkout", "-q", "feature"]);
    commitFile(dir, "feature.txt", "feature tarafı\n", "yalnız feature dalında");
    const result = range.collectRange({ repoRoot: dir, base: "main", head: "feature" });
    expect(result.ok).toBe(true);
    expect(result.numstatZ).toContain("feature.txt");
    // base dalına özgü dosya, ortak atadan feature'a giden aralıkta GÖRÜNMEMELİ.
    expect(result.numstatZ).not.toContain("base-only.txt");
    const mergeBaseHash = runGit(dir, ["merge-base", "main", "feature"]);
    expect(result.metadata.mergeBase).toBe(mergeBaseHash);
    expect(result.metadata.head).toBe(runGit(dir, ["rev-parse", "feature"]));
  });

  it("rename ve alışılmadık dosya adları NUL çerçevesinde korunur", () => {
    const dir = makeTmpDir("rename-unicode");
    initRepo(dir);
    commitFile(dir, "old-name.txt", "içerik\n", "init");
    runGit(dir, ["mv", "old-name.txt", "yeni-ad ç ğ ş 日本.txt"]);
    runGit(dir, ["commit", "-q", "-m", "rename + unicode"]);
    const result = range.collectRange({ repoRoot: dir, base: "HEAD~1", head: "HEAD" });
    expect(result.ok).toBe(true);
    expect(result.numstatZ).toContain("yeni-ad ç ğ ş 日本.txt");
  });

  it("ikili (binary) satır telde `-\\t-\\t` olarak, ölçülmeden korunur", () => {
    const dir = makeTmpDir("binary");
    initRepo(dir);
    commitFile(dir, ".gitattributes", "*.bin -text\n", "init");
    fs.writeFileSync(path.join(dir, "blob.bin"), Buffer.from([0, 1, 2, 255, 254]));
    runGit(dir, ["add", "--", "blob.bin"]);
    runGit(dir, ["commit", "-q", "-m", "ikili dosya"]);
    const result = range.collectRange({ repoRoot: dir, base: "HEAD~1", head: "HEAD" });
    expect(result.ok).toBe(true);
    expect(result.numstatZ).toContain("-\t-\tblob.bin\0");
  });

  it("zehirlenmiş miras GIT_DIR/GIT_INDEX_FILE ortamı NÖTRLENİR", () => {
    const dir = makeTmpDir("poisoned-env");
    initRepo(dir);
    commitFile(dir, "a.txt", "one\n", "init");
    const decoy = makeTmpDir("decoy");
    initRepo(decoy);
    const poison = {
      GIT_DIR: path.join(decoy, ".git"),
      GIT_INDEX_FILE: path.join(decoy, ".git", "index"),
      GIT_WORK_TREE: decoy,
    };
    withEnv(poison, () => {
      const result = range.collectRange({ repoRoot: dir, base: "main", head: "main" });
      expect(result.ok, "zehirli GIT_DIR toplamayı bozmamalı").toBe(true);
    });
  });

  it("düşman global ~/.gitconfig (core.attributesFile) ölçümü ikiliye çeviremez", () => {
    const dir = makeTmpDir("hostile-global-config");
    initRepo(dir);
    commitFile(dir, "a.txt", "one\n", "init");
    commitFile(dir, "a.txt", "two\n", "second");
    const home = makeTmpDir("hostile-home");
    fs.writeFileSync(path.join(home, "attributes"), "* binary\n");
    fs.writeFileSync(
      path.join(home, ".gitconfig"),
      `[core]\n\tattributesFile = ${path.join(home, "attributes")}\n`,
    );
    withEnv({ HOME: home, XDG_CONFIG_HOME: home }, () => {
      const result = range.collectRange({ repoRoot: dir, base: "HEAD~1", head: "HEAD" });
      expect(result.ok).toBe(true);
      // Saf metin değişikliği SAYILABİLİR kalmalı; `-\t-` sessiz bütçe sıfırlaması demektir.
      expect(result.numstatZ).toBe("1\t1\ta.txt\0");
    });
  });

  it("gerçekten çok-anlamlı ref (aynı adda dal ve etiket) fail-closed reddedilir", () => {
    const dir = makeTmpDir("ambiguous-ref");
    initRepo(dir);
    commitFile(dir, "a.txt", "one\n", "init");
    runGit(dir, ["branch", "dup"]);
    commitFile(dir, "b.txt", "two\n", "second");
    runGit(dir, ["tag", "dup", "HEAD"]);
    const result = range.collectRange({ repoRoot: dir, base: "main", head: "dup" });
    expect(result.ok, "aynı adda dal+etiket sessizce çözülmemeli").toBe(false);
    expect(result.error.id).toBe("head-ref-unresolved");
    expect(JSON.stringify(result)).not.toContain("ambiguous");
  });

  it("sığ (shallow) depo reddedilir", () => {
    const origin = makeTmpDir("shallow-origin");
    initRepo(origin);
    commitFile(origin, "a.txt", "one\n", "init");
    commitFile(origin, "a.txt", "two\n", "second");
    const clone = makeTmpDir("shallow-clone");
    fs.rmSync(clone, { recursive: true, force: true });
    const cloneResult = spawnSync(
      "git",
      ["clone", "-q", "--depth", "1", "--no-local", `file://${origin}`, clone],
      { encoding: "utf8" },
    );
    expect(cloneResult.status, cloneResult.stderr).toBe(0);
    const result = range.collectRange({ repoRoot: clone, base: "HEAD", head: "HEAD" });
    expect(result.ok).toBe(false);
    expect(result.error.id).toBe("repo-shallow");
  });

  it("git deposu olmayan bir kök repo-not-found ile reddedilir", () => {
    const dir = makeTmpDir("not-a-repo");
    const result = range.collectRange({ repoRoot: dir, base: "main", head: "main" });
    expect(result.ok).toBe(false);
    expect(result.error.id).toBe("repo-not-found");
  });

  it("aynı değişmez ref çifti için sonuç DETERMİNİSTİKtir", () => {
    const dir = makeTmpDir("deterministic");
    initRepo(dir);
    commitFile(dir, "a.txt", "one\n", "init");
    commitFile(dir, "b.txt", "two\n", "second");
    const first = range.collectRange({ repoRoot: dir, base: "HEAD~1", head: "HEAD" });
    const second = range.collectRange({ repoRoot: dir, base: "HEAD~1", head: "HEAD" });
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(second.numstatZ).toBe(first.numstatZ);
    expect(second.metadata).toEqual(first.metadata);
  });

  it("çıktı biçimi kesindir: yalnız ok/numstatZ/metadata, metadata yalnız beş alan", () => {
    const dir = makeTmpDir("shape");
    initRepo(dir);
    commitFile(dir, "a.txt", "one\n", "init");
    const result = range.collectRange({ repoRoot: dir, base: "main", head: "main" });
    expect(result.ok).toBe(true);
    expect(Object.keys(result).sort()).toEqual(["metadata", "numstatZ", "ok"]);
    expect(Object.keys(result.metadata).sort()).toEqual(
      ["base", "byteLength", "head", "mergeBase", "sha256", "source"].sort(),
    );
    expect(result.metadata.source).toBe("range");
    expect(result.metadata.base).toMatch(/^[0-9a-f]{40}$/);
    expect(result.metadata.head).toMatch(/^[0-9a-f]{40}$/);
    expect(result.metadata.mergeBase).toMatch(/^[0-9a-f]{40}$/);
    expect(result.metadata.byteLength).toBe(Buffer.byteLength(result.numstatZ, "utf8"));
  });
});

describe("pr-size-git-range — gerçek yürütücüde shell/argv sözleşmesi", () => {
  it("varsayılan yürütücü spawnSync'i shell:false ve dizi argv ile çağırır", () => {
    const spy = vi.spyOn(childProcess, "spawnSync");
    const dir = makeTmpDir("shell-contract");
    initRepo(dir);
    commitFile(dir, "a.txt", "one\n", "init");
    const result = range.collectRange({ repoRoot: dir, base: "main", head: "main" });
    expect(result.ok).toBe(true);
    expect(spy).toHaveBeenCalled();
    for (const call of spy.mock.calls) {
      expect(call[0]).toBe("git");
      expect(Array.isArray(call[1])).toBe(true);
      for (const arg of call[1] as unknown[]) expect(typeof arg).toBe("string");
      const options = call[2] as Record<string, unknown>;
      expect(options.shell).toBe(false);
      expect(options.cwd).toBe(dir);
      expect(typeof options.timeout).toBe("number");
      expect(typeof options.maxBuffer).toBe("number");
    }
  });

  it("son diff çağrısı tam kanonik komuttur: `diff --no-ext-diff --no-textconv --numstat -z <mergeBase>..<head> --`", () => {
    const spy = vi.spyOn(childProcess, "spawnSync");
    const dir = makeTmpDir("exact-command");
    initRepo(dir);
    commitFile(dir, "a.txt", "one\n", "init");
    const headHash = commitFile(dir, "a.txt", "two\n", "second");
    const result = range.collectRange({ repoRoot: dir, base: "HEAD~1", head: "HEAD" });
    expect(result.ok).toBe(true);
    const diffCall = spy.mock.calls.find((c) => (c[1] as string[])[0] === "diff");
    expect(diffCall).toBeDefined();
    const args = diffCall?.[1] as string[];
    expect(args[0]).toBe("diff");
    expect(args).toContain("--no-ext-diff");
    expect(args).toContain("--no-textconv");
    expect(args).toContain("--numstat");
    expect(args).toContain("-z");
    expect(args[args.length - 1]).toBe("--");
    expect(args.some((a) => a === `${result.metadata.mergeBase}..${headHash}`)).toBe(true);
  });
});

describe("pr-size-git-range — enjekte yürütücüyle deterministik hata sınıfları", () => {
  const okBuffer = (text: string) => Buffer.from(text, "utf8");
  const success = (stdout: string) => ({
    status: 0,
    signal: null,
    stdout: okBuffer(stdout),
    stderr: okBuffer(""),
  });
  /** İlk üç çağrı (inside-work-tree, shallow, base çözümü) hep başarılı; sonrasını test şekillendirir. */
  const scriptedExecutor = (
    script: Array<ReturnType<typeof success> | Record<string, unknown>>,
  ) => {
    let call = 0;
    return vi.fn(() => {
      const step = script[Math.min(call, script.length - 1)];
      call += 1;
      return step;
    });
  };

  const baseHash = "1111111111111111111111111111111111111111";
  const headHash = "2222222222222222222222222222222222222222";
  const mergeBaseHash = "3333333333333333333333333333333333333333";

  const happyPathUntilMergeBase = () => [
    success("true"),
    success("false"),
    success(`${baseHash}\n`),
    success(`${headHash}\n`),
  ];

  it("birden fazla merge-base merge-base-ambiguous ile reddedilir", () => {
    const executor = scriptedExecutor([
      ...happyPathUntilMergeBase(),
      success(`${mergeBaseHash}\n4444444444444444444444444444444444444444\n`),
    ]);
    const result = range.collectRange({ repoRoot: "/tmp/x", base: "b", head: "h", executor });
    expect(result.ok).toBe(false);
    expect(result.error.id).toBe("merge-base-ambiguous");
  });

  it("hiç merge-base yoksa merge-base-none ile reddedilir", () => {
    const executor = scriptedExecutor([...happyPathUntilMergeBase(), success("")]);
    const result = range.collectRange({ repoRoot: "/tmp/x", base: "b", head: "h", executor });
    expect(result.ok).toBe(false);
    expect(result.error.id).toBe("merge-base-none");
  });

  it("diff aşamasında sıfır-olmayan çıkış git-nonzero-exit üretir", () => {
    const executor = scriptedExecutor([
      ...happyPathUntilMergeBase(),
      success(`${mergeBaseHash}\n`),
      { status: 1, signal: null, stdout: okBuffer(""), stderr: okBuffer("fatal: boom") },
    ]);
    const result = range.collectRange({ repoRoot: "/tmp/x", base: "b", head: "h", executor });
    expect(result.ok).toBe(false);
    expect(result.error.id).toBe("git-nonzero-exit");
    expect(JSON.stringify(result)).not.toContain("boom");
  });

  it("diff aşamasında sinyal git-signal-terminated üretir", () => {
    const executor = scriptedExecutor([
      ...happyPathUntilMergeBase(),
      success(`${mergeBaseHash}\n`),
      { status: null, signal: "SIGKILL", stdout: okBuffer(""), stderr: okBuffer("") },
    ]);
    const result = range.collectRange({ repoRoot: "/tmp/x", base: "b", head: "h", executor });
    expect(result.ok).toBe(false);
    expect(result.error.id).toBe("git-signal-terminated");
  });

  it("zaman aşımı git-timeout üretir", () => {
    const timeoutError = Object.assign(new Error("timeout"), { code: "ETIMEDOUT" });
    const executor = scriptedExecutor([
      ...happyPathUntilMergeBase(),
      success(`${mergeBaseHash}\n`),
      {
        status: null,
        signal: "SIGTERM",
        stdout: okBuffer(""),
        stderr: okBuffer(""),
        error: timeoutError,
      },
    ]);
    const result = range.collectRange({ repoRoot: "/tmp/x", base: "b", head: "h", executor });
    expect(result.ok).toBe(false);
    expect(result.error.id).toBe("git-timeout");
  });

  it("tampon taşması git-maxbuffer-exceeded üretir", () => {
    const bufferError = Object.assign(new Error("maxBuffer"), { code: "ENOBUFS" });
    const executor = scriptedExecutor([
      ...happyPathUntilMergeBase(),
      success(`${mergeBaseHash}\n`),
      {
        status: null,
        signal: null,
        stdout: okBuffer(""),
        stderr: okBuffer(""),
        error: bufferError,
      },
    ]);
    const result = range.collectRange({ repoRoot: "/tmp/x", base: "b", head: "h", executor });
    expect(result.ok).toBe(false);
    expect(result.error.id).toBe("git-maxbuffer-exceeded");
  });

  it("depo tespiti başarısızsa repo-not-found ile durur, sonraki adımlar hiç çağrılmaz", () => {
    const executor = vi.fn(() => ({
      status: 1,
      signal: null,
      stdout: okBuffer(""),
      stderr: okBuffer(""),
    }));
    const result = range.collectRange({ repoRoot: "/tmp/x", base: "b", head: "h", executor });
    expect(result.ok).toBe(false);
    expect(result.error.id).toBe("repo-not-found");
    expect(executor).toHaveBeenCalledTimes(1);
  });

  it("çözülemeyen/çok-anlamlı/commit-olmayan base ref base-ref-unresolved ile durur", () => {
    const executor = scriptedExecutor([
      success("true"),
      success("false"),
      {
        status: 128,
        signal: null,
        stdout: okBuffer(""),
        stderr: okBuffer("fatal: ambiguous argument"),
      },
    ]);
    const result = range.collectRange({ repoRoot: "/tmp/x", base: "b", head: "h", executor });
    expect(result.ok).toBe(false);
    expect(result.error.id).toBe("base-ref-unresolved");
  });

  it("sıfır çıkışlı ama stderr üreten git çağrısı sızıntısız fail-closed durur", () => {
    const executor = scriptedExecutor([
      ...happyPathUntilMergeBase(),
      success(`${mergeBaseHash}\n`),
      { status: 0, signal: null, stdout: okBuffer(""), stderr: okBuffer("warning: sızmasın") },
    ]);
    const result = range.collectRange({ repoRoot: "/tmp/x", base: "b", head: "h", executor });
    expect(result.ok).toBe(false);
    expect(result.error.id).toBe("git-unexpected-stderr");
    expect(JSON.stringify(result)).not.toContain("sızmasın");
  });

  it("biçimsiz stderr (Buffer olmayan) da fail-closed durur", () => {
    const executor = scriptedExecutor([
      success("true"),
      success("false"),
      { status: 0, signal: null, stdout: okBuffer(`${baseHash}\n`), stderr: "düz metin" },
    ]);
    const result = range.collectRange({ repoRoot: "/tmp/x", base: "b", head: "h", executor });
    expect(result.ok).toBe(false);
    expect(result.error.id).toBe("base-ref-unresolved");
  });

  it("commit-olmayan head (örn. blob) head-ref-unresolved ile durur", () => {
    const executor = scriptedExecutor([
      success("true"),
      success("false"),
      success(`${baseHash}\n`),
      {
        status: 128,
        signal: null,
        stdout: okBuffer(""),
        stderr: okBuffer("fatal: expected commit type"),
      },
    ]);
    const result = range.collectRange({ repoRoot: "/tmp/x", base: "b", head: "h", executor });
    expect(result.ok).toBe(false);
    expect(result.error.id).toBe("head-ref-unresolved");
  });
});

describe("pr-size-git-range — ortam allowlist ve çekirdek sınırları", () => {
  it("sanitizeEnv miras GIT_* değişkenlerini KOPYALAMAZ, yalnız güvenli değerleri set eder", () => {
    const poisoned = {
      PATH: "/usr/bin",
      GIT_DIR: "/tmp/evil/.git",
      GIT_WORK_TREE: "/tmp/evil",
      GIT_INDEX_FILE: "/tmp/evil/index",
      GIT_CONFIG_GLOBAL: "/tmp/evil/gitconfig",
      GIT_CONFIG_SYSTEM: "/tmp/evil/gitconfig-system",
      GIT_EXTERNAL_DIFF: "/tmp/evil/diff.sh",
      GIT_DIFF_OPTS: "--unified=999",
    };
    const env = range.sanitizeEnv(poisoned);
    for (const key of Object.keys(poisoned))
      if (key !== "PATH" && key !== "GIT_CONFIG_GLOBAL") expect(env, key).not.toHaveProperty(key);
    // Miras GIT_CONFIG_GLOBAL kopyalanmaz; yerine GÜVENLİ, açık bir değerle EZİLİR — böylece
    // ne saldırganın dosyası ne de kullanıcının ~/.gitconfig'i ölçüme karışır.
    expect(env.GIT_CONFIG_GLOBAL).toBe("/dev/null");
    expect(env.GIT_CONFIG_NOSYSTEM).toBe("1");
    expect(env.GIT_TERMINAL_PROMPT).toBe("0");
    expect(env.GIT_PAGER).toBe("cat");
  });

  it("modül kanonik bant eşik/kimliklerini KOPYALAMAZ, operasyonel sınırları taşıyabilir", () => {
    const source = fs.readFileSync(path.join(ROOT, MODULE), "utf8");
    const budget = JSON.parse(
      fs.readFileSync(path.join(ROOT, "src/data/standards/short-code.json"), "utf8"),
    ).changePackageBudget;
    const tiers: Array<{ id: string; maxNet: number }> = [...budget.bands, ...budget.classes];
    const numbers = [
      ...tiers.map((t) => t.maxNet),
      budget.splitRequiredAboveNet,
      budget.maxChangedFiles,
    ];
    // `default` kasıtlı dışarıdadır: kanonik bant kimliği olmasının yanında genel bir programlama
    // sözcüğüdür (`defaultExecutor`), yani kopya KANITI değildir.
    const ids = tiers.map((t) => t.id).filter((id) => id !== "default");
    // Kural gerçekten ateşleniyor mu: kimliksiz çıplak eşik sayısı ve bant kimliği yakalanmalı.
    const forbids = (text: string) =>
      numbers.some((n) => new RegExp(`(^|[^0-9_])${n}([^0-9_]|$)`).test(text)) ||
      ids.some((id) => text.includes(id));
    expect(new Set(numbers).size, "kanonik eşik kümesi boş olamaz").toBeGreaterThan(1);
    expect(forbids("const MAX_NET = 800; // conditional"), "dedektör ateşlemeli").toBe(true);
    expect(forbids(source), "modül kanonik bant eşiği/kimliği kopyalamamalı").toBe(false);
    // Operasyonel süreç sınırları serbesttir: ölçüm eşiği değil, boru güvenliği sınırıdır.
    expect(source).toContain("MAX_REF_LENGTH = 512");
    expect(source).toContain("DEFAULT_TIMEOUT_MS = 10_000");
  });
});
