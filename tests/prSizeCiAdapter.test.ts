import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";

/**
 * B12 — pull_request OLAY ADAPTÖRÜ. Kabul edilmiş kapı burada DEĞİŞMEZ; eksik olan tek şey onu
 * GitHub `pull_request` olayına bağlayan İNCE, FAIL-CLOSED yüzeydir. Adaptör olayı
 * `GITHUB_EVENT_PATH`ten okur, DEĞİŞMEZ base/head SHA'larını alır, `pr-size:class:<id>` ve
 * `pr-size:evidence:<id>` etiketlerini okur, sınıf etiketi yoksa KANONİKTEN türeyen sınıfa düşer,
 * birden çok sınıf etiketini REDdeder ve kapıyı ÇAĞRIYA ÖZGÜ `ciEnforced=true` ile çalıştırır;
 * doğrudan/yerel çağrı `false` KALIR. Ad alanı önekleri ADAPTÖR SINIR SÖZDİZİMİdir; sınıf/bant/
 * eşik/kanıt KİMLİKLERİ yalnız kanonikten türer.
 *
 * B13 SINIRI: birleştirmeyi durduran şey bu adaptör değil, build job'unu zorunlu kılan GitHub
 * branch protection'dır ve o koruma B12 sırasında da yürürlükteydi. B13 onu kurmaz; kanonik
 * mergeProtection sözleşmesiyle makine tarafından karşılaştırılabilir kılar.
 */
const ROOT = process.cwd();
const CLI = "tools/agents/check-pr-size.mjs";
const ADAPTER = "tools/agents/check-pr-size-ci.mjs";
const SELF = "tests/prSizeCiAdapter.test.ts";
const WORKFLOW = ".github/workflows/deploy.yml";
const CANONICAL = "src/data/standards/short-code.json";
const LIBS = ["core", "decision", "git-range", "git-working-tree", "total-deadline"].map(
  (name) => `tools/lib/pr-size-${name}.mjs`,
);
/** Etiket ad alanı: adaptörün SINIR sözdizimi, politika kopyası değil. */
const CLASS_LABEL = "pr-size:class:";
const EVIDENCE_LABEL = "pr-size:evidence:";
const EVENT = "pull_request";

const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
// biome-ignore lint/suspicious/noExplicitAny: kanonik JSON ve makine raporu burada ham okunur.
type Any = any;
const budget = (JSON.parse(read(CANONICAL)) as Any).changePackageBudget as Any;
const BANDS = budget.bands as Array<{ id: string; maxNet: number; requires: string[] }>;
const CLASSES = budget.classes as Array<{ id: string; maxNet: number; ceilingKind: string }>;
/**
 * Sınıf KİMLİKLE seçilmez. Etiketsiz PR'ın düştüğü sınıf, tavanı MERDİVENİN İLK bandından türeyen
 * sınıftır; o bandın kimliği aynı zamanda `ceilingKind` sözlüğüdür. Kanonik kayarsa test de kayar.
 */
const IMPLICIT_KIND = BANDS[0].id;
const IMPLICIT_CLASS = (CLASSES.find((c) => c.ceilingKind === IMPLICIT_KIND) as Any).id as string;
const LABELLED_CLASS = (CLASSES.find((c) => c.id !== IMPLICIT_CLASS) as Any).id as string;
/** Kanıt kimlikleri de kanonikten türer; hangileri olduğu bu dosyanın bilgisi DEĞİLdir. */
const LABELLED_BAND = BANDS[1];
const EVIDENCE_IDS = LABELLED_BAND.requires;

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "pr-size-ci-"));
afterAll(() => fs.rmSync(TMP, { recursive: true, force: true }));
let seq = 0;
const at = (name: string) => {
  seq += 1;
  return path.join(TMP, `${seq}-${name}`);
};

const git = (cwd: string, args: string[]) => {
  const done = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (done.status !== 0) throw new Error(`git ${args[0]} başarısız: ${done.stderr}`);
  return done.stdout.trim();
};
const body = (n: number) => `${Array.from({ length: n }, (_v, i) => `satir ${i}`).join("\n")}\n`;
const commit = (root: string, file: string, lines: number, message: string) => {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), body(lines));
  git(root, ["add", "--", file]);
  git(root, ["commit", "-q", "-m", message]);
  return git(root, ["rev-parse", "HEAD"]);
};
/** Ölçülen net; eşik kopyası değil, her bandın altında kalan küçük bir sayıdır. */
const RANGE_NET = 3;
const GOVERNED = "src/pkg/change.ts";
/**
 * IRAKSAYAN tarih: merge-base'li aralık tabanın kendi işini saymaz. Kapı kökünü ÇAĞIRANIN
 * cwd'sinden değil KENDİ modül konumundan çözer; bu yüzden kapı ve adaptör ölçülecek deponun
 * içine aynı göreli düzende kurulur.
 */
const prRepo = (net = RANGE_NET) => {
  const root = at("repo");
  fs.mkdirSync(root, { recursive: true });
  git(root, ["init", "-q", "-b", "main"]);
  git(root, ["config", "user.email", "pr-size@example.test"]);
  git(root, ["config", "user.name", "pr-size"]);
  commit(root, "README.md", 1, "kok");
  const forkPoint = commit(root, "src/pkg/taban.ts", 1, "fork");
  git(root, ["checkout", "-q", "-b", "feature"]);
  const head = commit(root, GOVERNED, net, "dal ilerledi");
  git(root, ["checkout", "-q", "main"]);
  const base = commit(root, "src/pkg/baska.ts", RANGE_NET + 2, "taban ilerledi");
  for (const dir of ["tools/agents", "tools/lib", "src/data/standards"])
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  for (const file of [CLI, ADAPTER, ...LIBS, CANONICAL])
    if (fs.existsSync(path.join(ROOT, file)))
      fs.copyFileSync(path.join(ROOT, file), path.join(root, file));
  return { root, forkPoint, base, head };
};

type Repo = ReturnType<typeof prRepo>;
type Run = { status: number | null; stdout: string; stderr: string; report: Any };
/** Ortam TEMİZdir: gerçek koşucunun GITHUB_* değişkenleri teste sızarsa kanıt anlamsız olurdu. */
const BASE_ENV = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !key.startsWith("GITHUB_")),
) as NodeJS.ProcessEnv;
const spawnAt = (entry: string, args: string[], env: NodeJS.ProcessEnv): Run => {
  const done = spawnSync(process.execPath, [entry, ...args], { cwd: ROOT, encoding: "utf8", env });
  let report: Any = null;
  try {
    report = JSON.parse(done.stdout);
  } catch {
    report = null;
  }
  return { status: done.status, stdout: done.stdout, stderr: done.stderr, report };
};
const runAdapter = (repo: Repo, env: Record<string, string>): Run =>
  spawnAt(path.join(repo.root, ADAPTER), [], { ...BASE_ENV, ...env });
const eventFile = (payload: unknown) => {
  const file = at("event.json");
  fs.writeFileSync(file, typeof payload === "string" ? payload : JSON.stringify(payload));
  return file;
};
/** Gerçek `pull_request` yükü: DEĞİŞMEZ SHA'lar ve etiket listesi birlikte gelir. */
const prPayload = (repo: Repo, labels: string[] = []) => ({
  action: "synchronize",
  pull_request: {
    base: { sha: repo.base, ref: "main" },
    head: { sha: repo.head, ref: "feature" },
    labels: labels.map((name) => ({ name })),
  },
});
const envOf = (name?: string, file?: string) => ({
  ...(name === undefined ? {} : { GITHUB_EVENT_NAME: name }),
  ...(file === undefined ? {} : { GITHUB_EVENT_PATH: file }),
});
const runPr = (repo: Repo, labels: string[] = []) =>
  runAdapter(repo, envOf(EVENT, eventFile(prPayload(repo, labels))));
/** Adaptörün KENDİ yüzeyi: rapor tam JSON, adaptör hatası yok ve kapı GERÇEKTEN çağrılmış. */
const checkOf = (result: Run, label: string): Any => {
  expect(result.report, `${label}: adaptör tam JSON üretmedi | ${result.stderr}`).not.toBeNull();
  expect(result.report.error, `${label}: ${JSON.stringify(result.report?.error)}`).toBeNull();
  expect(result.report.check, `${label}: kapı çağrılmadı`).not.toBeNull();
  expect(result.status, `${label}: çıkış kodu rapordan sapıyor`).toBe(result.report.exitCode);
  return result.report.check;
};
const ok = (result: Run, label: string) => {
  const check = checkOf(result, label);
  expect(result.status, `${label}: kabul sıfırla kapanmadı`).toBe(0);
  return check;
};
const refused = (result: Run, id: string) => {
  expect(result.report, `fail-closed yolda JSON rapor yok | ${result.stderr}`).not.toBeNull();
  expect(result.report.error?.id, JSON.stringify(result.report.error)).toBe(id);
  expect(result.report.status, "durum hata sınıfını söylemiyor").toBe(result.report.error.kind);
  expect(result.report.exitCode, "hata sıfırla kapandı").not.toBe(0);
  expect(result.status).toBe(result.report.exitCode);
  expect(result.report.check, "karar YERİNE hata gelmeliydi").toBeNull();
};

describe("pr-size CI adaptörü — pull_request olayını kabul edilmiş kapıya bağlar", () => {
  it("adaptör dosyası VARDIR: kapı artık olaya bağlanabilir", () => {
    expect(fs.existsSync(path.join(ROOT, ADAPTER)), "CI olay adaptörü yok").toBe(true);
  });

  it("sınıf etiketi yoksa KANONİKTEN türeyen sınıfa düşülür", () => {
    const check = ok(runPr(prRepo()), "etiketsiz PR");
    expect(check.decisionReport.changeClass.id, "sınıf kanonikten türemedi").toBe(IMPLICIT_CLASS);
    expect(check.decisionReport.changeClass.ceilingKind).toBe(IMPLICIT_KIND);
    expect(check.decisionReport.evidence.declared, "kanıt uyduruldu").toEqual([]);
  });

  it("tek sınıf etiketi sınıfı SEÇER; kanıt etiketleri kapıya iletilir", () => {
    // Aralık BİLEREK üst banda düşer: kanıt orada GERÇEKTEN aranır, yani iletim yanlışlanabilir.
    const repo = prRepo(LABELLED_BAND.maxNet);
    const classLabel = `${CLASS_LABEL}${LABELLED_CLASS}`;
    const evidence = EVIDENCE_IDS.map((id) => `${EVIDENCE_LABEL}${id}`);
    const withEvidence = ok(runPr(repo, [classLabel, ...evidence]), "kanıtlı PR");
    const report = withEvidence.decisionReport;
    expect(report.changeClass.id, "sınıf etiketi yok sayıldı").toBe(LABELLED_CLASS);
    expect(report.band.id, "aralık üst banda düşmedi").toBe(LABELLED_BAND.id);
    expect(report.evidence.declared, "kanıt iletilmedi").toEqual(EVIDENCE_IDS.slice().sort());
    // Karşı kanıt: etiket düşerse kapı aynı aralığı REDdeder — iletim sessiz bir süs değildir.
    const bare = checkOf(runPr(repo, [classLabel]), "kanıtsız PR");
    expect(bare.decisionReport.evidence.declared).toEqual([]);
    expect(bare.decisionReport.blockers.map((b: Any) => b.id)).toContain("evidence-missing");
    expect(bare.exitCode, "kanıtsız üst bant kabul edildi").not.toBe(0);
  });

  it("aralık DEĞİŞMEZ SHA'lardan kurulur; olayın ref metni kapıya hiç girmez", () => {
    const repo = prRepo();
    const result = runPr(repo);
    const check = ok(result, "SHA iletimi");
    const { base, head, mergeBase } = check.range ?? {};
    expect([base, head, mergeBase]).toEqual([repo.base, repo.head, repo.forkPoint]);
    const m = check.decisionReport.measurement;
    expect([m.grossAdditions, m.grossDeletions, m.governedFiles]).toEqual([RANGE_NET, 0, 1]);
    for (const secret of [repo.root, "feature", "refs/heads"])
      expect(result.stdout, `olay metni rapora sızdı: ${secret}`).not.toContain(secret);
  });

  it("`ciEnforced` ÇAĞRIYA ÖZGÜdür: adaptör true, doğrudan çağrı false kalır", () => {
    const repo = prRepo();
    const check = ok(runPr(repo), "CI çağrısı");
    expect(check.ciEnforced, "CI çağrısı enforcement beyan etmedi").toBe(true);
    expect(check.collectsGitRange).toBe(true);
    // AYNI aralık, doğrudan/yerel çağrı: kapı KENDİLİĞİNDEN CI iddia edemez.
    const argv = [`--base=${repo.base}`, `--head=${repo.head}`, `--class=${IMPLICIT_CLASS}`];
    const direct = spawnAt(path.join(repo.root, CLI), argv, BASE_ENV);
    expect(direct.report, `doğrudan çağrı JSON üretmedi | ${direct.stderr}`).not.toBeNull();
    expect(direct.report.ciEnforced, "doğrudan çağrı CI iddia etti").toBe(false);
    expect(direct.report.status, JSON.stringify(direct.report.error)).toBe(check.status);
  });
});

describe("pr-size CI adaptörü — olay ve etiket okuması FAIL-CLOSED", () => {
  const repo = prRepo();
  const noSha = { pull_request: { base: { ref: "main" }, head: { ref: "feature" }, labels: [] } };
  const labelled = (tag: string) => () => envOf(EVENT, eventFile(prPayload(repo, [tag])));
  const cases: Array<[string, () => Record<string, string>, string]> = [
    ["olay adı yok", () => envOf(undefined, eventFile(prPayload(repo))), "event-name-missing"],
    ["PR dışı olay", () => envOf("push", eventFile(prPayload(repo))), "event-name-unsupported"],
    ["olay yolu yok", () => envOf(EVENT), "event-path-missing"],
    ["olay yolu boş", () => envOf(EVENT, ""), "event-path-missing"],
    ["olay dosyası yok", () => envOf(EVENT, at("yok.json")), "event-unreadable"],
    ["olay dosyası dizin", () => envOf(EVENT, TMP), "event-unreadable"],
    ["bozuk JSON", () => envOf(EVENT, eventFile("{ bozuk")), "event-not-json"],
    ["pull_request yok", () => envOf(EVENT, eventFile({ number: 12 })), "event-shape-invalid"],
    ["SHA yerine ref", () => envOf(EVENT, eventFile(noSha)), "event-shape-invalid"],
    ["bilinmeyen sınıf", labelled(`${CLASS_LABEL}uydurma-sinif`), "class-label-unknown"],
    // BOŞ son ek de bir BEYANdır: sessizce kanonik sınıfa düşemez, kendi adıyla REDdir.
    ["boş sınıf son eki", labelled(CLASS_LABEL), "class-label-unknown"],
    ["bilinmeyen kanıt", labelled(`${EVIDENCE_LABEL}uydurma-kanit`), "evidence-label-unknown"],
  ];
  it.each(cases)("%s: karar YERİNE adlandırılmış hata gelir", (_label, make, id) => {
    const result = runAdapter(repo, make());
    refused(result, id);
    expect(result.stdout, "depo/geçici yol sızdı").not.toContain(TMP);
  });

  it("sınıf etiketi TAM BİR tanedir: ikinci etiket sessizce seçilmez", () => {
    const both = CLASSES.map((entry) => `${CLASS_LABEL}${entry.id}`);
    refused(runPr(repo, both), "class-label-ambiguous");
  });

  it("boş sınıf son eki ÇAĞIRAN hatasıdır, yapılandırma hatası DEĞİL", () => {
    const seen = runPr(repo, [CLASS_LABEL]);
    expect(`${seen.report.error.kind}/${seen.status}`, "yanlış sınıf").toBe("caller-input/64");
  });
});

describe("pr-size CI adaptörü — kablolama ve ikinci kopya yasağı", () => {
  it("iş akışı adaptörü YALNIZ pull_request olayında çalıştırır", () => {
    const workflow = read(WORKFLOW);
    expect(workflow, "adaptör hiçbir CI adımına bağlı değil").toContain(ADAPTER);
    const step = workflow.split(/\n(?=\s{6}- name: )/).find((text) => text.includes(ADAPTER));
    expect(step, "adaptörü çalıştıran adım yok").toBeTruthy();
    expect(step, "adım PR ile sınırlanmadı").toMatch(
      new RegExp(`if:[^\\n]*github\\.event_name == '${EVENT}'`),
    );
    // Doğrudan/yerel yüzey CI'a sızmaz: ham kapı kendi başına bir adım DEĞİLdir.
    expect(workflow.split(ADAPTER).join(""), "ham kapı doğrudan CI adımı oldu").not.toContain(CLI);
    // SIRA sözleşmedir: checkout < Node kurulumu < adaptör < bağımlılık kurulumu. Adaptör tam
    // geçmişe ve sabitlenmiş çalışma zamanına ihtiyaç duyar, ama bağımlılıklara duymaz.
    const order = ["actions/checkout@v4", "actions/setup-node@v4", ADAPTER, "npm install"].map(
      (marker) => workflow.indexOf(marker),
    );
    const seen = `bulunan konumlar: ${order}`;
    expect(Math.min(...order), `adım işareti yok — ${seen}`).toBeGreaterThan(-1);
    expect(
      [...order].sort((a, b) => a - b),
      `adım sırası bozuk — ${seen}`,
    ).toEqual(order);
  });

  it("iş akışı başlığı korumayı KENDİ kurduğunu iddia etmez ama canlı gerçeği yok da saymaz", () => {
    const header = read(WORKFLOW).split("\nname:")[0];
    // Bu YAML bir CI iş akışıdır; birleştirmeyi durduran şey GitHub tarafındaki korumadır.
    for (const overclaim of [/bu dosya[^.]*zorunlu kılar/i, /bu iş akışı[^.]*merge/i])
      expect(header, `iş akışı kurmadığı korumayı üstleniyor: ${overclaim}`).not.toMatch(overclaim);
    // Eskimiş "koruma YOK" anlatısı da kalamaz: koruma B13'ten ÖNCE de yürürlükteydi.
    for (const stale of [/kurulmamıştır/, /hiçbir birleştirmenin durdurulduğunu/])
      expect(header, `eskimiş 'koruma yok' anlatısı duruyor: ${stale}`).not.toMatch(stale);
    expect(header, "B13 sözleşmesi adıyla anılmıyor").toMatch(/B13/);
    expect(header, "canlı koruma gerçeği yazılmamış").toMatch(/branch\s*\n?#?\s*protection/);
  });

  it("adaptör ve bu test ikinci eşik/bant/sınıf/kanıt kopyası taşımaz", () => {
    const numbers = new Set<number>([
      ...BANDS.map((b) => b.maxNet),
      ...CLASSES.map((c) => c.maxNet),
      budget.splitRequiredAboveNet as number,
      budget.maxChangedFiles as number,
    ]);
    const names = [
      ...BANDS.map((b) => b.id),
      ...CLASSES.map((c) => c.id),
      ...BANDS.flatMap((b) => b.requires),
      ...(budget.churnGuard.requires as string[]),
    ];
    for (const file of [ADAPTER, SELF]) {
      expect(fs.existsSync(path.join(ROOT, file)), `denetlenecek dosya yok: ${file}`).toBe(true);
      const text = read(file);
      for (const value of numbers)
        expect(text, `${file}: eşik kopyası ${value}`).not.toMatch(new RegExp(`\\b${value}\\b`));
      for (const name of names)
        expect(text, `${file}: kimlik kopyası ${name}`).not.toMatch(new RegExp(`\\b${name}\\b`));
    }
  });
});
