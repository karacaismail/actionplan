import childProcess, { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

// P2B2a-1 ÇEKİRDEK: change-package ÇALIŞMA AĞACI TOPLAMA yüzeyi. Burada ÖLÇÜM/KARAR YOKTUR —
// yalnız HEAD'e göre `--numstat -z` telinin GÜVENLİ ve MUTASYONSUZ toplanması sınanır: kabuk yok,
// sabit cwd, sınırlı süre/tampon, allowlist ortam, indeks/HEAD bayt bayt aynı. KAPSAM DAR: tüketici
// kenar matrisi P2B2a-2'ye BAĞLI bırakılmıştır, sessizce düşürülmemiştir.
const ROOT = process.cwd();
const MODULE = "tools/lib/pr-size-git-working-tree.mjs";
// biome-ignore lint/suspicious/noExplicitAny: shipped pure JavaScript module has no declaration file.
const wt: any = await import(pathToFileURL(path.join(ROOT, MODULE)).href);
// biome-ignore lint/suspicious/noExplicitAny: shipped pure JavaScript module has no declaration file.
const core: any = await import(pathToFileURL(path.join(ROOT, "tools/lib/pr-size-core.mjs")).href);

type Row = { additions: number | null; deletions: number | null; file: string };
const parse = (wire: string): { rows: Row[]; invalid: unknown[] } => core.parseNumstatZ(wire);
/** NUL çerçeveli tel kurar; `"\0" + rakam` sekizlik kaçış tuzağına düşmeden okunur kalır. */
const z = (...records: string[]) => records.map((record) => `${record}\0`).join("");

const runGit = (cwd: string, args: string[]) => {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} başarısız: ${result.stderr}`);
  return result.stdout.trim();
};

let tmpDirs: string[] = [];
const makeTmpDir = (label: string) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `pr-size-wt-${label}-`));
  tmpDirs.push(dir);
  return dir;
};

const write = (dir: string, file: string, body: string | Buffer) => {
  fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  fs.writeFileSync(path.join(dir, file), body);
};

const commit = (dir: string, file: string, body: string, message: string) => {
  write(dir, file, body);
  runGit(dir, ["add", "--", file]);
  runGit(dir, ["commit", "-q", "-m", message]);
};

/** Tek commit'lik temiz depo: her semantik senaryonun ortak başlangıç noktası. */
const seedRepo = (label: string) => {
  const dir = makeTmpDir(label);
  runGit(dir, ["init", "-q", "-b", "main"]);
  runGit(dir, ["config", "user.email", "wt-test@example.com"]);
  runGit(dir, ["config", "user.name", "wt-test"]);
  commit(dir, "a.txt", "one\n", "init");
  return dir;
};

/** Miras ortamı geçici olarak zehirler ve `finally` ile eski değere (ya da yokluğa) döndürür. */
const withEnv = (overrides: Record<string, string>, run: () => void) => {
  const saved = Object.keys(overrides).map((key) => [key, process.env[key]] as const);
  Object.assign(process.env, overrides);
  try {
    run();
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
};

/** Bir dizinin göreli yollarını ve baytlarını tek deterministik özete indirger. */
const hashTree = (dir: string) => {
  const hash = crypto.createHash("sha256");
  const walk = (rel: string) => {
    const entries = fs.readdirSync(path.join(dir, rel), { withFileTypes: true });
    for (const entry of entries.sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const next = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(next);
      else if (entry.isFile()) hash.update(next).update(fs.readFileSync(path.join(dir, next)));
      else hash.update(next).update(" non-file");
    }
  };
  walk("");
  return hash.digest("hex");
};

const buf = (v: string | Buffer) => (typeof v === "string" ? Buffer.from(v, "utf8") : v);
const ok = (stdout: string | Buffer = "") => ({
  status: 0,
  signal: null,
  stdout: buf(stdout),
  stderr: buf(""),
});
/** `--no-index` farkının BELGELENMİŞ çıkışı 1'dir; sahte yanıtlar da onu taşımalıdır. */
const differs = (stdout: string) => ({ ...ok(stdout), status: 1 });
const broken = (patch: Record<string, unknown>) => ({ ...ok(""), ...patch });
const coded = (code: string) => Object.assign(new Error(code), { code });

/**
 * Argümanlara göre yanıt veren sahte git: çağrı SIRASI değil, KOMUT kimliği eşleşir. Modülün adım
 * sırası değişse bile senaryolar anlamını korur ve her senaryo yalnız ilgilendiği adımı değiştirir.
 */
const stepOf = (args: string[]) => {
  if (args[0] === "rev-parse") return args[1] === "--verify" ? "head" : args[1];
  if (args[0] === "ls-files") return args.includes("--unmerged") ? "unmerged" : "others";
  return args.includes("--no-index") ? "no-index" : "tracked";
};
const gitStub = (overrides: Record<string, unknown> = {}) => {
  const defaults: Record<string, unknown> = {
    "--is-inside-work-tree": ok("true\n"),
    "--is-shallow-repository": ok("false\n"),
    head: ok(`${"1".repeat(40)}\n`),
    unmerged: ok(""),
    tracked: ok(""),
    others: ok(""),
  };
  // Tepe dizin SABİT cwd'den yankılanır: enjekte senaryo kök eşitliğini değil kendi adımını sınar.
  return vi.fn((args: string[], opts?: { cwd?: string }) => {
    const key = stepOf(args);
    if (key in overrides) return overrides[key];
    if (key === "--show-toplevel") return ok(`${opts?.cwd ?? ""}\n`);
    return defaults[key];
  });
};

/** Enjekte senaryolarda tek ortak iddia: doğru hata kimliği ve SIZINTISIZ rapor. */
const expectFail = (result: { ok: boolean; error: { id: string } }, id: string, label: string) => {
  expect(result.ok, `kabul edilmemeliydi: ${label}`).toBe(false);
  expect(result.error.id).toBe(id);
  const serialized = JSON.stringify(result);
  expect(serialized).not.toContain("sızmasın");
  expect(serialized).not.toContain("passwd");
};

afterEach(() => {
  for (const dir of tmpDirs) fs.rmSync(dir, { recursive: true, force: true });
  tmpDirs = [];
  vi.restoreAllMocks();
});

describe("pr-size-git-working-tree — kök biçimi git ÇAĞRILMADAN doğrulanır", () => {
  it("geçersiz repoRoot biçimleri hiçbir alt süreç doğmadan reddedilir", () => {
    const executor = vi.fn();
    // biome-ignore format: the invalid-root fixture set stays compact for the shard budget
    const badRoots = [undefined, null, 123, "", "relative/path", "/x".repeat(3000), "/tmp/a\0x"];
    for (const root of badRoots)
      expect(wt.collectWorkingTree({ repoRoot: root, executor }).ok, `${root}`).toBe(false);
    expect(executor).not.toHaveBeenCalled();
  });
});

describe("pr-size-git-working-tree — kök TAM OLARAK çalışma ağacının tepesi olmalıdır", () => {
  // İzlenmeyen `sub/a.txt` CWD'ye göre `a.txt` diye listelenip kökteki izlenenle SAHTE örtüşürdü.
  it("alt dizin kökü fail-closed durur; karışık tabanlı tel ÜRETİLMEZ", () => {
    const dir = seedRepo("subdir");
    write(dir, "a.txt", "one\ntwo\n");
    write(dir, "sub/a.txt", "alt\n");
    const result = wt.collectWorkingTree({ repoRoot: path.join(dir, "sub") });
    expectFail(result, "root-not-worktree-toplevel", "alt dizin kökü");
    expect(JSON.stringify(result)).not.toContain(dir);
  });

  it("sembolik takma adla verilen TEPE dizin kabul edilir (realpath eşitliği)", () => {
    const dir = seedRepo("alias");
    write(dir, "a.txt", "one\ntwo\n");
    const alias = path.join(makeTmpDir("alias-parent"), "alias");
    fs.symlinkSync(dir, alias);
    const result = wt.collectWorkingTree({ repoRoot: alias });
    expect(result.ok, JSON.stringify(result.error)).toBe(true);
    expect(result.numstatZ).toBe(z("1\t0\ta.txt"));
  });
});

describe("pr-size-git-working-tree — gerçek depoda çalışma ağacı semantiği", () => {
  const stage = (dir: string, body: string) => {
    write(dir, "a.txt", body);
    runGit(dir, ["add", "--", "a.txt"]);
  };
  // Her senaryo tek commit'lik temiz depodan başlar; `a.txt` HEAD'de tek satırdır ("one\n").
  const scenarios: Array<{ name: string; arrange: (dir: string) => void; wire: string }> = [
    { name: "yalnız staged", arrange: (d) => stage(d, "one\ntwo\n"), wire: z("1\t0\ta.txt") },
    {
      name: "yalnız unstaged",
      arrange: (d) => write(d, "a.txt", "one\ntwo\n"),
      wire: z("1\t0\ta.txt"),
    },
    {
      // İki aşama TOPLANMAZ (1+1 değil): HEAD'e göre NİHAİ durum tek satırdır.
      name: "aynı dosya staged+unstaged ise nihai durum TEK KEZ",
      arrange: (d) => {
        stage(d, "one\nstaged\n");
        write(d, "a.txt", "one\nstaged\nunstaged\n");
      },
      wire: z("2\t0\ta.txt"),
    },
    {
      name: "silinen izlenen dosya silme olarak sayılır",
      arrange: (d) => fs.rmSync(path.join(d, "a.txt")),
      wire: z("0\t1\ta.txt"),
    },
    {
      name: "izlenmeyen metin dosyası eklenmiş sayılır",
      arrange: (d) => write(d, "sub/new.txt", "x\ny\nz\n"),
      wire: z("3\t0\tsub/new.txt"),
    },
    {
      // İkili satır `-\t-` KALIR ki karar motoru "ölçemedim" diyebilsin; 0 sayılmaz.
      name: "izlenmeyen ikili dosya ölçülemez olarak işaretlenir",
      arrange: (d) => write(d, "blob.bin", Buffer.from([0, 1, 2, 255, 254, 0])),
      wire: z("-\t-\tblob.bin"),
    },
    {
      // Bağ hedefi değil, bağın KENDİ yol metni sayılır: hedefe AÇILMAZ.
      name: "izlenmeyen sembolik bağ hedefe açılmadan sayılır",
      arrange: (d) => fs.symlinkSync("a.txt", path.join(d, "link.txt")),
      wire: z("1\t0\tlink.txt"),
    },
    { name: "temiz ağaç BOŞ tel üretir", arrange: () => undefined, wire: "" },
  ];

  for (const { name, arrange, wire } of scenarios) {
    it(name, () => {
      const dir = seedRepo("semantics");
      arrange(dir);
      const result = wt.collectWorkingTree({ repoRoot: dir });
      expect(result.ok, JSON.stringify(result.error)).toBe(true);
      expect(result.numstatZ).toBe(wire);
      // Toplayıcı ne `/dev/null` iskelesini ne mutlak kökü tele SIZDIRIR.
      expect(result.numstatZ).not.toContain("/dev/null");
      expect(result.numstatZ).not.toContain(dir);
    });
  }

  it("rename TEK dosyadır ve TAB/satırsonu/unicode taşıyan ad LİTERAL korunur", () => {
    const dir = seedRepo("rename");
    const renamed = "yeni-ad ç ğ ş 日本\tsekme\nsatır.txt";
    runGit(dir, ["mv", "a.txt", renamed]);
    const result = wt.collectWorkingTree({ repoRoot: dir });
    expect(result.ok, JSON.stringify(result.error)).toBe(true);
    const parsed = parse(result.numstatZ);
    expect(parsed.invalid).toEqual([]);
    expect(parsed.rows).toEqual([{ additions: 0, deletions: 0, file: renamed }]);
  });

  it("yok sayılan (.gitignore) dosyalar telin DIŞINDA kalır", () => {
    const dir = seedRepo("ignored");
    commit(dir, ".gitignore", "ignored/\n*.log\n", "ignore");
    write(dir, "ignored/secret.txt", "gizli\n");
    write(dir, "noisy.log", "log\n");
    write(dir, "seen.txt", "görünür\n");
    const result = wt.collectWorkingTree({ repoRoot: dir });
    expect(result.ok, JSON.stringify(result.error)).toBe(true);
    expect(result.numstatZ).toBe(z("1\t0\tseen.txt"));
  });

  it("sıralama deterministiktir, iki toplama bayt bayt aynıdır ve cwd'den BAĞIMSIZdır", () => {
    const dir = seedRepo("deterministic");
    // İki liste ARDIŞIK EKLENSE sıra bozulurdu: izlenen `zzz.txt` her izlenmeyen adın ÖNÜNE
    // düşerdi. Tek kanonik sıra bu iç içe geçmeyi çözmek zorundadır.
    commit(dir, "zzz.txt", "bir\n", "tail");
    write(dir, "zzz.txt", "bir\niki\n");
    for (const name of ["zeta.txt", "alpha.txt", "mid/beta.txt", "mid/aa.txt"])
      write(dir, name, "yeni\n");
    const first = wt.collectWorkingTree({ repoRoot: dir });
    expect(first.ok, JSON.stringify(first.error)).toBe(true);
    expect(parse(first.numstatZ).rows.map((row) => row.file)).toEqual([
      "alpha.txt",
      "mid/aa.txt",
      "mid/beta.txt",
      "zeta.txt",
      "zzz.txt",
    ]);
    const previousCwd = process.cwd();
    process.chdir(makeTmpDir("elsewhere"));
    try {
      const second = wt.collectWorkingTree({ repoRoot: dir });
      expect(second.numstatZ).toBe(first.numstatZ);
      expect(second.metadata).toEqual(first.metadata);
    } finally {
      process.chdir(previousCwd);
    }
  });

  it("çıktı biçimi kesindir: metadata kök, yol listesi veya ham git metni TAŞIMAZ", () => {
    const dir = seedRepo("shape");
    write(dir, "gizli-ad.txt", "x\n");
    const result = wt.collectWorkingTree({ repoRoot: dir });
    expect(result.ok, JSON.stringify(result.error)).toBe(true);
    expect(Object.keys(result).sort()).toEqual(["metadata", "numstatZ", "ok"]);
    expect(Object.keys(result.metadata).sort()).toEqual(["byteLength", "head", "sha256", "source"]);
    expect(result.metadata.source).toBe("working-tree");
    expect(result.metadata.head).toBe(runGit(dir, ["rev-parse", "HEAD"]));
    const bytes = Buffer.from(result.numstatZ, "utf8");
    expect(result.metadata.byteLength).toBe(bytes.length);
    expect(result.metadata.sha256).toBe(crypto.createHash("sha256").update(bytes).digest("hex"));
    const serialized = JSON.stringify(result.metadata);
    expect(serialized).not.toContain(dir);
    expect(serialized).not.toContain("gizli-ad.txt");
  });
});

describe("pr-size-git-working-tree — MUTASYONSUZLUK kanıtı", () => {
  it("toplama sonrası indeks, nesne deposu, refler, HEAD ve durum bayt bayt AYNIdır", () => {
    const dir = seedRepo("no-mutation");
    write(dir, "a.txt", "one\ntwo\n");
    runGit(dir, ["add", "--", "a.txt"]);
    write(dir, "a.txt", "one\ntwo\nthree\n");
    write(dir, "yeni.txt", "izlenmeyen\n");
    runGit(dir, ["status", "--porcelain"]); // indeksi ölçümden ÖNCE oturtur
    const digest = (file: string) =>
      crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
    const snapshot = () => ({
      objects: hashTree(path.join(dir, ".git/objects")),
      index: digest(path.join(dir, ".git/index")),
      refs: hashTree(path.join(dir, ".git/refs")),
      head: runGit(dir, ["rev-parse", "HEAD"]),
      status: runGit(dir, ["status", "--porcelain"]),
    });
    const before = snapshot();
    expect(wt.collectWorkingTree({ repoRoot: dir }).ok).toBe(true);
    expect(snapshot()).toEqual(before);
  });
});

describe("pr-size-git-working-tree — süreç, argv ve ortam sözleşmesi", () => {
  it("alt süreç shell:false, izinli argv, SABİT cwd, sınırlı süre/tampon ve TEMİZ ortamla çağrılır", () => {
    const spy = vi.spyOn(childProcess, "spawnSync");
    const dir = seedRepo("process-contract");
    write(dir, "b.txt", "iki\n");
    expect(wt.collectWorkingTree({ repoRoot: dir }).ok).toBe(true);
    expect(spy).toHaveBeenCalled();
    // Kara liste değil BEYAZ liste: yeni bir git fiili sessizce eklenemez.
    const allowed = new Set(["rev-parse", "ls-files", "diff"]);
    // biome-ignore format: the forbidden-verb vocabulary stays compact for the shard budget
    const forbidden = ["add", "update-index", "hash-object", "write-tree", "commit", "stash",
      "checkout", "restore", "clean", "reset", "fetch", "pull", "push", "clone", "ls-remote",
      "remote", "gc", "apply", "-w"];
    for (const call of spy.mock.calls) {
      expect(call[0]).toBe("git");
      const args = call[1] as string[];
      expect(Array.isArray(args)).toBe(true);
      for (const arg of args) expect(typeof arg).toBe("string");
      expect(allowed.has(args[0]), `izinsiz git komutu: ${args[0]}`).toBe(true);
      for (const arg of args) expect(forbidden).not.toContain(arg);
      const options = call[2] as Record<string, unknown>;
      expect(options.shell).toBe(false);
      expect(options.cwd).toBe(dir);
      expect(typeof options.timeout).toBe("number");
      expect(typeof options.maxBuffer).toBe("number");
      // Ortam SIFIRDAN kurulur: miras hiçbir depo/config geçersiz kılıcısı kopyalanmaz.
      const env = options.env as Record<string, string>;
      for (const key of ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE", "GIT_EXTERNAL_DIFF"])
        expect(env[key]).toBeUndefined();
      expect(env.GIT_CONFIG_NOSYSTEM).toBe("1");
      expect(env.GIT_CONFIG_GLOBAL).toBe("/dev/null");
      expect(env.GIT_OPTIONAL_LOCKS).toBe("0");
    }
    const source = fs.readFileSync(path.join(ROOT, MODULE), "utf8");
    expect(source).not.toMatch(/hash-object|update-index|write-tree|ls-remote|shell: true/);
  });

  it("zehirlenmiş miras GIT_DIR/GIT_WORK_TREE/GIT_INDEX_FILE ortamı NÖTRLENİR", () => {
    const dir = seedRepo("poisoned-env");
    write(dir, "a.txt", "one\ntwo\n");
    const decoy = seedRepo("decoy");
    const poison = {
      GIT_DIR: path.join(decoy, ".git"),
      GIT_INDEX_FILE: path.join(decoy, ".git", "index"),
      GIT_WORK_TREE: decoy,
    };
    withEnv(poison, () => {
      const result = wt.collectWorkingTree({ repoRoot: dir });
      expect(result.ok, "zehirli GIT_DIR toplamayı bozmamalı").toBe(true);
      expect(result.numstatZ).toBe(z("1\t0\ta.txt"));
    });
  });

  it("düşman global ~/.gitconfig (core.attributesFile) ölçümü sessizce ikiliye çeviremez", () => {
    const dir = seedRepo("hostile-config");
    write(dir, "a.txt", "two\n");
    write(dir, "yeni.txt", "üç\n");
    const home = makeTmpDir("hostile-home");
    fs.writeFileSync(path.join(home, "attributes"), "* binary\n");
    const config = `[core]\n\tattributesFile = ${path.join(home, "attributes")}\n`;
    fs.writeFileSync(path.join(home, ".gitconfig"), config);
    withEnv({ HOME: home, XDG_CONFIG_HOME: home }, () => {
      const result = wt.collectWorkingTree({ repoRoot: dir });
      expect(result.ok, JSON.stringify(result.error)).toBe(true);
      // Saf metin değişikliği SAYILABİLİR kalmalı; `-\t-` sessiz bir bütçe sıfırlaması olurdu.
      expect(result.numstatZ).toBe(z("1\t1\ta.txt", "1\t0\tyeni.txt"));
    });
  });
});

describe("pr-size-git-working-tree — gerçek depo durumu fail-closed", () => {
  it("git deposu olmayan kök tek çağrıda reddedilir, sonraki adımlar hiç çalışmaz", () => {
    const executor = vi.fn(() => broken({ status: 1 }));
    const result = wt.collectWorkingTree({ repoRoot: "/tmp/yok", executor });
    expectFail(result, "repo-not-found", "non-repo");
    expect(executor).toHaveBeenCalledTimes(1);
  });

  it("gerçek non-repo dizin repo-not-found ile reddedilir", () => {
    const result = wt.collectWorkingTree({ repoRoot: makeTmpDir("not-a-repo") });
    expectFail(result, "repo-not-found", "gerçek non-repo");
  });

  it("doğmamış HEAD (commit'siz depo) head-unborn ile reddedilir", () => {
    const dir = makeTmpDir("unborn");
    runGit(dir, ["init", "-q", "-b", "main"]);
    write(dir, "a.txt", "one\n");
    expectFail(wt.collectWorkingTree({ repoRoot: dir }), "head-unborn", "doğmamış HEAD");
  });

  it("sığ (shallow) depo repo-shallow ile reddedilir", () => {
    const origin = seedRepo("shallow-origin");
    commit(origin, "a.txt", "two\n", "second");
    const clone = path.join(makeTmpDir("shallow-parent"), "clone");
    const args = ["clone", "-q", "--depth", "1", "--no-local", `file://${origin}`, clone];
    const cloned = spawnSync("git", args, { encoding: "utf8" });
    expect(cloned.status, cloned.stderr).toBe(0);
    expectFail(wt.collectWorkingTree({ repoRoot: clone }), "repo-shallow", "sığ depo");
  });

  it("gerçek çakışmalı (unmerged) ağaç reddedilir — çakışma işaretleri SAYILMAZ", () => {
    const dir = seedRepo("unmerged");
    commit(dir, "c.txt", "base\n", "base");
    runGit(dir, ["checkout", "-q", "-b", "side"]);
    commit(dir, "c.txt", "side\n", "side");
    runGit(dir, ["checkout", "-q", "main"]);
    commit(dir, "c.txt", "main\n", "main");
    spawnSync("git", ["merge", "side"], { cwd: dir, encoding: "utf8" });
    expect(runGit(dir, ["ls-files", "--unmerged"]).length).toBeGreaterThan(0);
    expectFail(wt.collectWorkingTree({ repoRoot: dir }), "repo-unmerged", "çakışmalı ağaç");
  });
});

describe("pr-size-git-working-tree — enjekte yürütücüyle deterministik hata sınıfları", () => {
  const tooMany = z(...Array.from({ length: wt.MAX_UNTRACKED_PATHS + 1 }, (_, i) => `f${i}.txt`));
  const notUtf8 = Buffer.from([0x31, 0x09, 0x30, 0x09, 0xff, 0x00]);
  // biome-ignore format: the injected-failure matrix stays one row per case for the shard budget
  const cases: Array<[string, Record<string, unknown>, string]> = [
    ["zaman aşımı", { tracked: broken({ status: null, error: coded("ETIMEDOUT") }) }, "git-timeout"],
    ["tampon taşması", { tracked: broken({ error: coded("ENOBUFS") }) }, "git-maxbuffer-exceeded"],
    ["sinyal", { tracked: broken({ status: null, signal: "SIGKILL" }) }, "git-signal-terminated"],
    ["sıfır-olmayan çıkış", { tracked: broken({ status: 128, stderr: buf("fatal: sızmasın") }) }, "git-nonzero-exit"],
    ["sıfır çıkışlı tanı", { tracked: broken({ stderr: buf("warning: sızmasın") }) }, "git-unexpected-stderr"],
    ["biçimsiz izlenen tel", { tracked: ok(z("bozuk")) }, "tracked-output-malformed"],
    ["UTF-8 olmayan izlenen tel", { tracked: ok(notUtf8) }, "tracked-output-not-utf8"],
    ["güvensiz izlenen yol", { tracked: ok(z("1\t0\t/etc/passwd")) }, "tracked-path-unsafe"],
    ["onaltılık olmayan HEAD", { head: ok("ref: refs/heads/main\n") }, "head-unborn"],
    ["enjekte çakışma kaydı", { unmerged: ok(z("100644 abc 1\tc.txt")) }, "repo-unmerged"],
    ["kesik izlenmeyen liste", { others: ok("kesik.txt") }, "untracked-output-malformed"],
    ["UTF-8 olmayan izlenmeyen liste", { others: ok(Buffer.from([0xff, 0xfe, 0x00])) }, "untracked-output-not-utf8"],
    ["izlenen/izlenmeyen örtüşmesi", { tracked: ok(z("1\t0\tayni.txt")), others: ok(z("ayni.txt")) }, "untracked-tracked-overlap"],
    ["mutlak izlenmeyen yol", { others: ok(z("/etc/passwd")) }, "untracked-path-unsafe"],
    ["`..` taşıyan izlenmeyen yol", { others: ok(z("a/../../disari.txt")) }, "untracked-path-unsafe"],
    ["ters eğik çizgili izlenmeyen yol", { others: ok(z("dist\\gizli.ts")) }, "untracked-path-unsafe"],
    ["kaynak sınırını aşan izlenmeyen liste", { others: ok(tooMany) }, "untracked-too-many"],
  ];

  for (const [name, overrides, id] of cases)
    it(`${name} → ${id}`, () => {
      const result = wt.collectWorkingTree({
        repoRoot: "/tmp/wt-stub",
        executor: gitStub(overrides),
      });
      expectFail(result, id, name);
    });
});

describe("pr-size-git-working-tree — izlenmeyen yol tehlikeleri (gerçek dosya sistemi)", () => {
  /** Gerçek dizin + sahte git: yol tehlikesi diskte gerçek, git akışı deterministik kalır. */
  const realDir = (label: string) => {
    const dir = makeTmpDir(label);
    write(dir, "yeni.txt", "x\n");
    return dir;
  };

  it("listelendikten sonra KAYBOLAN yol fail-closed durur", () => {
    const executor = gitStub({ others: ok(z("uctu.txt")) });
    const result = wt.collectWorkingTree({ repoRoot: realDir("disappearing"), executor });
    expectFail(result, "untracked-path-disappeared", "kaybolan yol");
  });

  it("FIFO gibi düzenli-olmayan yol OKUNMADAN reddedilir (aksi halde sonsuza kadar bloklardı)", () => {
    const dir = realDir("fifo");
    const made = spawnSync("mkfifo", [path.join(dir, "boru")], { encoding: "utf8" });
    expect(made.status, made.stderr).toBe(0);
    const executor = gitStub({ others: ok(z("boru")) });
    expectFail(
      wt.collectWorkingTree({ repoRoot: dir, executor }),
      "untracked-path-not-regular-file",
      "FIFO",
    );
    for (const call of executor.mock.calls)
      expect((call[0] as string[]).includes("--no-index")).toBe(false);
  });

  // biome-ignore format: the `--no-index` failure matrix stays one row per case for the shard budget
  const noIndex: Array<[string, unknown, string]> = [
    ["fark yok (status 0)", ok(z("1\t0\t", "/dev/null", "yeni.txt")), "untracked-diff-unexpected-exit"],
    ["birden fazla satır", differs(z("1\t0\t", "/dev/null", "yeni.txt", "9\t0\tbaska.txt")), "untracked-diff-malformed"],
    ["boş tel", differs(""), "untracked-diff-malformed"],
    ["alan eksik", differs(z("bozuk")), "untracked-diff-malformed"],
    ["sayısal alan bozuk", differs(z("x\ty\t", "/dev/null", "yeni.txt")), "untracked-diff-malformed"],
    ["kesik rename çerçevesi", differs(z("1\t0\t", "/dev/null")), "untracked-diff-malformed"],
    ["başka yol adı", differs(z("1\t0\t", "/dev/null", "/etc/passwd")), "untracked-diff-path-mismatch"],
  ];

  for (const [name, response, id] of noIndex)
    it(`\`--no-index\` ${name} → ${id}`, () => {
      const executor = gitStub({ others: ok(z("yeni.txt")), "no-index": response });
      expectFail(wt.collectWorkingTree({ repoRoot: realDir("no-index"), executor }), id, name);
    });
});

describe("pr-size-git-working-tree — kanonik eşik/kimlik kopyası yasağı", () => {
  const budget = JSON.parse(
    fs.readFileSync(path.join(ROOT, "src/data/standards/short-code.json"), "utf8"),
  ).changePackageBudget;

  it("modül kanonik bant eşiği/kimliği KOPYALAMAZ, operasyonel sınır taşıyabilir", () => {
    const source = fs.readFileSync(path.join(ROOT, MODULE), "utf8");
    const tiers: Array<{ id: string; maxNet: number }> = [...budget.bands, ...budget.classes];
    const numbers = [
      ...tiers.map((tier) => tier.maxNet),
      budget.splitRequiredAboveNet,
      budget.maxChangedFiles,
    ];
    // `default` kasıtlı dışarıdadır: kanonik bant kimliği olmasının yanında genel bir programlama
    // sözcüğüdür (`defaultExecutor`), yani kopya KANITI değildir.
    const ids = tiers.map((tier) => tier.id).filter((id) => id !== "default");
    const copies = (text: string) =>
      numbers.some((n) => new RegExp(`(^|[^0-9_])${n}([^0-9_]|$)`).test(text)) ||
      ids.some((id) => text.includes(id));
    expect(new Set(numbers).size, "kanonik eşik kümesi boş olamaz").toBeGreaterThan(1);
    expect(copies("const MAX_NET = 800; // band"), "dedektör ateşlemeli").toBe(true);
    expect(copies(source), "modül kanonik bant eşiği/kimliği kopyalamamalı").toBe(false);
    // Operasyonel süreç/kaynak sınırları serbesttir: ölçüm eşiği değil, boru güvenliği sınırıdır.
    expect(wt.DEFAULT_TIMEOUT_MS).toBe(10_000);
    expect(typeof wt.MAX_UNTRACKED_PATHS).toBe("number");
  });

  it("kanonik ölçüm modu sözleşmesi bu toplayıcının kaynağını zaten TANIR", () => {
    expect(budget.measurement.modes).toContain(wt.SOURCE);
  });
});
