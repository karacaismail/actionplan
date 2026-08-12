import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, describe, expect, it } from "vitest";

// P3a: GitHub `pull_request` OLAYINI kabul edilmiş CLI'ın argv'sine çeviren DAR adaptör. Burada
// kanıtlanan tek şey ÇEVİRİNİN güvenli ve deterministik olduğudur: olay dosyası GÜVENİLMEZ yapısal
// veridir, yalnız iki namespace'li etiket argv'yi etkiler, başlık/gövde HİÇ okunmaz, hiçbir komut
// METNİ kurulmaz ve bozuk her girdi sızıntısız kapanır. Ölçüm, eşik, sınıf/kanıt sözlüğü ve karar
// burada YOKTUR; hepsi kabul edilmiş CLI/motorundadır. KAPSAM DÜRÜST: P3b bu adaptörü ZORUNLU
// `build` işine bağladı; çeviri sözleşmesi BAYT AYNI kaldı, değişen tek şey kurulum gerçeğidir.
const ROOT = process.cwd();
const ADAPTER = "tools/agents/check-pr-size-ci.mjs";
const CLI = "tools/agents/check-pr-size.mjs";
const CORE = "tools/lib/pr-size-core.mjs";
const ENGINE = "tools/lib/pr-size-decision.mjs";
const RANGE = "tools/lib/pr-size-git-range.mjs";
const TREE = "tools/lib/pr-size-git-working-tree.mjs";
const CANONICAL = "src/data/standards/short-code.json";
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const href = (relative: string) => pathToFileURL(path.join(ROOT, relative)).href;

// biome-ignore lint/suspicious/noExplicitAny: kanonik JSON ve makine raporu burada ham okunur.
type Any = any;
const canonical = JSON.parse(read(CANONICAL)) as Any;
const budget = canonical.changePackageBudget as Any;
const BANDS = budget.bands as Array<{ id: string; maxNet: number; requires: string[] }>;
const CLASSES = budget.classes as Array<{ id: string; maxNet: number; ceilingKind: string }>;
const [LOW, MID, TOP] = BANDS;
// Sınıflar KİMLİKLE değil, kanonik rolleriyle seçilir: adaptör sözlüğünün ikinci kopyası yoktur.
const FALLBACK = (CLASSES.find((c) => c.ceilingKind === "default") as { id: string }).id;
const WIDE = (CLASSES.find((c) => c.id !== FALLBACK) as { id: string }).id;
const CHURN = budget.churnGuard as { requires: string[] };

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "pr-size-ci-"));
afterAll(() => fs.rmSync(TMP, { recursive: true, force: true }));
const at = (name: string) => path.join(TMP, name);
let seq = 0;
const nextId = () => {
  seq += 1;
  return seq;
};

/** Adaptör bir kabuk girişidir (hashbang taşır): yüzeyi GERÇEK Node'da okunur. */
const probe = (expression: string, module = ADAPTER): Any => {
  const script = at(`probe-${nextId()}.mjs`);
  const source = `import * as m from ${JSON.stringify(href(module))};`;
  fs.writeFileSync(script, `${source}\nprocess.stdout.write(JSON.stringify(${expression}));\n`);
  const result = spawnSync(process.execPath, [script], { encoding: "utf8" });
  if (!result.stdout) throw new Error(`yüzey okunamadı: ${result.stderr}`);
  return JSON.parse(result.stdout);
};
const SURFACE = probe(
  `{ envName: m.EVENT_PATH_ENV, maxBytes: m.MAX_EVENT_BYTES, klassNs: m.CLASS_NAMESPACE,
     evidenceNs: m.EVIDENCE_NAMESPACE, fallback: m.DEFAULT_CLASS, fault: m.FAULT,
     redacted: m.REDACTED_DETAIL, keys: Object.keys(m) }`,
);
const EXIT = probe("m.EXIT_CODE", CLI) as Record<string, number>;
const DECISION = probe("m.DECISION", ENGINE) as Record<string, string>;
const KIND = probe("m.ERROR_KIND", ENGINE) as Record<string, string>;
const INTERNAL = probe("m.INTERNAL", CLI) as string;
const FAULT = SURFACE.fault as Record<string, string>;

const BASE_SHA = "a".repeat(40);
const HEAD_SHA = "b".repeat(40);
const label = (name: string) => ({ name });
const klassLabel = (id: string) => `${SURFACE.klassNs}${id}`;
const evidenceLabel = (id: string) => `${SURFACE.evidenceNs}${id}`;
/** GitHub olayının gerçek şekli; başlık ve gövde bilerek DÜŞMANCADIR. */
const HOSTILE = '"; rm -rf / #$(touch /tmp/pwned)`whoami` ${{ github.event.pull_request.body }}';
const event = (names: string[] = [], patch: Any = {}) => ({
  action: "synchronize",
  number: 7,
  pull_request: {
    title: HOSTILE,
    body: HOSTILE,
    base: { sha: BASE_SHA, ref: "main" },
    head: { sha: HEAD_SHA, ref: "feature" },
    labels: names.map(label),
    ...patch,
  },
});

/** SAF çeviri: argv yalnız bellekte bir DİZİdir; hiçbir komut metni kurulmaz. */
const derive = (value: Any): Any => probe(`m.deriveArgv(${JSON.stringify(value)})`);
const argvOf = (names: string[] = [], patch: Any = {}) => {
  const derived = derive(event(names, patch));
  expect(derived.ok, JSON.stringify(derived)).toBe(true);
  return derived.argv as string[];
};
const argvFor = (base: string, head: string, klass: string, ids: string[] = []) => [
  `--base=${base}`,
  `--head=${head}`,
  `--class=${klass}`,
  ...(ids.length ? [`--evidence=${ids.join(",")}`] : []),
];

const writeEvent = (value: Any, name = `event-${nextId()}.json`) => {
  const file = at(name);
  fs.writeFileSync(file, typeof value === "string" ? value : JSON.stringify(value));
  return file;
};
type Run = { status: number | null; stdout: string; stderr: string; report: Any };
const run = (options: { file?: string; cli?: string; cwd?: string } = {}): Run => {
  const entry = options.cli ?? path.join(ROOT, ADAPTER);
  // Ortam AÇIKÇA kurulur: koşucunun kendi `GITHUB_EVENT_PATH` değeri kanıta sızmamalıdır.
  const { GITHUB_EVENT_PATH: _inherited, ...clean } = process.env as Record<string, string>;
  const env: Record<string, string> = { ...clean };
  if (options.file !== undefined) env[SURFACE.envName] = options.file;
  const result = spawnSync(process.execPath, [entry], {
    cwd: options.cwd ?? ROOT,
    encoding: "utf8",
    env,
    input: "stdin gurultusu",
  });
  let report: Any = null;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    throw new Error(`stdout tam JSON değil (${result.status}): ${result.stdout.slice(0, 300)}`);
  }
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, report };
};
/** Adaptör hatası TEK ve KARARLI bir kimlikle kapanır; hiçbir değer yankılanmaz. */
const closed = (result: Run, fault: string) => {
  expect(result.report.status).toBe(INTERNAL);
  expect(result.report.error.detail, JSON.stringify(result.report.error)).toContain(fault);
  expect(result.report.decisionReport, "hata karar gibi raporlandı").toBeNull();
  expect(result.status).toBe(EXIT[INTERNAL]);
  expect(result.status, "hata sıfırla kapandı").not.toBe(0);
};
const noLeak = (result: Run, secrets: string[]) => {
  for (const secret of secrets) {
    expect(result.stdout, `stdout sızıntısı: ${secret}`).not.toContain(secret);
    expect(result.stderr, `stderr sızıntısı: ${secret}`).not.toContain(secret);
  }
};

/** GERÇEK depo laboratuvarı: aralık uydurma bir yürütücüyle değil gerçek `git` ile ölçülür. */
const git = (cwd: string, args: string[]) => {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args[0]} başarısız: ${result.stderr}`);
  return result.stdout.trim();
};
const install = (root: string) => {
  for (const dir of ["tools/agents", "tools/lib", "src/data/standards"])
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  for (const file of [ADAPTER, CLI, CORE, ENGINE, RANGE, TREE, CANONICAL])
    fs.copyFileSync(path.join(ROOT, file), path.join(root, file));
  return path.join(root, ADAPTER);
};
const GOVERNED = "src/pkg/change.ts";
const body = (count: number) =>
  `${Array.from({ length: count }, (_v, i) => `satir ${i}`).join("\n")}\n`;
const commit = (root: string, file: string, text: string, message: string) => {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), text);
  git(root, ["add", "--", file]);
  git(root, ["commit", "-q", "-m", message]);
  return git(root, ["rev-parse", "HEAD"]);
};
const repoWithNet = (net: number) => {
  const root = at(`repo-${nextId()}`);
  fs.mkdirSync(root, { recursive: true });
  git(root, ["init", "-q", "-b", "main"]);
  git(root, ["config", "user.email", "pr-size@example.test"]);
  git(root, ["config", "user.name", "pr-size"]);
  commit(root, "README.md", "kok\n", "kok");
  const base = commit(root, "src/pkg/taban.ts", body(1), "taban");
  const head = commit(root, GOVERNED, body(net), "dal");
  return { root, base, head, cli: install(root) };
};
/** Ölçülen net; eşik kopyası değil, bandın altında kalan küçük bir sayıdır. */
const SMALL_NET = 3;

describe("pr-size CI adaptörü — argv SAF ve deterministik biçimde türetilir", () => {
  it("etiketsiz PR varsayılan sınıfa düşer ve argv yalnız değişmez SHA'ları taşır", () => {
    expect(argvOf()).toEqual(argvFor(BASE_SHA, HEAD_SHA, SURFACE.fallback));
    // Varsayılan KANONİK rolle aynıdır: adaptör ikinci bir sınıf sözlüğü kurmaz.
    expect(SURFACE.fallback).toBe(FALLBACK);
    // Ref adı ve checkout cwd'si argv'ye HİÇ girmez: ölçüm değişmez commit'lerdedir.
    for (const forbidden of ["main", "feature", ROOT])
      expect(argvOf().join(" "), `ref/cwd argv'ye sızdı: ${forbidden}`).not.toContain(forbidden);
  });

  it("tek sınıf etiketi argv'yi belirler; ilgisiz etiketler ve sıra sonucu değiştirmez", () => {
    expect(argvOf([klassLabel(WIDE)])).toEqual(argvFor(BASE_SHA, HEAD_SHA, WIDE));
    const noise = ["bug", "pr-size", "pr-size:class", "pr-size:classx:y", "pr-size:evidenceX:z"];
    expect(argvOf(noise)).toEqual(argvFor(BASE_SHA, HEAD_SHA, SURFACE.fallback));
    const mixed = [...noise, klassLabel(WIDE)];
    expect(argvOf(mixed)).toEqual(argvOf([...mixed].reverse()));
  });

  it("kanıt son ekleri SIRALANIR: aynı küme her sırada BAYT AYNI argv verir", () => {
    // Kimlikler KANONİKTEN gelir; ne adaptör ne bu test ikinci bir kanıt sözlüğü yazar.
    const ids = [...MID.requires, ...TOP.requires, ...CHURN.requires];
    const shuffled = [...ids].reverse();
    const expected = argvFor(BASE_SHA, HEAD_SHA, WIDE, [...ids].sort());
    expect(argvOf([klassLabel(WIDE), ...ids.map(evidenceLabel)])).toEqual(expected);
    expect(argvOf([...shuffled.map(evidenceLabel), klassLabel(WIDE)])).toEqual(expected);
    // Kanıt yoksa bayrak HİÇ kurulmaz: boş liste sessizce uydurulmaz.
    expect(argvOf([klassLabel(WIDE)]).some((a) => a.startsWith("--evidence"))).toBe(false);
  });

  it("başlık ve gövde HİÇ okunmaz: düşmanca metin argv'yi değiştiremez", () => {
    const clean = { title: "temiz", body: null };
    expect(argvOf([klassLabel(WIDE)], clean)).toEqual(argvOf([klassLabel(WIDE)]));
    expect(argvOf().join(" "), "PR metni argv'ye girdi").not.toContain("rm -rf");
    // `${{ ... }}` şablonu hiçbir yolda genişletilmez: metin argv'ye HİÇ ulaşmaz.
    expect(argvOf().join(" ")).not.toContain("github.event");
  });

  it.each([
    ["birden çok sınıf etiketi", [klassLabel(WIDE), klassLabel(FALLBACK)], {}, "classConflict"],
    ["aynı sınıf etiketi iki kez", [klassLabel(WIDE), klassLabel(WIDE)], {}, "classConflict"],
    ["ayırıcı taşıyan kanıt", [evidenceLabel(`${MID.requires[0]},x`)], {}, "evidenceSeparator"],
    ["pull_request yok", [], { drop: true }, "shapeInvalid"],
    ["base sha kısa", [], { base: { sha: "abc" } }, "baseShaInvalid"],
    ["base sha büyük harf", [], { base: { sha: "A".repeat(40) } }, "baseShaInvalid"],
    ["base sha yok", [], { base: {} }, "baseShaInvalid"],
    ["head sha ref adı", [], { head: { sha: "refs/heads/main" } }, "headShaInvalid"],
    ["head sha sayı", [], { head: { sha: 1 } }, "headShaInvalid"],
    ["etiketler dizi değil", [], { labels: { name: "x" } }, "labelsInvalid"],
    ["etiket nesne değil", [], { labels: ["pr-size"] }, "labelsInvalid"],
    ["etiket adı string değil", [], { labels: [{ name: 7 }] }, "labelsInvalid"],
    ["etiket adı yok", [], { labels: [{}] }, "labelsInvalid"],
    ["etiketler yok", [], { labels: undefined }, "labelsInvalid"],
  ])("%s FAIL-CLOSED reddedilir", (_l, names, patch: Any, fault) => {
    const value = patch.drop ? { action: "opened" } : event(names, patch);
    const derived = derive(value);
    expect(derived.ok, JSON.stringify(derived)).toBe(false);
    expect(derived.cause).toBe(FAULT[fault]);
    expect(JSON.stringify(derived), "argv üretildi").not.toContain("--base");
  });

  it.each([["dizi"], ["metin"], ["null"]])("üst düzey %s olay yapısı reddedilir", (shape) => {
    const value = shape === "dizi" ? [] : shape === "metin" ? "pull_request" : null;
    expect(derive(value)).toEqual({ ok: false, cause: FAULT.shapeInvalid });
  });
});

describe("pr-size CI adaptörü — gerçek süreç yalnız tek JSON ve mevcut çıkış kodunu verir", () => {
  const small = repoWithNet(SMALL_NET);
  const wide = repoWithNet(LOW.maxNet + 1);
  const eventFor = (repo: { base: string; head: string }, names: string[] = []) =>
    writeEvent({
      action: "opened",
      pull_request: {
        title: HOSTILE,
        body: HOSTILE,
        base: { sha: repo.base },
        head: { sha: repo.head },
        labels: names.map(label),
      },
    });

  it("kabul edilen paket: stdout TEK JSON, çıkış 0 ve kapı ZORUNLU işe bağlı", () => {
    const result = run({ file: eventFor(small), cli: small.cli });
    expect(result.report.status, JSON.stringify(result.report.error)).toBe(DECISION.accepted);
    expect(result.status).toBe(0);
    expect(result.report.decisionReport.measurement.grossAdditions).toBe(SMALL_NET);
    expect(result.report.inputMode, "aralık dışında bir kaynak seçildi").toBe("git-range");
    expect(result.report.range.base).toBe(small.base);
    expect(result.report.range.head).toBe(small.head);
    // stdout tam olarak bir JSON nesnesidir: ANSI, insan cümlesi ve ikinci nesne yoktur.
    expect(result.stdout).toBe(`${JSON.stringify(result.report)}\n`);
    expect(result.stdout, "stdout ANSI kaçışı taşıyor").not.toContain("\u001b");
    expect(result.stderr.trim(), "insan satırı stderr'de yok").not.toBe("");
    // `ciEnforced` KURULUM gerçeğidir ve CLI'dan MİRAS alınır: adaptör onu ayrıca hesaplamaz.
    expect(result.report.ciEnforced, "bağlı kapı enforcement'ı yok saydı").toBe(true);
    noLeak(result, [HOSTILE, "rm -rf", small.root, TMP]);
  });

  it("çıkış kodu MEVCUT kararı taşır: kabul, ret ve geçersiz sınıf ayrı kodlara düşer", () => {
    const bare = run({ file: eventFor(wide, [klassLabel(WIDE)]), cli: wide.cli });
    expect(bare.report.decisionReport.band.id).toBe(MID.id);
    expect(bare.report.decisionReport.blockers.map((b: Any) => b.id)).toContain("evidence-missing");
    expect([bare.status, bare.report.status]).toEqual([EXIT[DECISION.rejected], DECISION.rejected]);
    const names = [klassLabel(WIDE), ...MID.requires.map(evidenceLabel)];
    const proven = run({ file: eventFor(wide, names), cli: wide.cli });
    expect(proven.report.status, JSON.stringify(proven.report.error)).toBe(DECISION.accepted);
    expect(proven.status).toBe(0);
    // Bilinmeyen sınıf adaptörde değil MOTORDA reddedilir: ikinci sözlük yok, kod motorunkidir.
    const alien = run({ file: eventFor(small, [klassLabel("uydurma-sinif")]), cli: small.cli });
    expect(alien.report.error.id).toBe("class-unknown");
    expect(alien.status).toBe(EXIT[KIND.caller]);
  }, 60_000);

  it("düşmanca etiket KABUK çalıştıramaz; kimliği yine motor reddeder", () => {
    const marker = at(`pwned-${nextId()}`);
    const hostile = [
      klassLabel(`$(touch ${marker})`),
      klassLabel(`x; touch ${marker}`),
      evidenceLabel("`touch /tmp/pr-size-pwned`"),
    ];
    const result = run({ file: eventFor(small, hostile), cli: small.cli });
    expect(fs.existsSync(marker), "etiket kabukta çalıştı").toBe(false);
    expect(fs.existsSync("/tmp/pr-size-pwned"), "etiket kabukta çalıştı").toBe(false);
    // İki sınıf etiketi zaten adaptörde kapanır: değer hiç argv'ye ulaşmaz ve yankılanmaz.
    closed(result, FAULT.classConflict);
    noLeak(result, [marker, "touch"]);
  });

  // Sınıf/kanıt son eki PR'ı AÇANIN yazdığı metindir. Geçerliliğe yine MOTOR karar verir ve
  // reddederken kimliği kendi ayrıntısında YANKILAR; o ayrıntı adaptörün stdout'una girerse
  // düşmanca/sır benzeri etiket içeriği CI kaydına düşer. Adaptör kimliği, sınıfı ve çıkış kodunu
  // KORUYARAK yalnız iki ayrıntı yüzeyini kapalı bir sabitle örter.
  const CANARY = "SECRET_CANARY_9f7a";
  const twice = [klassLabel(WIDE), ...[CANARY, CANARY].map(evidenceLabel)];
  it.each([
    ["bilinmeyen sınıf", [klassLabel(CANARY)], "class-unknown"],
    ["bilinmeyen kanıt", [klassLabel(WIDE), evidenceLabel(CANARY)], "evidence-unknown"],
    ["tekrarlı kanıt", twice, "evidence-duplicate"],
  ])("%s: etiket içeriği hiçbir akışa sızmaz, kimlik ve çıkış kodu korunur", (_l, names, id) => {
    const result = run({ file: eventFor(small, names), cli: small.cli });
    noLeak(result, [CANARY]);
    // Örtme bir çağıran hatasını iç hataya ÇEVİRMEZ ve ikinci bir karar/zarf uydurmaz.
    expect(result.report.error.id).toBe(id);
    expect([result.report.error.kind, result.report.status]).toEqual([KIND.caller, KIND.caller]);
    expect(result.status).toBe(EXIT[KIND.caller]);
    expect(result.report.error.detail).toBe(SURFACE.redacted);
    expect(result.report.decisionReport.error.id).toBe(id);
    expect(result.report.decisionReport.error.detail).toBe(SURFACE.redacted);
    expect(result.stdout).toBe(`${JSON.stringify(result.report)}\n`);
  });

  it("örtme YALNIZ yayımlanan rapordadır: saf çeviri bilinmeyen son eki bellekte taşır", () => {
    // Adaptör geçerli kimlikleri ÖN DOĞRULAMAZ; ikinci bir sözlük kurmamanın bedeli budur.
    expect(argvOf([klassLabel(CANARY)])).toEqual(argvFor(BASE_SHA, HEAD_SHA, CANARY));
  });

  it("aynı olay tekrar tekrar BAYT AYNI raporu üretir ve olay dosyasına DOKUNMAZ", () => {
    const file = eventFor(small, [klassLabel(WIDE)]);
    const before = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
    const first = run({ file, cli: small.cli });
    for (const cwd of [ROOT, TMP, small.root])
      expect(run({ file, cli: small.cli, cwd }).stdout, `cwd=${cwd}`).toBe(first.stdout);
    const after = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
    expect(after, "adaptör olay dosyasını değiştirdi").toBe(before);
  }, 60_000);

  it.each([
    ["ortam yok", () => undefined, "envMissing"],
    ["boş ortam değeri", () => "", "envMissing"],
    ["olmayan dosya", () => at("yok-boyle.json"), "unreadable"],
    ["dizin", () => TMP, "notRegularFile"],
    ["aygıt", () => "/dev/null", "notRegularFile"],
    ["boş dosya", () => writeEvent(""), "empty"],
    ["bozuk JSON", () => writeEvent("{ bozuk"), "notJson"],
    ["JSON dizi", () => writeEvent("[]"), "shapeInvalid"],
    ["geçersiz SHA", () => writeEvent(event([], { head: { sha: "zz" } })), "headShaInvalid"],
    ["bozuk etiket", () => writeEvent(event([], { labels: [{ name: 1 }] })), "labelsInvalid"],
  ])("%s: karar YERİNE kararlı ve sızıntısız bir rapor gelir", (_label, make, fault) => {
    const file = make();
    const result = run(file === undefined ? {} : { file });
    closed(result, FAULT[fault]);
    noLeak(result, [TMP, HOSTILE, "bozuk", "zz", ...(file ? [file] : [])]);
  });

  it("sembolik bağ ve tavanı aşan olay dosyası OKUNMADAN kapanır; içerik sızmaz", () => {
    const link = at(`link-${nextId()}.json`);
    fs.symlinkSync(writeEvent(event()), link);
    closed(run({ file: link }), FAULT.notRegularFile);
    const secret = "GIZLI-OLAY-ICERIGI";
    const huge = at(`huge-${nextId()}.json`);
    fs.writeFileSync(huge, Buffer.alloc(SURFACE.maxBytes + 1, secret));
    const result = run({ file: huge });
    closed(result, FAULT.tooLarge);
    noLeak(result, [secret, huge]);
  });

  it("olay dosyası GEÇERSİZ UTF-8 taşıyorsa ölçüm yapılmaz", () => {
    const file = at(`utf8-${nextId()}.json`);
    fs.writeFileSync(file, Buffer.from([0x7b, 0xff, 0xfe, 0x7d]));
    closed(run({ file }), FAULT.notUtf8);
  });

  it("İÇE AKTARMA SAFTIR: ortam okunmaz, çıktı verilmez, sinyal kapanı kurulmaz", () => {
    const script = at(`purity-${nextId()}.mjs`);
    fs.writeFileSync(
      script,
      `import * as m from ${JSON.stringify(href(ADAPTER))};
const signals = ["SIGHUP", "SIGINT", "SIGTERM"].map((s) => process.listenerCount(s));
process.stdout.write(JSON.stringify({ signals, klass: typeof m.deriveArgv }));
`,
    );
    const result = spawnSync(process.execPath, [script], {
      encoding: "utf8",
      env: { ...process.env, [SURFACE.envName]: at("olmayan-olay.json") },
    });
    expect(result.stdout).toBe(JSON.stringify({ signals: [0, 0, 0], klass: "function" }));
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
  });
});

describe("pr-size CI adaptörü — yapısal sınırlar ve dürüst kapı beyanı", () => {
  const source = read(ADAPTER);

  it("adaptör kabuk, alt süreç, ağ, token ve git argv'si KURMAZ", () => {
    for (const forbidden of [
      /child_process/,
      /\bspawn/,
      /\bexec(File|Sync)?\(/,
      /\beval\(/,
      /new Function/,
      /process\.stdin/,
      /\bfetch\(/,
      /node:(http|https|net|dns|tls)/,
      /GITHUB_TOKEN|GH_TOKEN|api\.github\.com|octokit|\bgh\b/i,
      /\$\{\{/,
      /["']git["']/,
      /["'](diff|rev-parse|merge-base|--numstat|-z|HEAD)["']/,
    ])
      expect(source, `adaptör yasak yüzeyi kullandı: ${forbidden}`).not.toMatch(forbidden);
    const imports = [...source.matchAll(/^import .*from "(.+)";$/gm)].map((m) => m[1]);
    // Motordan YALNIZ hata SINIFI adı alınır: sızıntı freninin hangi ayrıntıyı örteceğini bilmek
    // için gereken tek şey budur ve içe aktarmak, kopyalamanın TERSİdir — eşik/sınıf/kanıt
    // sözlüğünün adaptörde ikinci bir kopyası yine yoktur.
    expect(imports.sort()).toEqual(
      [
        "./check-pr-size.mjs",
        "../lib/pr-size-core.mjs",
        "../lib/pr-size-decision.mjs",
        "node:fs",
        "node:url",
      ].sort(),
    );
  });

  it("adaptörde ikinci eşik/bant/kanıt sözlüğü yoktur; yalnız TEK varsayılan sınıf adlanır", () => {
    const numbers = [
      ...BANDS.map((b) => b.maxNet),
      ...CLASSES.map((c) => c.maxNet),
      budget.splitRequiredAboveNet,
      budget.maxChangedFiles,
    ];
    for (const value of numbers)
      expect(source, `eşik kopyası ${value}`).not.toMatch(new RegExp(`\\b${value}\\b`));
    const names = [
      ...BANDS.map((b) => b.id),
      ...CLASSES.map((c) => c.id),
      ...BANDS.flatMap((b) => b.requires),
      ...CHURN.requires,
    ].filter((id) => id !== FALLBACK);
    for (const name of names)
      expect(source, `kimlik kopyası ${name}`).not.toMatch(new RegExp(`\\b${name}\\b`));
    // Varsayılan sınıf TEK bir yerde adlanır; geçerliliği yine MOTOR karar verir.
    expect(source.match(new RegExp(`\\b${FALLBACK}\\b`, "g"))?.length).toBe(1);
    expect(SURFACE.keys.sort()).toEqual(
      [
        "CLASS_NAMESPACE",
        "DEFAULT_CLASS",
        "EVENT_PATH_ENV",
        "EVIDENCE_NAMESPACE",
        "FAULT",
        "MAX_EVENT_BYTES",
        "REDACTED_DETAIL",
        "deriveArgv",
        "runAdapter",
      ].sort(),
    );
  });

  it("script ZORUNLU işe BAĞLIdır ama YEREL toplu kapıya girmez", () => {
    const scripts = JSON.parse(read("package.json")).scripts as Record<string, string>;
    expect(scripts["qa:pr-size-ci"]).toBe(`node ${ADAPTER}`);
    // Yerel toplu kapıda bir pull_request olay dosyası YOKTUR: eklenirse her koşu fail-closed olurdu.
    expect(scripts["qa:ci"], "yerel toplu kapıda pull_request olayı yoktur").not.toContain(
      "qa:pr-size-ci",
    );
    // Workflow BAĞLAMASI artık VARDIR ve yalnız pull_request olayında koşar.
    const workflow = read(".github/workflows/deploy.yml");
    expect(workflow).toContain("run: npm run qa:pr-size-ci");
    expect(workflow).toContain("if: github.event_name == 'pull_request'");
  });

  it("kanonik beyan ve adaptör yorumu BAĞLI gerçeği söyler: eski 'bağlı değil' cümlesi kalmaz", () => {
    expect(budget.checker.path).toBe(CLI);
    expect(budget.checker.status).toBe("ci-enforced-blocking");
    expect(budget.checker.blocks, "bağlı kapı bloklamadığını söylüyor").toBe(true);
    expect(fs.existsSync(path.join(ROOT, ADAPTER))).toBe(true);
    // Yorum bir belgelemedir ama YANLIŞ belgeleme yanlış güven üretir: eski kapsam cümlesi gider.
    for (const stale of [/BAĞLI DEĞİL/i, /implemented-not-wired/, /hiçbir merge burada bloklanmaz/])
      expect(source, `adaptör yorumu eski 'bağlı değil' iddiasını taşıyor: ${stale}`).not.toMatch(
        stale,
      );
    expect(source, "adaptör yorumu zorunlu işi anmıyor").toMatch(/build/);
  });
});
