import fs from "node:fs";
import path from "node:path";
import { type BudgetBand, type ChangePackageBudget, StandardContractSchema } from "@/schemas";
import { describe, expect, it } from "vitest";

/**
 * P1 — `short-pr-size` bütçesinin TEK kanonik makine sahibi; sınıf bant SEÇMEZ, tavanını
 * merdivenden türetir ve OWNER sayıları/koşul KİMLİKLERİ şemada ve burada pinlidir. KAPSAM
 * DÜRÜST: yalnız BU dosya denetlenir — AGENTS.md/docs kopyaları P3 borcu, diff kapısı YOK.
 */
type Dict = Record<string, unknown>;
type Rows = Array<Record<string, unknown>>;
type Rule = { id: string; rule: string; rationale: string; check: string };

const ROOT = process.cwd();
const CANONICAL = "src/data/standards/short-code.json";
const canonical = JSON.parse(fs.readFileSync(path.join(ROOT, CANONICAL), "utf8")) as Dict;
const budget = canonical.changePackageBudget as ChangePackageBudget;
const bandNamed = (id: string) => budget.bands.find((b) => b.id === id) as BudgetBand;
const [DEFAULT_BAND, CONDITIONAL, WAIVER] = ["default", "conditional", "waiver"].map(bandNamed);
const COND_REQS = CONDITIONAL.requires;
const ceilingOf = (id: string) => budget.classes.find((c) => c.id === id)?.maxNet;
const [RULE, ...EXTRA_RULES] = (canonical.rules as Rule[]).filter((r) => r.id === "short-pr-size");
const clone = (): Dict => JSON.parse(JSON.stringify(canonical));
const mutated = (edit: (b: Dict) => unknown): Dict => {
  const doc = clone();
  edit(doc.changePackageBudget as Dict);
  return doc;
};
const set = (target: unknown, patch: Dict) => Object.assign(target as Dict, patch);
const bandsOf = (b: Dict) => b.bands as Rows;
const classesOf = (b: Dict) => b.classes as Rows;
const catsOf = (b: Dict) => b.separatelyReported as Rows;
const reqs = (b: Dict, i: number, requires: unknown[]) => set(bandsOf(b)[i], { requires });

/** Sözleşmeyi sessizce zayıflatan her sapma şemada RED olmalı; hiçbiri strip edilip geçmemeli. */
const REJECTS: Record<string, (b: Dict) => unknown> = {
  "unknown-root-key": (b) => set(b, { extraBudget: 1 }),
  "band-ladder-order-drift": (b) => set(b, { bands: [...bandsOf(b)].reverse() }),
  "band-ceilings-not-ascending": (b) => set(bandsOf(b)[2], { maxNet: 1 }),
  // OWNER sayıları kendi içinde tutarlı biçimde kaydırılsa bile RED: merdiven sabittir.
  "owner-net-ladder-shift": (b) => {
    bandsOf(b).forEach((band, i) => set(band, { maxNet: [600, 900, 1500][i] }));
    classesOf(b).forEach((c, i) => set(c, { maxNet: [600, 900][i] }));
    return set(b, { splitRequiredAboveNet: 1500 });
  },
  "max-changed-files-drift": (b) => set(b, { maxChangedFiles: 999 }),
  "default-band-demands-evidence": (b) => reqs(b, 0, [...COND_REQS]),
  // OWNER kararı: koşullu istisna bandında waiver ZORUNLU DEĞİL — istemesi de yasak.
  "conditional-band-demands-waiver": (b) => reqs(b, 1, [...COND_REQS, "explicit-waiver"]),
  "conditional-band-without-conditions": (b) => reqs(b, 1, []),
  // Yedi koşul SAYI olarak değil KİMLİK olarak aranır: tekrar da, takas da RED.
  "conditional-band-repeats-id": (b) => reqs(b, 1, COND_REQS.slice().fill("full-green")),
  "conditional-band-swaps-ids": (b) => reqs(b, 1, [...COND_REQS.slice(1), "independent-review"]),
  "waiver-band-drops-waiver": (b) => reqs(b, 2, ["independent-review"]),
  "waiver-band-adds-requirement": (b) => reqs(b, 2, [...WAIVER.requires, "full-green"]),
  "unknown-requirement-id": (b) => reqs(b, 1, ["made-up-condition"]),
  "split-threshold-drift": (b) =>
    set(b, { splitRequiredAboveNet: (b.splitRequiredAboveNet as number) + 1 }),
  "class-ceiling-drift": (b) => set(classesOf(b)[0], { maxNet: DEFAULT_BAND.maxNet + 1 }),
  "unknown-class-id": (b) => set(classesOf(b)[1], { id: "made-up-class" }),
  "duplicate-category-id": (b) => set(catsOf(b)[2], { id: "generated" }),
  "category-dropped-from-set": (b) => set(b, { separatelyReported: catsOf(b).slice(0, 2) }),
  "category-without-path": (b) => set(catsOf(b)[0], { paths: [], pathPrefixes: [] }),
  // Kapalı üçlü: dördüncü kategori geçerli kimlikle bile giremez, önek kaynak kökünü yutamaz.
  "fourth-category-off-enum": (b) => catsOf(b).push({ ...catsOf(b)[0], id: "vendored" }),
  "fourth-category-known-id": (b) => catsOf(b).push(catsOf(b)[0]),
  "prefix-swallows-source-root": (b) => (catsOf(b)[0].pathPrefixes as string[]).push("src/"),
  "measurement-mode-dropped": (b) => set(b.measurement, { modes: ["range"] }),
  "measurement-mode-repeated": (b) => set(b.measurement, { modes: ["range", "range"] }),
  "measurement-report-dropped": (b) => set(b.measurement, { reports: ["gross-additions"] }),
  "chained-decomposition-overclaim": (b) => set(b.measurement, { decomposesChainedPackages: true }),
  "churn-guard-unknown-band": (b) => set(b.churnGuard, { appliesWhenNetAtOrBelowBand: "made-up" }),
  "churn-gross-max-decoupled": (b) => set(b.churnGuard, { grossMaxFromBand: "waiver" }),
  "churn-guard-credits-deletions": (b) => set(b.churnGuard, { netCreditFloor: -1000 }),
  // CI'a bağlanmamış kapı "bloklar" diye beyan edilemez; blocks yalnız CI durumunda true olabilir.
  "checker-claims-blocking-before-ci": (b) => set(b.checker, { blocks: true }),
  // Ters yön de RED: durum CI'a atlarken blocks geride kalamaz (ikisi tek bir gerçeği söyler).
  "checker-status-ahead-of-blocks": (b) => set(b.checker, { status: "ci-enforced-blocking" }),
  "unknown-checker-status": (b) => set(b.checker, { status: "bloklar" }),
};

describe("short-code — change-package bütçesi sözleşmesi", () => {
  it("standart şemaya uyar, sürüm uyumlu yükselir ve bütçe alanı strip edilmez", () => {
    const parsed = StandardContractSchema.parse(canonical);
    expect([parsed.id, parsed.family]).toEqual(["short-code", "engineering"]);
    expect(parsed.version.startsWith("1.")).toBe(true);
    expect(parsed.version, "sürüm yükselmedi").not.toBe("1.0.0");
    // Kapı beyanı GERİYE UYUMLU biçimde genişledi (working-tree modu): MINOR hane yükselmeden
    // bu yeni gerçek yayımlanamaz; şema/alan biçimi değişmediği için MAJOR sabit kalır.
    expect(parsed.version, "yeni mod beyanı sürümsüz yayımlandı").toMatch(/^1\.3\./);
    // Alan şemaya girmemişse zod onu sessizce atar; bu eşitlik tam da onu yakalar.
    expect((parsed as unknown as Dict).changePackageBudget).toEqual(budget);
  });

  it("OWNER bant merdiveni ve koşul kimlikleri kanonik alanda birebir kayıtlıdır", () => {
    expect(budget.bands.map((b) => b.id).join()).toBe("default,conditional,waiver");
    // OWNER sayıları: sessiz kaydırmaya karşı burada ve şemada (literal) pinli.
    expect(budget.bands.map((b) => b.maxNet)).toEqual([400, 800, 1200]);
    expect(budget.maxChangedFiles).toBe(20);
    expect(budget.splitRequiredAboveNet).toBe(WAIVER.maxNet);
    expect(DEFAULT_BAND.requires, "varsayılan bant kanıt istiyor").toEqual([]);
    // Yedi koşul "kaç tane" değil "hangileri" olarak pinlenir; waiver bu bantta yasaktır.
    expect(COND_REQS.join(" ")).toBe(
      "single-narrow-problem bounded-file-set no-redundant-repetition no-quality-tradeoff full-green fresh-reviewer-accept explicit-rollback",
    );
    expect(WAIVER.requires.join(" ")).toBe(
      "strong-technical-justification independent-review explicit-waiver",
    );
    // OWNER metni birebir: waiver bandı alt bandın koşullarını KENDİLİĞİNDEN devralmaz.
    expect(WAIVER.includesLowerBandRequirements).toBe(false);
  });

  it("sınıf bandı seçmez; yalnız varsayılan/gerekçeli tavanı sınıflandırır", () => {
    expect(budget.classes.map((c) => `${c.id}:${c.ceilingKind}`).join()).toBe(
      "production:default,security-test-conformance:justified",
    );
    // Sınıf tavanı ikinci bir eşik kopyası değil; bant merdiveninden türer.
    expect(ceilingOf("production")).toBe(DEFAULT_BAND.maxNet);
    expect(ceilingOf("security-test-conformance")).toBe(CONDITIONAL.maxNet);
  });

  it("kapı beyanı dürüsttür: fixture/aralık/çalışma ağacı ölçülür, enforcement hâlâ YOK", () => {
    expect(budget.checker.path).toBe("tools/agents/check-pr-size.mjs");
    expect(budget.checker.status).toBe("implemented-not-wired");
    expect(budget.checker.blocks, "bağlanmamış kapı bloklama iddia ediyor").toBe(false);
    // P2B2b gerçeği: working-tree modu ARTIK kapıda VAR; kalan TEK boşluk CI/P3 bağlanmasıdır.
    for (const named of [/--working-tree=true/, /CI/, /P3/])
      expect(budget.checker.note, `kalan gerçek adıyla sayılmıyor: ${named}`).toMatch(named);
    expect(budget.checker.note, "var olan mod eksik ilan edildi").not.toMatch(
      /working-tree[^.]*(yoktur|YOKTUR)/,
    );
    // Ölçüm modlarının hepsi kapıda gerçekten çağrılabilir; beyan modları geride bırakamaz.
    expect(budget.measurement.modes.join()).toBe("range,working-tree");
    // Bloklama iddiası hâlâ YASAK: enforcement CI'ya bağlanana kadar açıkça yok sayılır.
    expect(budget.checker.note, "bağlanmamış kapı enforcement iddia ediyor").toMatch(
      /enforcement hâlâ YOKTUR/,
    );
    // Durum ↔ gerçeklik: yalnız `planned-not-implemented` iken dosya YOKtur; P2 dosyayı yazdı.
    expect(fs.existsSync(path.join(ROOT, budget.checker.path))).toBe(
      budget.checker.status !== "planned-not-implemented",
    );
    expect(EXTRA_RULES, "eşiğin tek kural sahibi olmalı").toEqual([]);
    expect(RULE.check, "olmayan kapı 'bloklar' deniyor").not.toMatch(/blok/i);
    expect(RULE.check).toContain("changePackageBudget.checker");
  });

  it("ölçüm ölçemediğini iddia etmez; brüt ve ölçülen net ayrı raporlanır", () => {
    expect(budget.measurement.decomposesChainedPackages).toBe(false);
    expect(budget.measurement.modes.join()).toBe("range,working-tree");
    expect(budget.measurement.reports.join()).toBe("gross-additions,gross-deletions,measured-net");
    const catIds = budget.separatelyReported.map((c) => c.id).join();
    expect(catIds).toBe("generated,lockfile,mechanical-projection");
    for (const category of budget.separatelyReported)
      expect(category.paths.length + category.pathPrefixes.length, category.id).toBeGreaterThan(0);
    // Churn freni: anlamsız silme bütçeye kredi yazmaz, brüt tavan bağımsız kopya değildir.
    expect(budget.churnGuard.netCreditFloor).toBe(0);
    expect(budget.churnGuard.netCreditPolicy).toBe("net-clamped-at-floor-deletions-earn-no-credit");
    expect(budget.churnGuard.appliesWhenNetAtOrBelowBand).toBe(DEFAULT_BAND.id);
    expect(budget.churnGuard.grossMaxFromBand, "brüt tavan banttan türemiyor").toBe(CONDITIONAL.id);
    expect(budget.churnGuard, "ikinci eşik kopyası").not.toHaveProperty("grossMax");
    expect(budget.churnGuard.requires).toContain("independent-review");
  });

  it("BU dosyada ikinci eşik kopyası yok; repo-geneli migrasyon P3 testinin işi", () => {
    const thresholds = new Set<number>([
      ...budget.bands.map((b) => b.maxNet),
      ...budget.classes.map((c) => c.maxNet),
      budget.splitRequiredAboveNet,
      budget.maxChangedFiles,
    ]);
    const freeText = [
      RULE.rule,
      RULE.rationale,
      RULE.check,
      ...budget.bands.map((b) => b.note),
      ...budget.classes.map((c) => c.scope),
      budget.churnGuard.note,
      budget.measurement.honestScopeNote,
      budget.checker.note,
    ].join(" ");
    for (const value of thresholds)
      expect(freeText, `prose-threshold-copy:${value}`).not.toMatch(new RegExp(`\\b${value}\\b`));
    expect(RULE.rule, "geçiş gerçeği eksik").toMatch(/changePackageBudget[\s\S]*P3/);
  });

  it("bütçe alanı fail-closed tiplidir: her sapma şemada RED olur", () => {
    const accepted = Object.entries(REJECTS)
      .filter(([, edit]) => StandardContractSchema.safeParse(mutated(edit)).success)
      .map(([label]) => label);
    expect(accepted, "canonical-mutation-unguarded").toEqual([]);
    // Sağlamlık kontrolü: mutasyon dışı klon hâlâ kabul edilmeli (test kendini kandırmasın).
    expect(StandardContractSchema.safeParse(clone()).success).toBe(true);
  });
});
