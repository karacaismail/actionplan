import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, describe, expect, it } from "vitest";

// P2A-2c + P2B1b: kabul edilmiş SAF ölçüm/karar motorlarının ve GİT ARALIĞI toplayıcısının
// çevresindeki DETERMİNİSTİK SÜREÇ yüzeyi. Burada kanıtlanan tek şey sürecin dar, fail-closed ve
// sızıntısız olduğudur: argv dilbilgisi, TEK kaynak kuralı, fixture tipi/sınırı, kanonik config'in
// ve depo kökünün cwd'den bağımsız çözülmesi, çıkış kodu eşlemesi ve stdout'un HER yolda yalnız tam
// JSON olması. Eşik/bant/kanıt kimliği bu dosyada ikinci kez YAZILMAZ; hepsi kanonikten türetilir.
// KAPSAM DÜRÜST: üç kaynak da toplanır ve B12'den sonra kapı `pull_request` olayında bir CI
// adımına BAĞLIdır; ama doğrudan/yerel çağrı hâlâ `ciEnforced=false` kalır ve branch protection /
// zorunlu check (B13) bu pakette AÇIK bırakılır.
const ROOT = process.cwd();
const CLI = "tools/agents/check-pr-size.mjs";
/** B12: kapıyı `pull_request` olayına bağlayan ince adaptör; davranışı kendi testinde kanıtlanır. */
const ADAPTER = "tools/agents/check-pr-size-ci.mjs";
const SELF = "tests/prSizeCheckerGovernance.test.ts";
const ENGINE = "tools/lib/pr-size-decision.mjs";
const CORE = "tools/lib/pr-size-core.mjs";
const COLLECTOR = "tools/lib/pr-size-git-range.mjs";
/** B11: kabul edilmiş ÇALIŞMA AĞACI toplayıcısı ve onun süre bütçesi; burada YENİDEN yazılmaz. */
const TREE_COLLECTOR = "tools/lib/pr-size-git-working-tree.mjs";
const DEADLINE = "tools/lib/pr-size-total-deadline.mjs";
const CANONICAL = "src/data/standards/short-code.json";
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const href = (relative: string) => pathToFileURL(path.join(ROOT, relative)).href;

// biome-ignore lint/suspicious/noExplicitAny: kanonik JSON ve makine raporu burada ham okunur.
type Any = any;
const canonical = JSON.parse(read(CANONICAL)) as Any;
const budget = canonical.changePackageBudget as Any;
const BANDS = budget.bands as Array<{ id: string; maxNet: number; requires: string[] }>;
const [LOW, MID, TOP] = BANDS;
const CLASSES = budget.classes as Array<{ id: string; maxNet: number }>;
// Sınıflar KİMLİKLE değil, tavanlarının türediği bantla seçilir: ikinci kimlik kopyası yok.
const TIGHT = (CLASSES.find((c) => c.maxNet === LOW.maxNet) as { id: string }).id;
const WIDE = (CLASSES.find((c) => c.maxNet === MID.maxNet) as { id: string }).id;
const CHURN = budget.churnGuard as { requires: string[]; grossMaxFromBand: string };
const bandNamed = (id: string) => BANDS.find((b) => b.id === id) as { maxNet: number };
const GROSS_MAX = bandNamed(CHURN.grossMaxFromBand).maxNet;
const SCOPE_MAX = bandNamed(budget.churnGuard.appliesWhenNetAtOrBelowBand).maxNet;

const engine = (await import(href(ENGINE))) as Any;
const DECISION = engine.DECISION as Record<string, string>;
const KIND = engine.ERROR_KIND as Record<string, string>;
/** Kaynağın ADI da ikinci kez yazılmaz: kabul edilmiş toplayıcının kendi `SOURCE` alanıdır. */
const TREE = ((await import(href(TREE_COLLECTOR))) as Any).SOURCE as string;

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "pr-size-cli-"));
afterAll(() => fs.rmSync(TMP, { recursive: true, force: true }));
const at = (name: string) => path.join(TMP, name);

let seq = 0;
const nextId = () => {
  seq += 1;
  return seq;
};
/**
 * CLI'ın dışa açtığı yüzey DÜZ NODE'da okunur: dosya bir kabuk girişidir (hashbang taşır) ve
 * sözleşmesi test yükleyicisinin dönüşümüne değil, gerçek çalıştırma ortamına dayanmalıdır.
 */
const probe = (expression: string): Any => {
  const script = at(`probe-${nextId()}.mjs`);
  const source = `import * as cli from ${JSON.stringify(href(CLI))};`;
  fs.writeFileSync(script, `${source}\nprocess.stdout.write(JSON.stringify(${expression}));\n`);
  const result = spawnSync(process.execPath, [script], { encoding: "utf8" });
  if (!result.stdout) throw new Error(`CLI yüzeyi okunamadı: ${result.stderr}`);
  return JSON.parse(result.stdout);
};
const SURFACE = probe(
  `{ schema: cli.CLI_SCHEMA, version: cli.CLI_VERSION, inputMode: cli.INPUT_MODE,
     rangeMode: cli.RANGE_MODE, internal: cli.INTERNAL,
     maxFixtureBytes: cli.MAX_FIXTURE_BYTES, exit: cli.EXIT_CODE }`,
);
const EXIT = SURFACE.exit as Record<string, number>;

/** `git diff --numstat -z` teli; kayıt sınırı NUL'dur. */
const zRow = (a: string | number, d: string | number, file: string) => `${a}\t${d}\t${file}\0`;
const GOVERNED = "src/pkg/change.ts";
const wireForNet = (net: number, deletions = 0) => zRow(net + deletions, deletions, GOVERNED);
/** Brüt = net + 2×silme; verilen brüte ulaşan en küçük churn payı aritmetikle türetilir. */
const wireAtGross = (gross: number) => wireForNet(SCOPE_MAX, Math.ceil((gross - SCOPE_MAX) / 2));

const wireFile = (wire: string | Buffer, name = `wire-${nextId()}.z`) => {
  const file = at(name);
  fs.writeFileSync(file, wire);
  return file;
};
const argsFor = (file: string, klass: string, ids: string[] = []) => [
  `--numstat-z-input=${file}`,
  `--class=${klass}`,
  ...(ids.length ? [`--evidence=${ids.join(",")}`] : []),
];
/** stdin'e geçerli görünen bir tel verilir: süreç ona GÜVENİRSE testler bunu yakalar. */
const STDIN_NOISE = zRow(9, 0, GOVERNED);
type Run = { status: number | null; stdout: string; stderr: string; report: Any };
const run = (args: string[], options: { cwd?: string; cli?: string } = {}): Run => {
  const entry = options.cli ?? path.join(ROOT, CLI);
  const result = spawnSync(process.execPath, [entry, ...args], {
    cwd: options.cwd ?? ROOT,
    encoding: "utf8",
    input: STDIN_NOISE,
  });
  let report: Any = null;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    throw new Error(
      `stdout tam JSON değil (${result.status}): ${result.stdout.slice(0, 300)} | ${result.stderr}`,
    );
  }
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, report };
};
const check = (wire: string | Buffer, klass: string, ids: string[] = []) =>
  run(argsFor(wireFile(wire), klass, ids));
const failure = (result: Run, id: string, kind: string) => {
  expect(result.report.error?.id, JSON.stringify(result.report.error)).toBe(id);
  expect(result.report.error.kind).toBe(kind);
  expect(result.report.status).toBe(kind);
  expect(result.status).toBe(EXIT[kind]);
  expect(result.status, "hata sıfırla kapandı").not.toBe(EXIT[DECISION.accepted]);
};

/**
 * İZOLE LABORATUVAR: kanonik sapma/eksiklik ve süreç-içi hata worktree'ye DOKUNMADAN kanıtlanır.
 * CLI + iki kütüphane + kanonik JSON aynı göreli düzende kopyalanır; kopya CLI kanonik alanı kendi
 * modül URL'inden çözdüğü için lab config'i okur — cwd bağımsızlığının da kanıtıdır.
 */
const install = (root: string, makeConfig?: (doc: Any) => string | null) => {
  for (const dir of ["tools/agents", "tools/lib", "src/data/standards"])
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  for (const file of [CLI, CORE, ENGINE, COLLECTOR, TREE_COLLECTOR, DEADLINE])
    fs.copyFileSync(path.join(ROOT, file), path.join(root, file));
  const text = makeConfig ? makeConfig(JSON.parse(read(CANONICAL))) : read(CANONICAL);
  if (text !== null) fs.writeFileSync(path.join(root, CANONICAL), text);
  return path.join(root, CLI);
};
const lab = (
  makeConfig: (doc: Any) => string | null,
  engineSource?: string,
  treeSource?: string,
) => {
  const root = at(`lab-${nextId()}`);
  const entry = install(root, makeConfig);
  if (engineSource) fs.writeFileSync(path.join(root, ENGINE), engineSource);
  if (treeSource) fs.writeFileSync(path.join(root, TREE_COLLECTOR), treeSource);
  return entry;
};

/**
 * GERÇEK depo laboratuvarı: aralık yolu uydurma bir yürütücüyle değil, izole bir geçici depoda
 * gerçek `git` ile kanıtlanır. Kapının kökü ÇAĞIRANIN cwd'si değil KENDİ konumu olduğu için CLI
 * kopyası deponun içine aynı göreli düzende kurulur; kopya izlenmeyen kalır ve ölçülen aralığa
 * giremez.
 */
const git = (cwd: string, args: string[]) => {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args[0]} başarısız: ${result.stderr}`);
  return result.stdout.trim();
};
const repoAt = (label: string) => {
  const root = at(`repo-${label}-${nextId()}`);
  fs.mkdirSync(root, { recursive: true });
  git(root, ["init", "-q", "-b", "main"]);
  git(root, ["config", "user.email", "pr-size@example.test"]);
  git(root, ["config", "user.name", "pr-size"]);
  return root;
};
const commit = (root: string, file: string, body: string, message: string) => {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), body);
  git(root, ["add", "--", file]);
  git(root, ["commit", "-q", "-m", message]);
  return git(root, ["rev-parse", "HEAD"]);
};
const body = (count: number) =>
  `${Array.from({ length: count }, (_v, i) => `satir ${i}`).join("\n")}\n`;
/** Ölçülen net; eşik kopyası değil, banttan bağımsız küçük bir sayıdır. */
const RANGE_NET = 3;
/**
 * IRAKSAYAN tarih: fork noktasından sonra HEM dal HEM de taban ilerler. İki-nokta farkı tabanın
 * işini de sayardı; toplayıcının merge-base'li aralığı saymaz — kanıt bu ayrımdadır.
 */
const divergentRepo = () => {
  const root = repoAt("range");
  commit(root, "README.md", "kok\n", "kok");
  const forkPoint = commit(root, "src/pkg/taban.ts", body(1), "fork");
  git(root, ["checkout", "-q", "-b", "feature"]);
  const head = commit(root, GOVERNED, body(RANGE_NET), "dal ilerledi");
  git(root, ["checkout", "-q", "main"]);
  const base = commit(root, "src/pkg/baska.ts", body(RANGE_NET + 2), "taban ilerledi");
  return { root, forkPoint, base, head, cli: install(root) };
};
const rangeArgs = (base: string, head: string, klass: string, ids: string[] = []) => [
  `--base=${base}`,
  `--head=${head}`,
  `--class=${klass}`,
  ...(ids.length ? [`--evidence=${ids.join(",")}`] : []),
];

describe("pr-size süreç kapısı — argv yalnız dar ve deterministik yüzeydir", () => {
  const OK_FIXTURE = wireFile(wireForNet(1), "argv-base.z");
  const flag = (name: string) => `--${name}`;
  const cases: Array<[string, string[], string]> = [
    ["bayrak yok", [], "flag-missing"],
    ["kaynak yok", [`--class=${TIGHT}`], "source-missing"],
    ["sınıf yok", [`--numstat-z-input=${OK_FIXTURE}`], "flag-missing"],
    ["yalnız base", ["--base=main", `--class=${TIGHT}`], "source-incomplete"],
    ["yalnız head", ["--head=main", `--class=${TIGHT}`], "source-incomplete"],
    ["fixture + base", [...argsFor(OK_FIXTURE, TIGHT), "--base=main"], "source-mixed"],
    ["fixture + head", [...argsFor(OK_FIXTURE, TIGHT), "--head=main"], "source-mixed"],
    [
      "fixture + tam aralık",
      [...argsFor(OK_FIXTURE, TIGHT), "--base=main", "--head=main"],
      "source-mixed",
    ],
    ["boş base değeri", ["--base=", "--head=main", `--class=${TIGHT}`], "flag-empty-value"],
    ["çıplak head bayrağı", ["--base=main", "--head", `--class=${TIGHT}`], "flag-missing-value"],
    ["bilinmeyen bayrak", [...argsFor(OK_FIXTURE, TIGHT), "--range=HEAD~1"], "flag-unknown"],
    ["yardım bayrağı da dar yüzeye girmez", ["--help"], "flag-unknown"],
    ["çıplak bayrak", [`--numstat-z-input=${OK_FIXTURE}`, "--class"], "flag-missing-value"],
    ["çıplak fixture bayrağı", ["--numstat-z-input", `--class=${TIGHT}`], "flag-missing-value"],
    ["boş sınıf değeri", [`--numstat-z-input=${OK_FIXTURE}`, "--class="], "flag-empty-value"],
    ["boş fixture değeri", ["--numstat-z-input=", `--class=${TIGHT}`], "flag-empty-value"],
    ["boş kanıt değeri", [...argsFor(OK_FIXTURE, TIGHT), "--evidence="], "flag-empty-value"],
    ["konumsal argüman", [...argsFor(OK_FIXTURE, TIGHT), "extra"], "positional-argument"],
    ["kısa bayrak", ["-c", TIGHT], "positional-argument"],
    ["çıplak ayırıcı", [...argsFor(OK_FIXTURE, TIGHT), "--"], "flag-unknown"],
  ];
  it.each(cases)("%s reddedilir", (_label, args, id) => {
    failure(run(args), id, KIND.caller);
  });

  it.each(["numstat-z-input", "class", "evidence"])("%s bayrağı tekrarlanamaz", (name) => {
    const base = argsFor(OK_FIXTURE, TIGHT, [MID.requires[0]]);
    const doubled = [
      ...base,
      `${flag(name)}=${base.find((a) => a.startsWith(flag(name)))?.split("=")[1]}`,
    ];
    failure(run(doubled), "flag-duplicate", KIND.caller);
  });

  it.each(["base", "head"])("%s bayrağı tekrarlanamaz", (name) => {
    failure(
      run([...rangeArgs("main", "main", TIGHT), `${flag(name)}=main`]),
      "flag-duplicate",
      KIND.caller,
    );
  });

  it.each([
    [`${MID.requires[0]},,${MID.requires[1]}`, "evidence-empty-item"],
    [`${MID.requires[0]},`, "evidence-empty-item"],
    [`,${MID.requires[0]}`, "evidence-empty-item"],
  ])("kanıt listesi boş kimlik taşıyamaz: %s", (list, id) => {
    failure(run([...argsFor(OK_FIXTURE, TIGHT), `--evidence=${list}`]), id, KIND.caller);
  });

  it("tekrarlı kanıt, bilinmeyen kanıt ve bilinmeyen sınıf motora devredilir", () => {
    const repeated = [MID.requires[0], MID.requires[0]];
    failure(check(wireForNet(MID.maxNet), WIDE, repeated), "evidence-duplicate", KIND.caller);
    failure(check(wireForNet(1), TIGHT, ["uydurma-kanit"]), "evidence-unknown", KIND.caller);
    failure(check(wireForNet(1), "uydurma-sinif"), "class-unknown", KIND.caller);
  });

  it("stdin'e yaslanmaz: geçerli çağrı stdin gürültüsünden etkilenmez", () => {
    const accepted = check(wireForNet(LOW.maxNet), TIGHT);
    expect(accepted.report.status).toBe(DECISION.accepted);
    expect(accepted.report.decisionReport.measurement.budgetNet).toBe(LOW.maxNet);
    // stdin geçerli bir tel taşısa bile bildirilmiş bir kaynak yoksa süreç DURUR; stdin girdi değildir.
    failure(run([`--class=${TIGHT}`]), "source-missing", KIND.caller);
  });
});

describe("pr-size süreç kapısı — fixture güvenliği fail-closed", () => {
  it.each([
    ["olmayan dosya", () => at("yok-boyle-bir-dosya.z"), "fixture-unreadable"],
    ["dizin", () => TMP, "fixture-not-regular-file"],
    [
      "sembolik bağ",
      () => {
        const link = at("link.z");
        fs.symlinkSync(wireFile(wireForNet(1), "link-target.z"), link);
        return link;
      },
      "fixture-not-regular-file",
    ],
    ["aygıt dosyası", () => "/dev/null", "fixture-not-regular-file"],
  ])("%s reddedilir", (_label, make, id) => {
    failure(run(argsFor(make(), TIGHT)), id, KIND.input);
  });

  it("okunamayan dosya fail-closed durur", () => {
    if (process.getuid?.() === 0) return; // root her şeyi okur: bu kanıt taşınabilir değil
    const file = wireFile(wireForNet(1), "kilitli.z");
    fs.chmodSync(file, 0o000);
    failure(run(argsFor(file, TIGHT)), "fixture-unreadable", KIND.input);
    fs.chmodSync(file, 0o600);
  });

  it("güvenlik tavanını aşan fixture OKUNMADAN reddedilir ve içeriği sızmaz", () => {
    const marker = "GIZLI-ICERIK";
    const oversized = Buffer.alloc(SURFACE.maxFixtureBytes + 1, marker);
    const result = run(argsFor(wireFile(oversized, "buyuk.z"), TIGHT));
    failure(result, "fixture-too-large", KIND.input);
    expect(result.stdout, "fixture içeriği tanılamaya sızdı").not.toContain(marker);
    // Tavan bir POLİTİKA eşiği değildir: bant/sınıf tavanlarından bağımsız bir uygulama freni.
    expect(SURFACE.maxFixtureBytes).toBeGreaterThan(TOP.maxNet);
  });

  it("boş fixture süreç yüzeyinde AÇIKÇA reddedilir; motor saf kalır", () => {
    failure(run(argsFor(wireFile("", "bos.z"), TIGHT)), "fixture-empty", KIND.input);
    // Motor DEĞİŞMEDİ: saf katman boş teli hâlâ ölçer ve kabul eder; ret süreç sözleşmesidir.
    const pure = engine.decide({ budget, numstatZ: "", klass: TIGHT, evidence: [] });
    expect(pure.decision, "motor süreç kararını üstlendi").toBe(DECISION.accepted);
  });

  it.each([
    ["kapanmamış NUL çerçevesi", Buffer.from(`1\t0\t${GOVERNED}`), "measurement-input-invalid"],
    [
      "geçersiz UTF-8",
      Buffer.from([0x31, 0x09, 0x30, 0x09, 0xff, 0xfe, 0x00]),
      "numstat-z-not-bytes",
    ],
    ["güvensiz yol", Buffer.from(zRow(1, 0, "/etc/passwd")), "path-unsafe"],
  ])("%s ölçüm girdisi hatası verir", (_label, bytes, id) => {
    failure(run(argsFor(wireFile(bytes), TIGHT)), id, KIND.input);
  });
});

describe("pr-size süreç kapısı — karar ve çıkış kodu eşlemesi", () => {
  it("çıkış kodu haritası kararlıdır: yalnız kabul sıfırdır", () => {
    const keys = [DECISION.accepted, DECISION.rejected, DECISION.split, ...Object.values(KIND)];
    expect(Object.keys(EXIT).sort()).toEqual([...keys, SURFACE.internal].sort());
    expect(new Set(Object.values(EXIT)).size, "çıkış kodu çakışması").toBe(
      Object.keys(EXIT).length,
    );
    expect(EXIT[DECISION.accepted]).toBe(0);
    for (const [status, code] of Object.entries(EXIT))
      if (status !== DECISION.accepted) expect(code, status).toBeGreaterThan(0);
  });

  it("kabul, ret ve split ayrı çıkış kodlarına düşer", () => {
    const accepted = check(wireForNet(LOW.maxNet), TIGHT);
    expect([accepted.status, accepted.report.status]).toEqual([0, DECISION.accepted]);
    const rejected = check(wireForNet(MID.maxNet), WIDE);
    expect(rejected.report.decisionReport.blockers.map((b: Any) => b.id)).toContain(
      "evidence-missing",
    );
    expect([rejected.status, rejected.report.status]).toEqual([
      EXIT[DECISION.rejected],
      DECISION.rejected,
    ]);
    const split = check(wireForNet(budget.splitRequiredAboveNet + 1), WIDE, TOP.requires);
    expect([split.status, split.report.status]).toEqual([EXIT[DECISION.split], DECISION.split]);
  });

  it("koşullu bant ve muafiyet bandı süreçten geçerek kabul edilir", () => {
    for (const band of [MID, TOP]) {
      const result = check(wireForNet(band.maxNet), WIDE, band.requires);
      expect(result.report.decisionReport.band.id, `bant ${band.id}`).toBe(band.id);
      expect(result.status, `bant ${band.id} kanıtla kabul edilmedi`).toBe(0);
      const bare = check(wireForNet(band.maxNet), WIDE);
      expect(bare.status, `bant ${band.id} kanıtsız kabul edildi`).toBe(EXIT[DECISION.rejected]);
    }
  });

  it("churn freni ve dosya tavanı süreçte de bloklar", () => {
    const churn = wireAtGross(GROSS_MAX + 1);
    expect(check(churn, TIGHT).status).toBe(EXIT[DECISION.rejected]);
    expect(check(churn, TIGHT, CHURN.requires).status, "kanonik kanıt freni açmadı").toBe(0);
    const many = Array.from({ length: budget.maxChangedFiles + 1 }, (_v, i) =>
      zRow(1, 0, `src/pkg/f${i}.ts`),
    ).join("");
    const files = check(many, TIGHT);
    expect(files.report.decisionReport.blockers.map((b: Any) => b.id)).toContain(
      "max-changed-files-exceeded",
    );
    expect(files.status).toBe(EXIT[DECISION.rejected]);
  });
});

describe("pr-size süreç kapısı — rapor yüzeyi yalnız JSON, sızıntısız ve deterministik", () => {
  it("zarf minimaldir, dürüsttür ve saf karar raporunu BOZMADAN taşır", () => {
    const result = check(wireForNet(LOW.maxNet), TIGHT);
    expect(Object.keys(result.report)).toEqual([
      "schema",
      "version",
      "inputMode",
      "canonicalStandard",
      "collectsGitRange",
      "collectsWorkingTree",
      "ciEnforced",
      "status",
      "exitCode",
      "fixture",
      "range",
      "workingTree",
      "error",
      "decisionReport",
    ]);
    expect(result.report.schema).toBe(SURFACE.schema);
    expect(result.report.version).toBe(SURFACE.version);
    expect(result.report.inputMode).toBe(SURFACE.inputMode);
    expect(result.report.canonicalStandard).toBe(CANONICAL);
    // Dürüstlük: fixture yolunda hiçbir git kaynağı TOPLANMAZ, CI bloklaması İDDİA EDİLMEZ.
    expect([
      result.report.collectsGitRange,
      result.report.collectsWorkingTree,
      result.report.ciEnforced,
    ]).toEqual([false, false, false]);
    expect(result.report.range, "fixture yolunda aralık provenansı uyduruldu").toBeNull();
    expect(result.report.workingTree, "fixture yolunda ağaç provenansı uyduruldu").toBeNull();
    expect(result.report.exitCode).toBe(result.status);
    // Provenans yol DEĞİL, bayt sayısı + özet: mutlak yol rapora hiç girmez.
    expect(Object.keys(result.report.fixture)).toEqual(["bytes", "sha256"]);
    expect(result.report.fixture.sha256).toMatch(/^[0-9a-f]{64}$/);
    const pure = engine.decide({
      budget,
      numstatZ: wireForNet(LOW.maxNet),
      klass: TIGHT,
      evidence: [],
    });
    expect(JSON.stringify(result.report.decisionReport), "saf rapor değiştirildi").toBe(
      JSON.stringify(pure),
    );
  });

  it("motor reddi de saf haliyle korunur; zarf yalnız sınıfı yüzeye taşır", () => {
    const result = check(wireForNet(1), "uydurma-sinif");
    const pure = engine.decide({ budget, numstatZ: wireForNet(1), klass: "uydurma-sinif" });
    expect(JSON.stringify(result.report.decisionReport)).toBe(JSON.stringify(pure));
    expect(result.report.error).toEqual(pure.error);
    expect(result.report.fixture.bytes).toBe(Buffer.byteLength(wireForNet(1)));
  });

  it("her yolda stdout yalnız tam JSON'dur; stderr raporu bozmaz", () => {
    const invocations: string[][] = [
      [],
      ["--help"],
      argsFor(at("yok.z"), TIGHT),
      argsFor(wireFile(wireForNet(LOW.maxNet)), TIGHT),
      argsFor(wireFile(wireForNet(MID.maxNet)), WIDE),
      argsFor(wireFile(wireForNet(budget.splitRequiredAboveNet + 1)), WIDE, TOP.requires),
      argsFor(wireFile(""), TIGHT),
    ];
    for (const args of invocations) {
      const result = run(args);
      expect(result.stdout.trimEnd(), "stdout JSON dışında metin taşıyor").toBe(
        JSON.stringify(result.report),
      );
      expect(result.stderr.trim(), "insan satırı yok").not.toBe("");
      expect(result.stdout, "stderr raporu kirletti").not.toContain(result.stderr.trim());
      expect(result.status).toBe(result.report.exitCode);
    }
  });

  it("mutlak yol ve dizin adı hiçbir tanılamaya sızmaz", () => {
    const file = wireFile(wireForNet(1), "sizinti.z");
    for (const args of [argsFor(file, TIGHT), argsFor(file, "uydurma-sinif"), [`${file}`]]) {
      const result = run(args);
      expect(result.stdout, "mutlak fixture yolu rapora sızdı").not.toContain(TMP);
      expect(result.stdout).not.toContain(file);
    }
  });

  it("aynı girdi, cwd'den bağımsız olarak BAYT AYNI raporu üretir", () => {
    const file = wireFile(wireForNet(MID.maxNet), "kararli.z");
    const args = argsFor(file, WIDE, MID.requires);
    const first = run(args);
    expect(run(args).stdout, "aynı çağrı farklı bayt üretti").toBe(first.stdout);
    expect(run(args, { cwd: TMP }).stdout, "cwd raporu değiştirdi").toBe(first.stdout);
    // Göreli yol farklı yazılsa bile rapor aynıdır: yol rapora girmez, config cwd'den okunmaz.
    expect(run(argsFor("kararli.z", WIDE, MID.requires), { cwd: TMP }).stdout).toBe(first.stdout);
  });

  it("128KiB üstü rapor NON-BLOCKING boruda bile eksiksiz boşaltılır", async () => {
    // Süreç fd 1'i bloklayan bir boruya yazsaydı bu kanıt hiçbir şey göstermezdi: koşucu aynı
    // süreçte process.stdout'a dokunarak fd 1'i O_NONBLOCK yapar (libuv uv_pipe_open), sonra
    // CLI'ı doğrudan çağrılmış gibi çalıştırır. Okuyucu da bilerek duraklatılır ki boru DOLSUN.
    const runner = at("nonblocking-runner.mjs");
    fs.writeFileSync(
      runner,
      `void process.stdout;\nprocess.argv[1] = ${JSON.stringify(path.join(ROOT, CLI))};\nawait import(${JSON.stringify(href(CLI))});\n`,
    );
    const rows = Array.from({ length: 9000 }, (_v, i) => zRow("-", "-", `src/pkg/ikili-${i}.bin`));
    const args = argsFor(wireFile(rows.join(""), "buyuk-rapor.z"), TIGHT);
    const child = spawn(process.execPath, [runner, ...args], { stdio: ["ignore", "pipe", "pipe"] });
    child.stdout.setEncoding("utf8");
    let stdout = "";
    child.stdout.pause();
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    setTimeout(() => child.stdout.resume(), 120);
    const code = await new Promise<number | null>((resolve) => child.on("close", resolve));
    expect(stdout.length, "rapor eşiğin altında kaldı").toBeGreaterThan(128 * 1024);
    const report = JSON.parse(stdout);
    expect(report.status).toBe(DECISION.rejected);
    expect(code).toBe(EXIT[DECISION.rejected]);
  });
});

describe("pr-size süreç kapısı — izole laboratuvarda kanonik ve süreç hataları", () => {
  it("karar kanonik alanı İZLER: lab config kayarsa süreç kararı da kayar", () => {
    const step = 7;
    const shifted = lab((doc) => {
      const b = doc.changePackageBudget;
      for (const band of b.bands) band.maxNet += step;
      for (const entry of b.classes) entry.maxNet += step;
      b.splitRequiredAboveNet += step;
      return JSON.stringify(doc);
    });
    const file = wireFile(wireForNet(LOW.maxNet + step), "kayik.z");
    const inside = run(argsFor(file, TIGHT), { cli: shifted, cwd: TMP });
    expect(inside.report.decisionReport.band.id, "CLI'da ikinci eşik kopyası var").toBe(LOW.id);
    expect(inside.status).toBe(0);
    // Aynı tel gerçek kanonikle bir üst banda düşer: config'i cwd değil MODÜL konumu belirler.
    expect(run(argsFor(file, TIGHT)).report.decisionReport.band.id).toBe(MID.id);
  });

  it.each([
    [
      "sapmış kanonik",
      (doc: Any) => {
        doc.changePackageBudget.splitRequiredAboveNet += 1;
        return JSON.stringify(doc);
      },
      "canonical-drift",
    ],
    ["eksik kanonik", () => null, "canonical-unreadable"],
    ["bozuk JSON", () => "{ bozuk", "canonical-not-json"],
    [
      "bütçe alanı yok",
      (doc: Any) => {
        doc.changePackageBudget = undefined;
        return JSON.stringify(doc);
      },
      "canonical-budget-missing",
    ],
  ])("%s karar YERİNE config hatası verir", (_label, make, id) => {
    const entry = lab(make as (doc: Any) => string | null);
    failure(run(argsFor(wireFile(wireForNet(1)), TIGHT), { cli: entry }), id, KIND.config);
  });

  it("motor içinde fırlayan hata adlandırılmış makine raporuna dönüşür", () => {
    const entry = lab(
      (doc) => JSON.stringify(doc),
      `export * from ${JSON.stringify(href(ENGINE))};\nexport const decide = () => { throw new TypeError("patlama"); };\n`,
    );
    const result = run(argsFor(wireFile(wireForNet(1)), TIGHT), { cli: entry });
    expect(result.report.status).toBe(SURFACE.internal);
    expect(result.report.error.id).toBe("process-internal-error");
    expect(result.report.error.detail).toContain("TypeError");
    expect(result.report.decisionReport, "hata karar gibi raporlandı").toBeNull();
    expect(result.status).toBe(EXIT[SURFACE.internal]);
  });

  it("sinyal de aynı adlandırılmış raporu üretir ve karar iddia etmez", () => {
    const source = read(CLI);
    for (const signal of ["SIGHUP", "SIGINT", "SIGTERM"])
      expect(source, `sinyal kapanı yok: ${signal}`).toContain(signal);
    const report = probe('cli.internalEnvelope("SIGTERM")');
    expect(report.status).toBe(SURFACE.internal);
    expect(report.exitCode).toBe(EXIT[SURFACE.internal]);
    expect(report.error.detail).toContain("SIGTERM");
    expect([report.decisionReport, report.fixture]).toEqual([null, null]);
  });
});

describe("pr-size süreç kapısı — gerçek Git aralığı izole bir depoda toplanır", () => {
  const repo = divergentRepo();
  const accepted = run(rangeArgs("main", "feature", TIGHT), { cli: repo.cli });

  it("iraksayan tarihte merge-base'li aralık ölçülür, tabanın kendi işi sayılmaz", () => {
    expect(accepted.report.status, JSON.stringify(accepted.report.error)).toBe(DECISION.accepted);
    expect(accepted.status).toBe(0);
    const m = accepted.report.decisionReport.measurement;
    expect([m.grossAdditions, m.grossDeletions, m.governedFiles]).toEqual([RANGE_NET, 0, 1]);
    // İki-nokta farkı taban dalının işini de sayardı; merge-base'li aralık onu HİÇ görmez.
    expect(accepted.stdout, "taban dalının işi ölçüme girdi").not.toContain("baska.ts");
  });

  it("aralık provenansı YALNIZ toplayıcının çözdüğü commit'lerdir; ref ve yol sızmaz", () => {
    expect(accepted.report.inputMode).toBe(SURFACE.rangeMode);
    expect([accepted.report.collectsGitRange, accepted.report.ciEnforced]).toEqual([true, false]);
    expect(accepted.report.fixture, "aralık yolunda fixture provenansı uyduruldu").toBeNull();
    expect(Object.keys(accepted.report.range)).toEqual([
      "base",
      "head",
      "mergeBase",
      "bytes",
      "sha256",
    ]);
    const { base, head, mergeBase, bytes, sha256 } = accepted.report.range;
    expect([base, head, mergeBase]).toEqual([repo.base, repo.head, repo.forkPoint]);
    expect(sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(bytes).toBeGreaterThan(0);
    for (const secret of [repo.root, "feature", "refs/heads"])
      expect(accepted.stdout, `çağıranın metni rapora sızdı: ${secret}`).not.toContain(secret);
  });

  it("aynı commit'ler farklı cwd ve takma adlarla BAYT AYNI raporu üretir", () => {
    const aliases = [
      rangeArgs("main", "feature", TIGHT),
      rangeArgs(repo.base, repo.head, TIGHT),
      rangeArgs("refs/heads/main", "refs/heads/feature", TIGHT),
    ];
    for (const cwd of [ROOT, TMP, repo.root])
      for (const args of aliases)
        expect(run(args, { cli: repo.cli, cwd }).stdout, `cwd=${cwd}`).toBe(accepted.stdout);
  }, 60_000);

  it.each([
    ["çözülemeyen head", ["main", "yok-boyle-ref"], "range-head-ref-unresolved"],
    ["bayrak görünümlü base", ["-x", "feature"], "range-base-ref-leading-dash"],
  ])("%s adlandırılmış girdi hatasıdır ve hiçbir şey sızdırmaz", (_label, [base, head], id) => {
    const result = run(rangeArgs(base, head, TIGHT), { cli: repo.cli });
    failure(result, id, KIND.input);
    expect([result.report.collectsGitRange, result.report.range]).toEqual([false, null]);
    for (const secret of [repo.root, "yok-boyle-ref"])
      expect(result.stdout, `sızıntı: ${secret}`).not.toContain(secret);
  });

  it.each([
    [
      "sığ depo",
      (root: string) => {
        fs.writeFileSync(path.join(root, ".git/shallow"), `${git(root, ["rev-parse", "HEAD"])}\n`);
        return ["HEAD~1", "HEAD"];
      },
      "range-repo-shallow",
    ],
    [
      // Çok anlamlı ad SIFIR çıkışla bir uyarı üretir: toplayıcı sessizce ölçmek yerine ref'i
      // ÇÖZÜLEMEMİŞ sayar, yani yanlış commit hiçbir zaman karara dönüşmez.
      "çok anlamlı ref",
      (root: string) => {
        git(root, ["branch", "amb"]);
        git(root, ["tag", "amb"]);
        return ["HEAD~1", "amb"];
      },
      "range-head-ref-unresolved",
    ],
    [
      "ortak atası olmayan aralık",
      (root: string) => {
        git(root, ["checkout", "-q", "--orphan", "yalniz"]);
        commit(root, "src/pkg/yalniz.ts", body(1), "yalniz kok");
        return ["main", "yalniz"];
      },
      "range-merge-base-unresolved",
    ],
  ])("%s ölçülmez: karar YERİNE adlandırılmış hata gelir", (_label, prepare, id) => {
    const root = repoAt("fail");
    commit(root, "README.md", "kok\n", "kok");
    commit(root, GOVERNED, body(RANGE_NET), "dal");
    const [base, head] = prepare(root);
    const result = run(rangeArgs(base, head, TIGHT), { cli: install(root) });
    failure(result, id, KIND.input);
    expect([result.report.collectsGitRange, result.report.range]).toEqual([false, null]);
    expect(result.stdout, "depo yolu sızdı").not.toContain(root);
  });

  it("fixture yolu aralık kablolamasından etkilenmez: aynı çağrı aynı raporu verir", () => {
    const args = argsFor(wireFile(wireForNet(LOW.maxNet), "uyum.z"), TIGHT);
    const inside = run(args, { cli: repo.cli, cwd: repo.root });
    expect(inside.report.inputMode).toBe(SURFACE.inputMode);
    expect([inside.report.collectsGitRange, inside.report.range]).toEqual([false, null]);
    expect(Object.keys(inside.report.fixture)).toEqual(["bytes", "sha256"]);
    expect(inside.stdout, "fixture yolu aralık kablolamasıyla kaydı").toBe(run(args).stdout);
  });
});

/**
 * KİRLİ çalışma ağacı laboratuvarı (B11). Aralık yolunun aksine burada İZLENMEYEN dosya da ölçüme
 * girer; bu yüzden kapının kendi kopyası önce commit EDİLMİŞ bir `.gitignore` ile kapsam dışında
 * bırakılır ve ölçülen tek şey commit edilmemiş gerçek değişiklik olur.
 */
const dirtyRepo = () => {
  const root = repoAt("agac");
  commit(root, ".gitignore", "/tools/\n/src/data/\n", "kapi kopyasi olcume girmez");
  const head = commit(root, "README.md", "kok\n", "kok");
  fs.mkdirSync(path.join(root, path.dirname(GOVERNED)), { recursive: true });
  fs.writeFileSync(path.join(root, GOVERNED), body(RANGE_NET));
  return { root, head, cli: install(root) };
};
const treeArgs = (value: string, klass: string) => [`--working-tree=${value}`, `--class=${klass}`];

describe("pr-size süreç kapısı — çalışma ağacı ÜÇÜNCÜ kaynaktır ve toplayıcıya bağlıdır", () => {
  const repo = dirtyRepo();

  it("commit edilmemiş değişiklik ölçülür; provenans yalnız toplayıcının çözdüğü HEAD'dir", () => {
    const result = run(treeArgs("true", TIGHT), { cli: repo.cli });
    expect(result.report.status, JSON.stringify(result.report.error)).toBe(DECISION.accepted);
    expect(result.report.inputMode, "çalışma ağacı kaynağı çözülmedi").toBe(TREE);
    expect([result.report.collectsWorkingTree, result.report.ciEnforced]).toEqual([true, false]);
    // Tek kaynak DÜRÜSTLÜĞÜ: bu yolda fixture ve aralık provenansı UYDURULAMAZ.
    expect([result.report.fixture, result.report.range]).toEqual([null, null]);
    // Provenans yol DEĞİL: toplayıcının çözdüğü commit + bayt sayısı + özet, başka hiçbir şey.
    expect(Object.keys(result.report.workingTree ?? {})).toEqual(["head", "bytes", "sha256"]);
    expect(result.report.workingTree.head).toBe(repo.head);
    expect(result.report.workingTree.sha256).toMatch(/^[0-9a-f]{64}$/);
    const m = result.report.decisionReport.measurement;
    expect([m.grossAdditions, m.grossDeletions, m.governedFiles]).toEqual([RANGE_NET, 0, 1]);
    expect(result.stdout, "depo yolu rapora sızdı").not.toContain(repo.root);
  });

  it.each([
    ["fixture", () => [`--numstat-z-input=${wireFile(wireForNet(1), "agac-uyum.z")}`]],
    ["aralık", () => ["--base=main", "--head=main"]],
  ])("çalışma ağacı %s ile BİRLİKTE verilemez", (_label, extra) => {
    failure(
      run([...treeArgs("true", TIGHT), ...extra()], { cli: repo.cli }),
      "source-mixed",
      KIND.caller,
    );
  });

  it("kabul edilmiş toplayıcıya devredilir: kök MODÜLDEN, süre SONLU-POZİTİF ve ÖZELdir", () => {
    const seen = at(`cagri-${nextId()}.json`);
    // Casus toplayıcı: aldığı seçenekleri yan kanala yazar ve zarfa GEÇMEMESİ gereken bir EK alan
    // döndürür. Yıldız ihracı gerçek modülün `SOURCE`'unu korur; yerel ihraç onu gölgelemez.
    const entry = lab(
      (doc) => JSON.stringify(doc),
      undefined,
      `import fs from "node:fs";
export * from ${JSON.stringify(href(TREE_COLLECTOR))};
export const collectWorkingTree = (options) => {
  fs.writeFileSync(${JSON.stringify(seen)}, JSON.stringify(options));
  return { ok: true, numstatZ: ${JSON.stringify(zRow(1, 0, GOVERNED))},
    metadata: { source: ${JSON.stringify(TREE)}, head: "a".repeat(40), byteLength: 12,
      sha256: "b".repeat(64), extraLeak: "SIZINTI-ALANI" } };
};
`,
    );
    const result = run(treeArgs("true", TIGHT), { cli: entry, cwd: TMP });
    expect(result.report.status, JSON.stringify(result.report.error)).toBe(DECISION.accepted);
    const call = JSON.parse(fs.readFileSync(seen, "utf8"));
    // Kök ÇAĞIRANIN cwd'si değil, kapının KENDİ modül konumudur. Karşılaştırma GERÇEK yoldadır:
    // macOS'ta `/var` → `/private/var` bağı düz metin eşitliğini sessizce yanıltırdı.
    expect(path.join(call.repoRoot, CLI)).toBe(fs.realpathSync(entry));
    expect(call.repoRoot, "kök cwd'den çözüldü").not.toBe(fs.realpathSync(TMP));
    const deadline = call.totalTimeoutMs;
    expect(Number.isFinite(deadline) && deadline > 0, "sonlu-pozitif süre bütçesi verilmedi").toBe(
      true,
    );
    // Süre bir KAYNAK frenidir, ölçüm gerçeği değil: ne rapora ne de dışa açılan yüzeye girer.
    expect(result.stdout, "süre bütçesi rapora sızdı").not.toContain(String(deadline));
    const exported = probe("Object.values(cli).filter((v) => typeof v === 'number')") as number[];
    expect(exported, "süre bütçesi ihraç edildi").not.toContain(deadline);
    // Toplayıcının EK alanları zarfa geçmez: provenans en aza indirgenir.
    expect(Object.keys(result.report.workingTree)).toEqual(["head", "bytes", "sha256"]);
    expect(result.stdout, "toplayıcı ek alanı sızdı").not.toContain("SIZINTI-ALANI");
  });

  it("toplanamayan ağaç KARAR YERİNE adlandırılmış hata verir; provenans uydurulmaz", () => {
    // Laboratuvar bir depo DEĞİLdir: toplayıcı ölçmek yerine kendi adıyla durur.
    const entry = lab((doc) => JSON.stringify(doc));
    const result = run(treeArgs("true", TIGHT), { cli: entry });
    failure(result, `${TREE}-repo-not-found`, KIND.input);
    expect([result.report.collectsWorkingTree, result.report.workingTree]).toEqual([false, null]);
    expect(result.stdout, "laboratuvar yolu sızdı").not.toContain(TMP);
  });

  it("ad alanlı toplayıcı hatası ÇİFT öneklenmez; kimlik birebir korunur", () => {
    // Süre bütçesi kimlikleri ZATEN bu ad alanında doğar; kör önek onları tanınmaz hale getirirdi.
    const named = `${TREE}-deadline-exceeded`;
    const entry = lab(
      (doc) => JSON.stringify(doc),
      undefined,
      `export * from ${JSON.stringify(href(TREE_COLLECTOR))};
export const collectWorkingTree = () => ({ ok: false,
  error: { id: ${JSON.stringify(named)}, detail: "toplam süre bütçesi tükendi" } });
`,
    );
    const result = run(treeArgs("true", TIGHT), { cli: entry });
    failure(result, named, KIND.input);
    expect(result.stdout, "kimlik çift öneklendi").not.toContain(`${TREE}-${named}`);
  });

  it("yalnız `true` kabul edilir; geçersiz değer YANKILANMADAN fail-closed durur", () => {
    const sneaky = "evet;/etc/passwd";
    const result = run(treeArgs(sneaky, TIGHT), { cli: repo.cli });
    failure(result, "working-tree-value-invalid", KIND.caller);
    expect(result.stdout, "geçersiz değer tanılamaya yankılandı").not.toContain(sneaky);
    expect([result.report.collectsWorkingTree, result.report.workingTree ?? null]).toEqual([
      false,
      null,
    ]);
  });
});

describe("pr-size süreç kapısı — yapısal sınırlar ve dürüst kapı beyanı", () => {
  const source = read(CLI);

  it("CLI kabuk/alt süreç çalıştırmaz, iki kaynağı da yalnız kabul edilmiş toplayıcıya sorar", () => {
    for (const forbidden of [
      /child_process/,
      /\bspawn/,
      /\bexec(File|Sync)?\(/,
      /process\.stdin/,
      /["']git["']/,
      /readFileSync\(0\b/,
      // İKİNCİ bir git argv'si de yasaktır: toplama sözleşmesi yalnız toplayıcılarındır.
      /["']rev-parse["']/,
      /["']ls-files["']/,
      /["']--numstat["']/,
    ])
      expect(source, `CLI yasak yüzeyi kullandı: ${forbidden}`).not.toMatch(forbidden);
    const imports = [...source.matchAll(/^import .*from "(.+)";$/gm)].map((m) => m[1]);
    expect(imports.sort()).toEqual(
      [
        "../lib/pr-size-core.mjs",
        "../lib/pr-size-decision.mjs",
        COLLECTOR.replace("tools/lib/", "../lib/"),
        TREE_COLLECTOR.replace("tools/lib/", "../lib/"),
        "node:crypto",
        "node:fs",
        "node:url",
      ].sort(),
    );
  });

  it("CLI ve bu test ikinci eşik/bant/sınıf/kanıt kopyası taşımaz", () => {
    const numbers = new Set<number>([
      ...BANDS.map((b) => b.maxNet),
      ...CLASSES.map((c) => c.maxNet),
      budget.splitRequiredAboveNet,
      budget.maxChangedFiles,
    ]);
    const names = [
      ...BANDS.map((b) => b.id),
      ...CLASSES.map((c) => c.id),
      ...BANDS.flatMap((b) => b.requires),
      ...CHURN.requires,
    ];
    for (const file of [CLI, SELF]) {
      const text = read(file);
      for (const value of numbers)
        expect(text, `${file}: eşik kopyası ${value}`).not.toMatch(new RegExp(`\\b${value}\\b`));
      for (const name of names)
        expect(text, `${file}: kimlik kopyası ${name}`).not.toMatch(new RegExp(`\\b${name}\\b`));
    }
  });

  it("kanonik kapı beyanı dürüsttür: kapı PR olayında CI'a BAĞLIdır", () => {
    expect(budget.checker.path).toBe(CLI);
    // Kapı artık gerçek aralığı topluyor (bu dosyadaki gerçek depo kanıtı); not aksini diyemez.
    expect(budget.checker.note, "not gerçek aralığı yok sayıyor").not.toMatch(
      /aralı[kğ]ı?[^.]*toplan?ma[zy]/i,
    );
    expect(budget.checker.status).toBe("ci-enforced-blocking");
    expect(budget.checker.blocks, "bağlı kapı bloklamayı reddediyor").toBe(true);
    expect(fs.existsSync(path.join(ROOT, budget.checker.path))).toBe(true);
    // İddia YANLIŞLANABİLİR: "bağlı" demek, olayı kapıya çeviren GERÇEK bir adaptörün gerçek bir
    // CI adımından çağrılması demek. Kapının kendisi hâlâ doğrudan bir CI adımı DEĞİLdir.
    expect(fs.existsSync(path.join(ROOT, ADAPTER)), "CI olay adaptörü yok").toBe(true);
    const workflow = read(".github/workflows/deploy.yml");
    expect(workflow, "kapı hiçbir CI adımına bağlı değil").toContain(ADAPTER);
    expect(workflow.split(ADAPTER).join(""), "ham kapı doğrudan CI adımı oldu").not.toContain(CLI);
  });
});
