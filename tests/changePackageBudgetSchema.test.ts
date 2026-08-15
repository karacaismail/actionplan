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
const checkerOf = (b: Dict) => b.checker as { status: string; blocks: boolean };
/** B13 merge koruması: kanonik alanın TEK makine sahibi; mutasyonlar buradan türer. */
const mpOf = (b: Dict) => (b.checker as Dict).mergeProtection as Dict;
const MP = (budget.checker as unknown as Dict).mergeProtection as Dict;
const VERIFIER = "tools/agents/check-pr-size-branch-protection.mjs";

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
  // `status` ve `blocks` TEK bir gerçeği söyler; hangi durumda olursak olalım ayrışmaları RED'dir.
  // Mutasyonlar kanonik durumdan TÜRETİLİR: sabit değer yazsaydık kanonik oraya geldiğinde
  // mutasyon sessizce no-op'a döner ve bu satırlar hiçbir sapmayı yakalamaz hale gelirdi.
  "checker-blocks-decoupled-from-status": (b) => set(b.checker, { blocks: !checkerOf(b).blocks }),
  "checker-status-decoupled-from-blocks": (b) =>
    set(b.checker, {
      status: checkerOf(b).blocks ? "implemented-not-wired" : "ci-enforced-blocking",
    }),
  "unknown-checker-status": (b) => set(b.checker, { status: "bloklar" }),
  // B13: merge koruması sözleşmesi ZORUNLUdur ve sessizce strip EDİLEMEZ.
  "merge-protection-dropped": (b) =>
    set(b, {
      checker: Object.fromEntries(
        Object.entries(b.checker as Dict).filter(([key]) => key !== "mergeProtection"),
      ),
    }),
  "merge-protection-branch-blank": (b) => set(mpOf(b), { branch: "" }),
  "merge-protection-branch-typed-away": (b) => set(mpOf(b), { branch: null }),
  "merge-protection-check-blank": (b) => set(mpOf(b), { requiredCheck: "" }),
  // Altı politika kararının HER BİRİ literal kilitlidir; gevşetme sessizce geçemez.
  "merge-protection-strict-off": (b) => set(mpOf(b), { strict: false }),
  "merge-protection-admins-off": (b) => set(mpOf(b), { enforceAdmins: false }),
  "merge-protection-pr-not-required": (b) => set(mpOf(b), { pullRequestRequired: false }),
  "merge-protection-force-push-allowed": (b) => set(mpOf(b), { forcePushAllowed: true }),
  "merge-protection-deletion-allowed": (b) => set(mpOf(b), { deletionAllowed: true }),
  "merge-protection-conversation-off": (b) =>
    set(mpOf(b), { requiredConversationResolution: false }),
  "merge-protection-verifier-wrong": (b) => set(mpOf(b), { verifier: `${VERIFIER}.bak` }),
  "merge-protection-verifier-blank": (b) => set(mpOf(b), { verifier: "" }),
  "merge-protection-note-blank": (b) => set(mpOf(b), { note: "" }),
  "merge-protection-unknown-field": (b) => set(mpOf(b), { rulesetId: "gizli" }),
};

describe("short-code — change-package bütçesi sözleşmesi", () => {
  it("standart şemaya uyar, sürüm uyumlu yükselir ve bütçe alanı strip edilmez", () => {
    const parsed = StandardContractSchema.parse(canonical);
    expect([parsed.id, parsed.family]).toEqual(["short-code", "engineering"]);
    // Geriye UYUMLU yükseliş: aynı ana sürüm içinde minör artar, alan sözleşmesi kırılmaz.
    expect(parsed.version.startsWith("1.")).toBe(true);
    // B13 merge-protection alanı GERİYE UYUMLU bir EKLEMEdir: minör yükselir, eski alanlar durur.
    expect(parsed.version, "sürüm yükselmedi").toBe("1.5.0");
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

  it("kapı beyanı dürüsttür: PR olayında CI'a bağlıdır, B13 canlı korumayı denetlenebilir kılar", () => {
    expect(budget.checker.path).toBe("tools/agents/check-pr-size.mjs");
    // B12 gerçeği: kapı `pull_request` olayında bir CI adımına BAĞLANDI; ikisi tek gerçeği söyler.
    expect(budget.checker.status).toBe("ci-enforced-blocking");
    expect(budget.checker.blocks, "bağlı kapı bloklamayı reddediyor").toBe(true);
    // Uygulanmış mod artık YOK sayılamaz.
    expect(budget.checker.note, "uygulanmış mod yok sayılıyor").not.toMatch(
      /working-tree[^.]*(yoktur|YOKTUR)/,
    );
    // Eski "enforcement yok" beyanı artık YANLIŞtır ve kalamaz.
    expect(budget.checker.note, "bağlı kapı hâlâ enforcement yok diyor").not.toMatch(
      /enforcement hâlâ YOKTUR/,
    );
    // Her yüzey ADIYLA sayılır: PR olay adaptörü ve canlı branch protection birlikte anlatılır.
    for (const named of [/pull_request/, /B13/, /branch protection|zorunlu check/i])
      expect(budget.checker.note, `yüzey adıyla sayılmıyor: ${named}`).toMatch(named);
    // B13 GERÇEĞİ: koruma ZATEN yürürlüktedir; kanonik metin onu yok sayamaz ve kendi
    // kurduğunu da İDDİA EDEMEZ. `açık` beyanı artık bir drift'tir.
    const noteText = (budget.checker.note as string).replace(/\s*\n\s*/g, " ");
    expect(noteText, "kapanmış boşluk hâlâ AÇIK ilan ediliyor").not.toMatch(
      /(B13|branch protection|zorunlu check)[^.]*[Aa][ÇçCc][Iıİi][Kk](?!la|ça|ç)/,
    );
    for (const truth of [/ZATEN/, /KURMAZ/, /ürün\/runtime hazırlığı sayılmaz/])
      expect(noteText, `canlı koruma gerçeği eksik: ${truth}`).toMatch(truth);
    // Durum ↔ gerçeklik: yalnız `planned-not-implemented` iken dosya YOKtur; P2 dosyayı yazdı.
    expect(fs.existsSync(path.join(ROOT, budget.checker.path))).toBe(
      budget.checker.status !== "planned-not-implemented",
    );
    expect(EXTRA_RULES, "eşiğin tek kural sahibi olmalı").toEqual([]);
    expect(RULE.check, "olmayan kapı 'bloklar' deniyor").not.toMatch(/blok/i);
    expect(RULE.check).toContain("changePackageBudget.checker");
  });

  it("merge koruması sözleşmesi TAMdır, strip edilmez ve kendi kurduğunu iddia etmez", () => {
    // Alan şemaya girmemişse zod onu sessizce atardı; bu eşitlik tam da onu yakalar.
    const parsed = StandardContractSchema.parse(canonical) as unknown as Dict;
    const parsedBudget = parsed.changePackageBudget as Dict;
    expect(mpOf(parsedBudget), "merge koruması sözleşmesi strip edildi").toEqual(MP);
    // Altı politika kararı: hepsi tek bir nesnede, yarım beyan yok.
    expect({
      strict: MP.strict,
      enforceAdmins: MP.enforceAdmins,
      pullRequestRequired: MP.pullRequestRequired,
      forcePushAllowed: MP.forcePushAllowed,
      deletionAllowed: MP.deletionAllowed,
      requiredConversationResolution: MP.requiredConversationResolution,
    }).toEqual({
      strict: true,
      enforceAdmins: true,
      pullRequestRequired: true,
      forcePushAllowed: false,
      deletionAllowed: false,
      requiredConversationResolution: true,
    });
    // Kimlikler boş olamaz; KESİN değerleri iş akışına B13 conformance testinde bağlanır.
    for (const key of ["branch", "requiredCheck"])
      expect((MP[key] as string).length, `${key} boş`).toBeGreaterThan(0);
    expect(MP.verifier, "doğrulayıcı yolu sapmış").toBe(VERIFIER);
    expect(fs.existsSync(path.join(ROOT, MP.verifier as string)), "doğrulayıcı yok").toBe(true);
    // Dürüstlük: sözleşme canlı korumayı KURMAZ ve ürün hazırlığı iddia ETMEZ.
    for (const truth of [/KURMAZ/, /KARŞILAŞTIRILABİLİR/, /ürün\/runtime hazırlığı sayılmaz/])
      expect(MP.note as string, `dürüstlük beyanı eksik: ${truth}`).toMatch(truth);
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
      MP.note as string,
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
