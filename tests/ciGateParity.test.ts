import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")) as {
  scripts: Record<string, string>;
};
const deploy = fs.readFileSync(path.join(ROOT, ".github/workflows/deploy.yml"), "utf8");

const releaseGates = [
  "qa:platform-write-boundary",
  "qa:kernel-integrations",
  "qa:ui-delivery",
  "qa:market-readiness",
  "qa:finance-model",
  "qa:storybook-registry",
  "qa:atom",
  "qa:pages-app-smoke",
];

describe("local and Pages release gate parity", () => {
  it.each(releaseGates)("%s is a named local gate and part of qa:ci", (gate) => {
    expect(pkg.scripts[gate], `${gate} named script`).toBeTruthy();
    expect(pkg.scripts["qa:ci"], `${gate} missing from qa:ci`).toContain(`npm run ${gate}`);
  });

  it.each(releaseGates)("deploy invokes the same named %s gate", (gate) => {
    expect(deploy).toContain(`run: npm run ${gate}`);
  });

  it("the UI gate runs its focused governance and DOC-APPLY regression tests", () => {
    expect(pkg.scripts["qa:ui-delivery"]).toContain("check-ui-delivery.mjs");
    expect(pkg.scripts["qa:ui-delivery"]).toContain("uiDeliveryGovernance.test.ts");
    expect(pkg.scripts["qa:ui-delivery"]).toContain("docAppliedUiRoleIsolation.test.ts");
  });

  it("configure, upload and deploy stay fail-closed outside main", () => {
    const mainOnly = "if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'";

    expect(deploy.split(mainOnly)).toHaveLength(4);
  });
});

// P3b: PR satır bütçesi kapısının ZORUNLU `build` işine bağlanması. Metin araması yetmez; adımın
// SIRASI ve KOŞULU gerçek adım listesinden okunur. Girinti sözleşmesi dardır (job 2, steps 4,
// adım 6 boşluk) ve bu dosya YAML yazmaz, yalnız var olan yapıyı okur.
const JOB = "  build:";
const buildJob = deploy.slice(deploy.indexOf(`\n${JOB}\n`), deploy.indexOf("\n  deploy:\n"));
const stepList = buildJob.slice(buildJob.indexOf("\n    steps:\n"));
const steps = stepList.split(/\n {6}- /).slice(1);
const field = (step: string, key: string) => step.match(new RegExp(`(?:^|\\n) *${key}: (.+)`))?.[1];
const names = steps.map((step) => field(step, "name"));
const CHECKOUT = "Depoyu çek";
const NODE = "Node 20 kurulumu";
const INSTALL = "Bağımlılıkları kur";
const PR_SIZE_SCRIPT = "qa:pr-size-ci";
const prSizeStep = steps.find((step) => (field(step, "run") ?? "").includes(PR_SIZE_SCRIPT));
const template = fs.readFileSync(path.join(ROOT, ".github/PULL_REQUEST_TEMPLATE.md"), "utf8");
const canonical = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/data/standards/short-code.json"), "utf8"),
) as { changePackageBudget: Budget; rules: Array<{ id: string; rule: string }> };
type Budget = {
  maxChangedFiles: number;
  splitRequiredAboveNet: number;
  bands: Array<{ maxNet: number; requires: string[] }>;
  classes: Array<{ id: string; maxNet: number }>;
  churnGuard: { requires: string[] };
};
const budget = canonical.changePackageBudget;

describe("PR satır bütçesi kapısı ZORUNLU build işine bağlıdır", () => {
  it("pull_request tetiği etiket olaylarını da kapsar; kapı etiket değişince YENİDEN koşar", () => {
    const trigger = deploy.slice(
      deploy.indexOf("\n  pull_request:\n"),
      deploy.indexOf("\n  workflow_dispatch:"),
    );
    expect(trigger, "PR tetiği main dalını bıraktı").toContain("branches: [main]");
    const types = (trigger.match(/\n {4}types: \[(.+)\]/)?.[1] ?? "").split(", ");
    // Etiket ekleme/çıkarma sınıf ve kanıt GİRDİSİNİ değiştirir: yeniden koşmazsa kapı yalan söyler.
    for (const type of [
      "opened",
      "synchronize",
      "reopened",
      "ready_for_review",
      "labeled",
      "unlabeled",
    ])
      expect(types, `PR olay tipi eksik: ${type}`).toContain(type);
  });

  it("kapı ZORUNLU `build` işinde, checkout+Node kurulumundan SONRA ve kurulumdan ÖNCE koşar", () => {
    // Zorunlu status context'i `build` işidir; kapı başka bir işe taşınırsa merge'ü bloklamaz.
    expect(deploy).toContain(`\n${JOB}\n`);
    expect(deploy.slice(deploy.indexOf("\n  deploy:\n"))).toContain("needs: build");
    expect(names.slice(0, 4)).toEqual([CHECKOUT, NODE, field(prSizeStep ?? "", "name"), INSTALL]);
    expect(prSizeStep, "PR satır bütçesi adımı yok").toBeTruthy();
    // Ölçüm merge-base'e dayanır: sığ klon aralığı çözemez ve kapı sessizce yanlış ölçerdi.
    expect(steps[0]).toContain("uses: actions/checkout@v4");
    expect(steps[0]).toContain("fetch-depth: 0");
  });

  it("adım BLOKLAYICIdır, yalnız pull_request'te koşar ve kabul edilmiş script'i çağırır", () => {
    const step = prSizeStep as string;
    // Kopya bir `node ...` çağrısı ikinci bir giriş noktası olurdu: tek çağrı script üzerindendir.
    expect(field(step, "run")).toBe(`npm run ${PR_SIZE_SCRIPT}`);
    expect(field(step, "if")).toBe("github.event_name == 'pull_request'");
    expect(field(step, "name"), "adım adı Türkçe değil").toMatch(/PR satır bütçesi/);
    // Kaçış yolu YOK: yumuşatılan bir kapı merge'ü bloklamaz.
    for (const bypass of [/continue-on-error/, /\|\| true/, /timeout-minutes/, /uses:/])
      expect(step, `kapı yumuşatıldı: ${bypass}`).not.toMatch(bypass);
    expect(deploy, "adaptör script dışından kopyalanarak çağrıldı").not.toContain(
      "node tools/agents/check-pr-size",
    );
  });

  it("PR metni hiçbir ifade genişletmesiyle adıma girmez", () => {
    // Adaptör olay dosyasını YALNIZ koşucunun verdiği ortamdan okur; başlık/gövde/etiket kabuğa
    // ya da env değerine gömülürse PR'ı açan runner'da metin çalıştırabilirdi.
    expect(deploy, "PR alanı workflow ifadesiyle genişletildi").not.toMatch(
      /\$\{\{\s*github\.event\.pull_request/,
    );
    expect(prSizeStep as string, "adım kendi olay yolunu uydurdu").not.toContain(
      "GITHUB_EVENT_PATH",
    );
  });

  it("script kabul edilmiş biçimini korur ve YEREL toplu kapıya girmez", () => {
    expect(pkg.scripts[PR_SIZE_SCRIPT]).toBe("node tools/agents/check-pr-size-ci.mjs");
    // Yerel `qa:ci` bir pull_request olay dosyası TAŞIMAZ: eklenirse her yerel koşu fail-closed olurdu.
    expect(pkg.scripts["qa:ci"], "yerel toplu kapıda PR olay dosyası yoktur").not.toContain(
      PR_SIZE_SCRIPT,
    );
  });

  it("PR şablonu makine etiketlerini anlatır; eşik ve kanıt sözlüğünü KOPYALAMAZ", () => {
    const heading = "## PR satır bütçesi";
    expect(template, "şablonda PR satır bütçesi bölümü yok").toContain(heading);
    const section = template.slice(template.indexOf(heading));
    for (const named of [
      "pr-size:class:",
      "pr-size:evidence:",
      "src/data/standards/short-code.json",
    ])
      expect(section, `şablon kimliği anmıyor: ${named}`).toContain(named);
    // Şablon gövdesi AYRIŞTIRILMAZ: karar yalnız etiketlerden gelir.
    expect(section).toMatch(/etiket/i);
    const copies = [
      ...budget.bands.map((band) => band.maxNet),
      ...budget.classes.map((klass) => klass.maxNet),
      budget.splitRequiredAboveNet,
      budget.maxChangedFiles,
    ];
    for (const value of copies)
      expect(template, `şablonda eşik kopyası ${value}`).not.toMatch(new RegExp(`\\b${value}\\b`));
    for (const id of [...budget.bands.flatMap((b) => b.requires), ...budget.churnGuard.requires])
      expect(template, `şablonda kanıt sözlüğü kopyası ${id}`).not.toContain(id);
  });
});

// P3c: repodaki CANLI talimat tüketicileri (AGENTS.md, CLAUDE.md) eşiği kopyalamayı bırakıp
// kanonik alana bağlanır. Sayı araması BİLEREK DAR: yalnız paket eşikleri (bant net'leri, sınıf
// tavanları, split sınırı, dosya sayısı tavanı) aranır. HTTP durum kodu, gecikme bütçesi,
// erişilebilirlik zoom oranı ve kaynak-dosya/karmaşıklık sayıları bu kümenin DIŞINDADIR; onlar
// ayrı kanonik kısa-kod kurallarıdır ve bu paket onları korur, silmez.
const agentsMd = fs.readFileSync(path.join(ROOT, "AGENTS.md"), "utf8");
const claudeMd = fs.readFileSync(path.join(ROOT, "CLAUDE.md"), "utf8");
const CANONICAL_FIELD = "src/data/standards/short-code.json#changePackageBudget";
const section = (text: string, start: string, end: string) =>
  text.slice(text.indexOf(start), text.indexOf(end));
const shortCodeLock = section(agentsMd, "### 4.3", "### 4.4");
const smallPrSection = section(agentsMd, "\n## 6.", "\n## 7.");
const packageThresholds = [
  ...budget.bands.map((band) => band.maxNet),
  ...budget.classes.map((klass) => klass.maxNet),
  budget.splitRequiredAboveNet,
  budget.maxChangedFiles,
];
const evidenceVocabulary = [
  ...budget.bands.flatMap((band) => band.requires),
  ...budget.churnGuard.requires,
];
const ruleOf = (id: string) => canonical.rules.find((rule) => rule.id === id)?.rule ?? "";
const ruleCeiling = (id: string) => ruleOf(id).match(/≤ (\d+)/)?.[1] ?? "";

describe("P3c: repo talimat tüketicileri kanonik kısa-PR alanına bağlıdır", () => {
  it.each([
    ["AGENTS.md §4.3", () => shortCodeLock],
    ["AGENTS.md §6", () => smallPrSection],
    ["CLAUDE.md", () => claudeMd],
  ])("%s kanonik alana işaret eder ve paket eşiğini KOPYALAMAZ", (label, read) => {
    const text = read();
    expect(text, `${label} kanonik alana işaret etmiyor`).toContain(CANONICAL_FIELD);
    for (const value of packageThresholds)
      expect(text, `${label} eşik kopyası ${value}`).not.toMatch(new RegExp(`\\b${value}\\b`));
    for (const id of evidenceVocabulary)
      expect(text, `${label} kanıt sözlüğü kopyası ${id}`).not.toContain(id);
  });

  it("AGENTS.md kapıyı kabul edilmiş script ve ZORUNLU build üzerinden anlatır", () => {
    for (const token of [`npm run ${PR_SIZE_SCRIPT}`, "build"])
      expect(shortCodeLock, `§4.3 kapı gerçeğini anmıyor: ${token}`).toContain(token);
    expect(shortCodeLock, "başka eşik türetme yasağı yok").toMatch(/(çıkar|türet|tahmin|tekrar)/);
    expect(smallPrSection, "§6 kapıyı anmıyor").toContain(PR_SIZE_SCRIPT);
  });

  it("AGENTS.md ayrı kanonik dosya/karmaşıklık kurallarını ve kapsam frenlerini KORUR", () => {
    // Bunlar paket eşiği DEĞİLDİR: `short-file-length` ve `short-cyclomatic-complexity` kendi
    // kanonik kurallarıdır; migrasyon sırasında kazara silinmeleri regresyon olurdu.
    expect(shortCodeLock).toContain(`${ruleCeiling("short-file-length")} satır`);
    expect(shortCodeLock).toMatch(
      new RegExp(`karmaşıklık ≤ \\*\\*${ruleCeiling("short-cyclomatic-complexity")}\\*\\*`),
    );
    for (const token of ["allowed-files", "non-goal"])
      expect(shortCodeLock, `kapsam freni kayboldu: ${token}`).toContain(token);
    expect(smallPrSection, "atomik/tek-amaçlı niyet kayboldu").toMatch(/tek-amaçlı/);
  });

  it("CLAUDE.md tüketici bölümü politikayı TEKRARLAMAZ, davranışı bağlar", () => {
    const consumer = section(claudeMd, "## Short-PR consumer", "\n## Sahip anlayışı");
    expect(consumer, "Short-PR consumer bölümü yok").toContain(CANONICAL_FIELD);
    expect(consumer, "kapı çağrısı yok").toContain(`npm run ${PR_SIZE_SCRIPT}`);
    for (const token of ["brüt", "net", "dosya sayısı", "sınıf", "kanıt", "rollback"])
      expect(consumer, `rapor alanı eksik: ${token}`).toContain(token);
    expect(consumer, "okuma yükümlülüğü yok").toMatch(/ÖNCE/);
    expect(consumer, "tek paket / tek yazar kuralı yok").toMatch(/tek paket|tek yazar/i);
    expect(consumer, "fail-closed yok").toContain("fail-closed");
    // Sahip anlayışı sözleşmesi ve capability-delta gerçeği bu pakette DEĞİŞMEZ.
    for (const field of ["once", "simdi", "fark", "kullaniciYolculugu", "kalanEngel"])
      expect(claudeMd, `sahip anlayışı alanı kayboldu: ${field}`).toContain(field);
    expect(claudeMd).toContain("capability delta = NONE");
  });

  it("kanonik kısa-kod prose'u canlı tüketiciler hakkında YANLIŞ konuşmaz", () => {
    const rule = ruleOf("short-pr-size");
    expect(rule, "prose hâlâ AGENTS.md'yi eski eşik kopyası sayıyor").not.toMatch(
      /AGENTS\.md[^.]*(?:kopya|borc|borç)/,
    );
    expect(rule, "canlı tüketicilerin alana bağlandığı söylenmiyor").toMatch(
      /AGENTS\.md ve CLAUDE\.md/,
    );
    // Kalan docs borcu ve kanonik üstünlük gerçeği KORUNUR: temizlendiği iddia edilmez.
    expect(rule, "docs borcu gerçeği kayboldu").toMatch(/docs/);
    expect(rule, "kanonik üstünlük kayboldu").toContain("üstün gelir");
  });
});
