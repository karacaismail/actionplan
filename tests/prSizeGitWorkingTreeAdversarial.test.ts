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

describe("pr-size-git-working-tree — süre sınırlarının KAPSAMI dürüstçe beyan edilir", () => {
  it("süre/sayı tavanı ile ÇAĞIRAN bütçesi vardır; sabit süre POLİTİKASI ihraç EDİLMEZ", () => {
    // Süreç başına zaman aşımı ve izlenmeyen süreç sayısı tavanı BURADA kapanır…
    expect(typeof wt.DEFAULT_TIMEOUT_MS).toBe("number");
    expect(typeof wt.MAX_UNTRACKED_PATHS).toBe("number");
    // …uçtan uca son tarih de artık BURADA kapanır, ama yalnız ÇAĞIRANIN verdiği isteğe bağlı
    // `totalTimeoutMs` olarak. Sabit bir toplam-süre POLİTİKA değeri hâlâ YOKTUR ve ihraç EDİLMEZ;
    // bayrak/varsayılan bağlaması (CLI) P2B2b/B11 kapsamında kalır.
    const totalDeadline = Object.keys(wt).filter((key) => /TOTAL|DEADLINE|WALL/i.test(key));
    expect(totalDeadline, "sabit toplam süre POLİTİKA sabiti ihraç edilemez").toEqual([]);
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

// B10 TOPLAM SÜRE FRENİ (test-önce RED). Yukarıdaki süit "uçtan uca duvar-saati son tarihi
// KAPANMADI" diyordu; aşağıdaki iddialar o sınırın SÖZLEŞMESİni çiviler. Bütçe bir ÇAĞIRAN
// SEÇENEĞİdir, ihraç edilen bir politika sabiti DEĞİL: yukarıdaki `TOTAL|DEADLINE|WALL` yasağı
// aynen geçerli kalır. Saat ENJEKTE edilir; gerçek uyku, ağ ve süreç-zamanı bağımlılığı YOKTUR.
const TOTAL_INVALID = "working-tree-total-timeout-invalid";
const DEADLINE_EXCEEDED = "working-tree-deadline-exceeded";
const CLOCK_INVALID = "working-tree-clock-invalid";
const CLOCK_FAILED = "working-tree-clock-failed";
const CLOCK_BACKWARDS = "working-tree-clock-not-monotonic";
const STUB_ROOT = "/tmp/wt-stub";
/** Bütçeye göre GENİŞ; bu değerle bütçe hiçbir zaman dar taraf olmaz. */
const ROOMY_BUDGET = 60_000;

/** Okumalar önceden verilen listeden gelir; liste bitince SON değer sabitlenir. Gerçek saat YOK. */
const stepClock = (values: number[]) => {
  let index = 0;
  return vi.fn(() => values[Math.min(index++, values.length - 1)]);
};
/** Süre aşımı sınıfı `error.code === "ETIMEDOUT"` üzerinden tanınır; stub o şekli taşımalıdır. */
const timedOut = () => ({
  status: null,
  signal: null,
  stdout: buf(""),
  stderr: buf(""),
  error: { code: "ETIMEDOUT" },
});
/** TEMİZ bir koşunun süreç sayısı ÖLÇÜLÜR; sabit yazılmaz, böylece adım sırası değişse de yaşar. */
const cleanRunCalls = () => {
  const executor = gitStub();
  wt.collectWorkingTree({ repoRoot: STUB_ROOT, executor });
  return executor.mock.calls.length;
};
// biome-ignore lint/suspicious/noExplicitAny: the collector's failure shape has no declaration file.
const expectNoPartialSuccess = (result: any) => {
  expect(result.numstatZ, "başarısız ölçüm KISMİ tel sızdıramaz").toBeUndefined();
  expect(result.metadata, "başarısız ölçüm KISMİ üstveri sızdıramaz").toBeUndefined();
};

describe("pr-size-git-working-tree — TOPLAM bütçe GİRDİSİ kendi başına doğrulanır", () => {
  // Geçersiz bütçe SESSİZCE yok sayılırsa çağıran freni koyduğunu SANIR ve ölçüm sınırsız kalır.
  // Bu yüzden doğrulama, ilk alt süreç DOĞMADAN ÖNCE fail-closed durmalıdır.
  // biome-ignore format: the invalid-budget matrix stays one row per case for the shard budget
  const invalid: Array<[string, unknown]> = [
    ["sıfır", 0], ["negatif", -1], ["kesirli", 1.5], ["NaN", Number.NaN],
    ["sonsuz", Number.POSITIVE_INFINITY], ["eksi sonsuz", Number.NEGATIVE_INFINITY],
    ["metin", "5"], ["null", null], ["güvenli tamsayı dışı", Number.MAX_SAFE_INTEGER + 2],
    ["nesne", {}], ["dizi", []], ["boolean", true],
  ];

  for (const [name, value] of invalid)
    it(`${name} totalTimeoutMs → ${TOTAL_INVALID} ve HİÇ süreç doğmaz`, () => {
      const executor = gitStub();
      const result = wt.collectWorkingTree({
        repoRoot: STUB_ROOT,
        executor,
        totalTimeoutMs: value,
      });
      expectFail(result, TOTAL_INVALID, `geçersiz toplam bütçe: ${name}`);
      expect(executor.mock.calls.length, "doğrulama alt süreçten ÖNCE olmalı").toBe(0);
    });
});

describe("pr-size-git-working-tree — ENJEKTE saat adlandırılmış hatalarla reddedilir", () => {
  for (const [name, clock] of [
    ["sayı", 5],
    ["metin", "now"],
    ["nesne", {}],
  ] as Array<[string, unknown]>)
    it(`çağrılamayan saat (${name}) → ${CLOCK_INVALID} ve HİÇ süreç doğmaz`, () => {
      const executor = gitStub();
      const result = wt.collectWorkingTree({
        repoRoot: STUB_ROOT,
        executor,
        totalTimeoutMs: ROOMY_BUDGET,
        clock,
      });
      expectFail(result, CLOCK_INVALID, `çağrılamayan saat: ${name}`);
      expect(executor.mock.calls.length).toBe(0);
    });

  it(`ATAN saat → ${CLOCK_FAILED}; ham neden rapora TAŞINMAZ`, () => {
    const executor = gitStub();
    const clock = () => {
      throw new Error("saat okunamadı");
    };
    const result = wt.collectWorkingTree({
      repoRoot: STUB_ROOT,
      executor,
      totalTimeoutMs: ROOMY_BUDGET,
      clock,
    });
    expectFail(result, CLOCK_FAILED, "atan saat");
    expect(JSON.stringify(result)).not.toContain("saat okunamadı");
    expect(executor.mock.calls.length).toBe(0);
  });

  for (const [name, reading] of [
    ["NaN", Number.NaN],
    ["sonsuz", Number.POSITIVE_INFINITY],
    ["metin", "3"],
  ] as Array<[string, unknown]>)
    it(`sonlu SAYI vermeyen saat (${name}) → ${CLOCK_INVALID}`, () => {
      const executor = gitStub();
      const result = wt.collectWorkingTree({
        repoRoot: STUB_ROOT,
        executor,
        totalTimeoutMs: ROOMY_BUDGET,
        clock: () => reading,
      });
      expectFail(result, CLOCK_INVALID, `sonlu olmayan okuma: ${name}`);
      expect(executor.mock.calls.length).toBe(0);
    });

  // GERİYE giden saat yalnız İKİNCİ okumada görülebilir; o andan SONRA yeni süreç doğmamalıdır.
  it(`GERİYE giden saat → ${CLOCK_BACKWARDS} ve SONRAKİ süreç doğmaz`, () => {
    const total = cleanRunCalls();
    const executor = gitStub();
    const result = wt.collectWorkingTree({
      repoRoot: STUB_ROOT,
      executor,
      totalTimeoutMs: 5,
      clock: stepClock([9, 3]),
    });
    expectFail(result, CLOCK_BACKWARDS, "geriye giden saat");
    expect(executor.mock.calls.length, "tel TAMAMLANMAMALI").toBeLessThan(total);
    expectNoPartialSuccess(result);
  });
});

describe("pr-size-git-working-tree — bütçe VERİLMEYİNCE eski davranış birebir korunur", () => {
  it("saat HİÇ okunmaz ve sonuç bütçesiz çağrıyla AYNIdır", () => {
    const clock = vi.fn(() => 1);
    const withClock = wt.collectWorkingTree({
      repoRoot: STUB_ROOT,
      executor: gitStub(),
      clock,
    });
    const plain = wt.collectWorkingTree({ repoRoot: STUB_ROOT, executor: gitStub() });
    expect(clock, "bütçe yokken saat okunmamalı").not.toHaveBeenCalled();
    expect(withClock).toEqual(plain);
    expect(plain.ok, JSON.stringify(plain.error)).toBe(true);
  });
});

describe("pr-size-git-working-tree — bütçe TÜKENMESİ tek adlandırılmış hataya iner", () => {
  it("İLK süreçten ÖNCE tükenen bütçe: hiç süreç doğmaz", () => {
    const executor = gitStub();
    const result = wt.collectWorkingTree({
      repoRoot: STUB_ROOT,
      executor,
      totalTimeoutMs: 5,
      clock: stepClock([0, 9]),
    });
    expectFail(result, DEADLINE_EXCEEDED, "ilk süreçten önce tükenen bütçe");
    expect(executor.mock.calls.length).toBe(0);
    expectNoPartialSuccess(result);
  });

  it("SÜREÇLER ARASINDA tükenen bütçe: tel TAMAMLANMADAN durulur", () => {
    const total = cleanRunCalls();
    const executor = gitStub();
    const result = wt.collectWorkingTree({
      repoRoot: STUB_ROOT,
      executor,
      totalTimeoutMs: 5,
      clock: stepClock([0, 1, 9]),
    });
    expectFail(result, DEADLINE_EXCEEDED, "süreçler arasında tükenen bütçe");
    expect(executor.mock.calls.length).toBeGreaterThan(0);
    expect(executor.mock.calls.length).toBeLessThan(total);
    expectNoPartialSuccess(result);
  });

  // Kalan bütçe süreç-başına süreden DARSA etkin tavan kalan bütçedir ve sonuç TOPLAM tükenmesidir.
  // `git-timeout` deseydi çağıran tek bir yavaş süreci suçlar, bütçenin bittiğini göremezdi.
  it(`kalan bütçe DAR taraf olduğunda ${DEADLINE_EXCEEDED} verir, git-timeout DEĞİL`, () => {
    const executor = gitStub({ tracked: timedOut() });
    const result = wt.collectWorkingTree({
      repoRoot: STUB_ROOT,
      executor,
      timeoutMs: 11,
      totalTimeoutMs: 3,
      clock: stepClock([0, 1]),
    });
    expectFail(result, DEADLINE_EXCEEDED, "dar kalan bütçe");
    const opts = executor.mock.calls.at(-1)?.[1] as { timeoutMs: number };
    expect(opts.timeoutMs, "etkin tavan DAR olan taraf olmalı").toBeLessThanOrEqual(3);
    expectNoPartialSuccess(result);
  });

  it("SON süreçten SONRA tükenen bütçe: başarı YAZILMAZ", () => {
    const total = cleanRunCalls();
    const executor = gitStub();
    const clock = vi.fn(() => (executor.mock.calls.length >= total ? 9 : 1));
    const result = wt.collectWorkingTree({
      repoRoot: STUB_ROOT,
      executor,
      totalTimeoutMs: 5,
      clock,
    });
    expectFail(result, DEADLINE_EXCEEDED, "son süreçten sonra tükenen bütçe");
    expect(executor.mock.calls.length, "tüm süreçler koşmuş olmalı").toBe(total);
    expectNoPartialSuccess(result);
  });
});

describe("pr-size-git-working-tree — bütçe DAR taraf DEĞİLKEN eski sınıflandırma korunur", () => {
  it("sıradan süreç-başına zaman aşımı `git-timeout` kalır", () => {
    const executor = gitStub({ tracked: timedOut() });
    const result = wt.collectWorkingTree({
      repoRoot: STUB_ROOT,
      executor,
      timeoutMs: 3,
      totalTimeoutMs: ROOMY_BUDGET,
      clock: () => 1,
    });
    expectFail(result, "git-timeout", "bütçe geniş, süreç zaman aşımı");
  });

  it("saat ENJEKTE edilmeden de varsayılan tek-yönlü saat yolu koşar (gerçek uyku YOK)", () => {
    const result = wt.collectWorkingTree({
      repoRoot: STUB_ROOT,
      executor: gitStub(),
      totalTimeoutMs: ROOMY_BUDGET,
    });
    expect(result.ok, JSON.stringify(result.error)).toBe(true);
  });
});

describe("pr-size-git-working-tree — BAŞARI üstverisi büyümez ve iç durum SIZDIRMAZ", () => {
  it("anahtar kümesi AYNI kalır; son tarih/geçen süre/enjekte değer/mutlak kök taşınmaz", () => {
    const injected = 987654321;
    const result = wt.collectWorkingTree({
      repoRoot: STUB_ROOT,
      executor: gitStub({ tracked: ok(z("1\t0\ta.txt")) }),
      totalTimeoutMs: ROOMY_BUDGET,
      clock: () => injected,
    });
    expect(result.ok, JSON.stringify(result.error)).toBe(true);
    expect(Object.keys(result.metadata).sort()).toEqual(["byteLength", "head", "sha256", "source"]);
    const serialized = JSON.stringify(result);
    for (const leak of ["deadline", "elapsed", "totalTimeoutMs", "startedAt", "remaining", "clock"])
      expect(serialized, `sızıntı: ${leak}`).not.toContain(leak);
    expect(serialized).not.toContain(String(injected));
    expect(serialized).not.toContain(STUB_ROOT);
    expect(serialized).not.toContain(os.homedir());
  });
});

describe("pr-size-git-working-tree — YAPISAL kabul: değişen test-DIŞI kaynak kısa kalır", () => {
  // SR-02 (B10-SR02-FILE-LENGTH): kanonik kural her test-dışı kaynağı ≤ tavan sayar ve BLOKLAR,
  // ama kurulu checker yalnız `src/**/*.ts(x)` yürür ve `tools/lib/*.mjs`'e HİÇ bakmaz. Kapı
  // burada YAPISAL olarak kapatılır; yardımcının İÇ tasarımına hiçbir şey dayatılmaz, yalnız BOY.
  const MAX_SOURCE_LINES = 300;
  const HISTORICAL_MONOLITH_LINES = 379;
  const lineCount = (text: string) => text.split("\n").length;
  const SOURCES = [MODULE, "tools/lib/pr-size-total-deadline.mjs"];

  it("değişen/planlanan her test-dışı kaynak satır tavanının altında kalır", () => {
    const present = SOURCES.filter((file) => fs.existsSync(path.join(ROOT, file)));
    expect(present.length, "en az bir kaynak ölçülmeli").toBeGreaterThan(0);
    for (const file of present)
      expect(lineCount(fs.readFileSync(path.join(ROOT, file), "utf8")), file).toBeLessThanOrEqual(
        MAX_SOURCE_LINES,
      );
  });

  it("tavan DİŞLİDİR: tarihsel monolit boyundaki aday REDDEDİLİR", () => {
    const monolith = `${"x\n".repeat(HISTORICAL_MONOLITH_LINES - 1)}x`;
    expect(lineCount(monolith)).toBe(HISTORICAL_MONOLITH_LINES);
    expect(lineCount(monolith) <= MAX_SOURCE_LINES, "tarihsel monolit kabul edilemez").toBe(false);
  });
});
