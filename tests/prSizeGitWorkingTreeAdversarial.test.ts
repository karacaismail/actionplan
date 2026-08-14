import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

// P2B2a-2 KENAR MATRİSİ: P2B2a-1 çekirdeğinin TÜKETİCİ kenarları. Burada da ÖLÇÜM/KARAR/CLI
// YOKTUR ve çekirdek süiti TEKRARLANMAZ; yalnız (a) `--show-toplevel` yanıtının KENDİ doğrulaması,
// (b) iç içe izlenmeyen depo SINIRI ve (c) tüketicinin eşdeğer sanamayacağı ölçüm ASİMETRİLERİ
// çivilenir. Semantik DEĞİŞMEZ: buradaki iddialar mevcut kanonik davranışın kaydıdır.
const ROOT = process.cwd();
const MODULE = "tools/lib/pr-size-git-working-tree.mjs";
const SELF = "tests/prSizeGitWorkingTreeAdversarial.test.ts";
// biome-ignore lint/suspicious/noExplicitAny: shipped pure JavaScript module has no declaration file.
const wt: any = await import(pathToFileURL(path.join(ROOT, MODULE)).href);
// biome-ignore lint/suspicious/noExplicitAny: shipped pure JavaScript module has no declaration file.
const core: any = await import(pathToFileURL(path.join(ROOT, "tools/lib/pr-size-core.mjs")).href);

/** NUL çerçeveli tel kurar; `"\0" + rakam` sekizlik kaçış tuzağına düşmeden okunur kalır. */
const z = (...records: string[]) => records.map((record) => `${record}\0`).join("");
const filesOf = (wire: string): string[] =>
  core.parseNumstatZ(wire).rows.map((row: { file: string }) => row.file);

let tmpDirs: string[] = [];
const git = (cwd: string, args: string[]) => {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} başarısız: ${result.stderr}`);
  return result.stdout.trim();
};
const write = (dir: string, file: string, body: string) => {
  fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  fs.writeFileSync(path.join(dir, file), body);
};
const makeTmpDir = (label: string) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `pr-size-wt-edge-${label}-`));
  tmpDirs.push(dir);
  return dir;
};
/** Tek commit'lik temiz depo (`a.txt` = tek satır): her gerçek-depo senaryosunun başlangıcı. */
const seedRepo = (label: string) => {
  const dir = makeTmpDir(label);
  git(dir, ["init", "-q", "-b", "main"]);
  git(dir, ["config", "user.email", "edge@example.com"]);
  git(dir, ["config", "user.name", "edge"]);
  write(dir, "a.txt", "one\n");
  git(dir, ["add", "--", "a.txt"]);
  git(dir, ["commit", "-q", "-m", "init"]);
  return dir;
};

const buf = (value: string | Buffer) => (typeof value === "string" ? Buffer.from(value) : value);
const ok = (stdout: string | Buffer = "") => ({
  status: 0,
  signal: null,
  stdout: buf(stdout),
  stderr: buf(""),
});
/** Çağrı SIRASI değil KOMUT kimliği eşleşir; modülün adım sırası değişse de senaryolar yaşar. */
const stepOf = (args: string[]) => {
  if (args[0] === "rev-parse") return args[1] === "--verify" ? "head" : args[1];
  if (args[0] === "ls-files") return args.includes("--unmerged") ? "unmerged" : "others";
  return args.includes("--no-index") ? "no-index" : "tracked";
};
const gitStub = (overrides: Record<string, unknown> = {}) => {
  // biome-ignore format: the stub's clean-repo baseline stays compact for the shard budget
  const baseline: Record<string, unknown> = {
    "--is-inside-work-tree": ok("true\n"), "--is-shallow-repository": ok("false\n"),
    head: ok(`${"1".repeat(40)}\n`), unmerged: ok(""), tracked: ok(""), others: ok(""),
  };
  return vi.fn((args: string[], opts?: { cwd?: string }) => {
    const key = stepOf(args);
    if (key in overrides) return overrides[key];
    if (key === "--show-toplevel") return ok(`${opts?.cwd ?? ""}\n`);
    return baseline[key];
  });
};

// biome-ignore lint/suspicious/noExplicitAny: the collector's failure shape is asserted here.
const expectFail = (result: any, id: string, label: string) => {
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

describe("pr-size-git-working-tree — `--show-toplevel` yanıtı KENDİ BAŞINA doğrulanır", () => {
  // En tehlikeli hal: BOŞ yanıt. Sözlüksel çözüm boş metni `process.cwd()`e açar; cwd gerçek tepe
  // ise kök karşılaştırması KENDİ KENDİNİ doğrular ve git hiç konuşmadan ağaç KABUL edilirdi.
  it("BOŞ yanıt `process.cwd()`e çözülüp kökü SESSİZCE onaylayamaz", () => {
    const dir = seedRepo("toplevel-empty");
    const previousCwd = process.cwd();
    process.chdir(dir);
    try {
      const executor = gitStub({ "--show-toplevel": ok("") });
      const result = wt.collectWorkingTree({ repoRoot: process.cwd(), executor });
      expectFail(result, "worktree-toplevel-output-invalid", "boş tepe yanıtı");
    } finally {
      process.chdir(previousCwd);
    }
  });

  // biome-ignore format: the toplevel-output matrix stays one row per case for the shard budget
  const cases: Array<[string, unknown, string]> = [
    ["boş", ok(""), "worktree-toplevel-output-invalid"],
    ["yalnız beyaz boşluk", ok("   \n"), "worktree-toplevel-output-invalid"],
    ["göreli biçim", ok("gorece/tepe\n"), "worktree-toplevel-output-invalid"],
    ["çok satırlı", ok("/tmp/wt-stub\n/tmp/wt-baska\n"), "worktree-toplevel-output-invalid"],
    ["NUL taşıyan", ok(Buffer.from("/tmp/wt-stub\0/etc/passwd\n")), "worktree-toplevel-output-invalid"],
    ["UTF-8 olmayan", ok(Buffer.from([0x2f, 0xff, 0x0a])), "worktree-toplevel-output-invalid"],
    ["geçerli ama BAŞKA mutlak yol", ok("/tmp/wt-baska\n"), "root-not-worktree-toplevel"],
  ];

  for (const [name, response, id] of cases)
    it(`${name} tepe yanıtı → ${id}`, () => {
      const executor = gitStub({ "--show-toplevel": response });
      const result = wt.collectWorkingTree({ repoRoot: "/tmp/wt-stub", executor });
      expectFail(result, id, name);
      // Ham yanıt da mutlak kök de rapora TAŞINMAZ; kimlik raporun tek içeriğidir.
      expect(JSON.stringify(result)).not.toContain("/tmp/wt");
    });
});

describe("pr-size-git-working-tree — iç içe izlenmeyen depo SINIRI", () => {
  // `ls-files --others` iç içe bir depoya İNMEZ; onu `dizin/` diye tek kayıt olarak verir. Bu kayıt
  // sıradan bir "güvensiz yol" DEĞİLDİR: ölçülemeyen bir ağaç sınırıdır ve adı bunu söylemelidir.
  it("gerçek iç içe depo ADIYLA fail-closed durur ve içine İNİLMEZ", () => {
    const dir = seedRepo("nested-repo");
    const nested = path.join(dir, "vendor/inner");
    fs.mkdirSync(nested, { recursive: true });
    git(nested, ["init", "-q", "-b", "main"]);
    write(dir, "vendor/inner/buyuk.txt", "1\n2\n3\n");
    const result = wt.collectWorkingTree({ repoRoot: dir });
    expectFail(result, "untracked-repository-boundary", "iç içe depo");
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(dir);
    expect(serialized).not.toContain("buyuk.txt");
  });

  it("sınır kaydı için `--no-index` alt süreci HİÇ doğmaz (içerik SAYILMAZ)", () => {
    const executor = gitStub({ others: ok(z("vendor/inner/")) });
    const result = wt.collectWorkingTree({ repoRoot: makeTmpDir("boundary-stub"), executor });
    expectFail(result, "untracked-repository-boundary", "enjekte sınır kaydı");
    for (const call of executor.mock.calls)
      expect((call[0] as string[]).includes("--no-index")).toBe(false);
  });

  it("SIRADAN güvensiz yol ile sınır kaydı AYRI sınıflandırılır", () => {
    const dir = makeTmpDir("unsafe-vs-boundary");
    const unsafe = gitStub({ others: ok(z("dist\\gizli.ts")) });
    expectFail(
      wt.collectWorkingTree({ repoRoot: dir, executor: unsafe }),
      "untracked-path-unsafe",
      "ters eğik çizgili yol",
    );
  });

  it("izlenmeyen sembolik BAĞ kabul edilmeye devam eder (P2B2a-1 davranışı korunur)", () => {
    const dir = seedRepo("symlink-kept");
    fs.symlinkSync("a.txt", path.join(dir, "link.txt"));
    const result = wt.collectWorkingTree({ repoRoot: dir });
    expect(result.ok, JSON.stringify(result.error)).toBe(true);
    expect(result.numstatZ).toBe(z("1\t0\tlink.txt"));
  });
});

describe("pr-size-git-working-tree — tüketicinin varsayamayacağı ölçüm gerçekleri", () => {
  // Depo-YEREL `.gitattributes` düşman bir global config değildir; deponun kendi beyanıdır ve
  // ölçülemezliği `-\t-` olarak TELE geçer. Sessizce 0 satır olsaydı bütçe sıfırlanırdı.
  it("depo-yerel `.gitattributes` ikili işareti ikili `-/-` teli üretir, sıfır satır DEĞİL", () => {
    const dir = seedRepo("attributes-binary");
    write(dir, ".gitattributes", "*.dat binary\n");
    write(dir, "veri.dat", "one\n");
    git(dir, ["add", "--", ".gitattributes", "veri.dat"]);
    git(dir, ["commit", "-q", "-m", "attrs"]);
    write(dir, "veri.dat", "one\ntwo\n");
    const result = wt.collectWorkingTree({ repoRoot: dir });
    expect(result.ok, JSON.stringify(result.error)).toBe(true);
    expect(result.numstatZ).toBe(z("-\t-\tveri.dat"));
  });

  // ÜRÜN KARARI DEĞİL, MEVCUT KANONİK ÖLÇÜM DAVRANIŞININ KAYDI: izlenen bir rename tek kez ve
  // yalnız HEDEF yola/kategoriye yazılır; kaynak yol ikinci bir değişen dosya olarak sayılmaz.
  it("izlenen rename yalnız HEDEF yola bir kez yazılır; kaynak+hedef ÇİFT sayılmaz", () => {
    const dir = seedRepo("rename-target");
    fs.mkdirSync(path.join(dir, "src"));
    git(dir, ["mv", "a.txt", "src/hedef.txt"]);
    const result = wt.collectWorkingTree({ repoRoot: dir });
    expect(result.ok, JSON.stringify(result.error)).toBe(true);
    expect(filesOf(result.numstatZ)).toEqual(["src/hedef.txt"]);
    expect(result.numstatZ).not.toContain("a.txt");
  });

  // AYNI disk hareketi, İKİ FARKLI değişen-yol sayısı. `maxChangedFiles` tüketicisi bu ikisini
  // eşdeğer sayarsa aynı iş bir kez geçip bir kez kalır; asimetri gizlenmez, çivilenir.
  it("staged `git mv` TEK yol iken unstaged taşıma İKİ yoldur (eşdeğer DEĞİL)", () => {
    const staged = seedRepo("move-staged");
    git(staged, ["mv", "a.txt", "b.txt"]);
    const stagedResult = wt.collectWorkingTree({ repoRoot: staged });
    expect(stagedResult.ok, JSON.stringify(stagedResult.error)).toBe(true);
    expect(filesOf(stagedResult.numstatZ)).toEqual(["b.txt"]);

    const loose = seedRepo("move-unstaged");
    fs.renameSync(path.join(loose, "a.txt"), path.join(loose, "b.txt"));
    const looseResult = wt.collectWorkingTree({ repoRoot: loose });
    expect(looseResult.ok, JSON.stringify(looseResult.error)).toBe(true);
    // Silinen izlenen kaynak + izlenmeyen hedef: iki AYRI kayıt, tek rename satırı değil.
    expect(filesOf(looseResult.numstatZ)).toEqual(["a.txt", "b.txt"]);
  });
});

describe("pr-size-git-working-tree — kapanmamış kalan sınır DÜRÜSTÇE beyan edilir", () => {
  it("çekirdek yalnız SÜREÇ BAŞINA süre ve süreç SAYISI tavanı taşır; TOPLAM süre P2B2b'dedir", () => {
    // Süreç başına zaman aşımı ve izlenmeyen süreç sayısı tavanı BURADA kapanır…
    expect(typeof wt.DEFAULT_TIMEOUT_MS).toBe("number");
    expect(typeof wt.MAX_UNTRACKED_PATHS).toBe("number");
    // …uçtan uca duvar-saati son tarihi ise KAPANMAMIŞTIR ve burada varmış gibi ihraç edilmez.
    const totalDeadline = Object.keys(wt).filter((key) => /TOTAL|DEADLINE|WALL/i.test(key));
    expect(totalDeadline, "toplam süre bütçesi bu pakette KAPANMADI").toEqual([]);
    expect(fs.readFileSync(path.join(ROOT, MODULE), "utf8")).toContain("P2B2b");
  });

  it("ne çekirdek ne bu kenar süiti kanonik bant eşiği/kimliği KOPYALAR", () => {
    const budget = JSON.parse(
      fs.readFileSync(path.join(ROOT, "src/data/standards/short-code.json"), "utf8"),
    ).changePackageBudget;
    const tiers: Array<{ id: string; maxNet: number }> = [...budget.bands, ...budget.classes];
    const numbers = [
      ...tiers.map((tier) => tier.maxNet),
      budget.splitRequiredAboveNet,
      budget.maxChangedFiles,
    ];
    // `default` kanonik bant kimliği olmasının yanında genel bir programlama sözcüğüdür.
    const ids = tiers.map((tier) => tier.id).filter((id) => id !== "default");
    const copies = (text: string) =>
      numbers.some((n) => new RegExp(`(^|[^0-9_])${n}([^0-9_]|$)`).test(text)) ||
      ids.some((id) => text.includes(id));
    // Dedektörün kendi kanıtı da kanonik sayıdan TÜRETİLİR; bu süit eşiği metne yazmaz.
    expect(new Set(numbers).size, "kanonik eşik kümesi boş olamaz").toBeGreaterThan(1);
    expect(copies(`const MAX_NET = ${numbers[0]}; // band`), "dedektör ateşlemeli").toBe(true);
    for (const file of [MODULE, SELF])
      expect(copies(fs.readFileSync(path.join(ROOT, file), "utf8")), file).toBe(false);
  });
});
