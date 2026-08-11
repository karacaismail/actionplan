import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { StandardContractSchema } from "@/schemas";
import { describe, expect, it } from "vitest";

/** AP-OC1 kapısı. Kanonik sahipler: ADR-0027'nin AP-OC1 bölümü + ai-governance.json; CLAUDE.md
 *  yalnız referans verir. Bölüm, ilgisiz ADR içeriğine yaslanmasın diye `## `e kadar kesilir. */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ADR = "docs/adr-0027-engineering-standards.md";
const HEADING = "## Sahip anlayışı ve teknoloji kanıtı sözleşmesi (AP-OC1)";
const ANCHOR = `${ADR}#sahip-anlayışı-ve-teknoloji-kanıtı-sözleşmesi-ap-oc1`;
const GOVERNANCE = "src/data/standards/ai-governance.json";
/** GitHub başlık çapası: küçült, noktalama at, boşluk → `-`. ANCHOR bu türetmeye eşit olmalı. */
const githubAnchor = (heading: string) =>
  heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
/** Kaldırılan bağımsız doküman ve çözülmeyen ASCII çapa; ikisi de geri dönemez. */
const RETIRED = "docs/owner-comprehension-and-technology-evidence-contract.md";
const RETIRED_ANCHOR = "#sahip-anlayisi-ve-teknoloji-kaniti-sozlesmesi-ap-oc1";
const read = (rel: string) =>
  fs.existsSync(path.join(ROOT, rel)) ? fs.readFileSync(path.join(ROOT, rel), "utf8") : "";
/** ADR'den yalnız AP-OC1 bölümünü keser; başlık yoksa boş döner (fail-closed). */
const section = () => {
  const start = read(ADR).indexOf(HEADING);
  if (start < 0) return "";
  const rest = read(ADR).slice(start);
  const next = rest.slice(HEADING.length).search(/^## /m);
  return next < 0 ? rest : rest.slice(0, HEADING.length + next);
};
const contract = section();

/** Her mimari karar ve her faz/nihai raporun taşıması zorunlu beş alan. */
const PHASE_FIELDS = ["once", "simdi", "fark", "kullaniciYolculugu", "kalanEngel"];
const PHASE_LABELS = ["ÖNCE", "ŞİMDİ", "FARK", "KULLANICI YOLCULUĞU", "KALAN ENGEL"];
/** Makine anahtarı yalnız backtick'li tam token sayılır; düz metindeki "fark" yerine geçmez. */
const key = (field: string) => `\`${field}\``;
/** `küresel ölçekte kanıtlı` iddiasının yedi zorunlu kanıt boyutu. */
const EVIDENCE_DIMENSIONS = [
  "populariteKanitDegil",
  "bagimsizUretimKullanimi",
  "aktifBakimVeGuvenlikYaniti",
  "performansVeOperasyonKaniti",
  "standartBirlikteCalisabilirlik",
  "saglayiciBagimsizligi",
  "cikisVeRollbackStratejisi",
];
const OWNER_RULE_IDS = [
  "owner-comprehension-phase-report-fields",
  "owner-metaphor-non-normative",
  "owner-capability-none-not-product",
  "owner-technical-decision-boundary",
  "tech-evidence-global-scale-proof",
  "tech-evidence-conditional-experimental",
];

describe("AP-OC1/1 kanonik ADR bölümü — sade Türkçe açıklama zorunluluğu", () => {
  it("AP-OC1 bölümü ADR-0027 içinde vardır ve yalnız kendi kapsamını kapsar", () => {
    expect(contract.length, `${HEADING} yok veya boş`).toBeGreaterThan(1000);
    expect(contract.startsWith(HEADING)).toBe(true);
    for (const foreign of ["Non-goals", "check-standards-coverage", "Unknown-unknowns"])
      expect(contract, `bölüm dışı ADR içeriği sızdı: ${foreign}`).not.toContain(foreign);
    expect(ANCHOR).toBe(`${ADR}#${githubAnchor(HEADING)}`);
    expect(contract, "bölüm kendi kanonik çapasını taşımalı").toContain(ANCHOR);
    expect(contract, "çözülmeyen ASCII çapa kalmamalı").not.toContain(RETIRED_ANCHOR);
    expect(read(RETIRED), `${RETIRED} silinmiş olmalı`).toBe("");
  });

  it.each(PHASE_FIELDS)("makine anahtarı `%s` tam token olarak tanımlıdır", (field) => {
    expect(contract, "düz metin anahtarın yerine geçmez").toContain(key(field));
    const mutant = contract.replace(key(field), `\`${field}X\``);
    expect(mutant, "anahtar adı değişince token kontrolü düşer").not.toContain(key(field));
    expect(mutant, "düz metin sağ kaldığı için çıplak arama düşmezdi").toContain(field);
  });

  it.each(PHASE_LABELS)("sade Türkçe başlık %s tanımlıdır", (label) => {
    expect(contract).toContain(label);
  });

  it("en az bir CRM/HRMS form yolculuğunu invariant olarak taşır", () => {
    expect(contract).toContain("CRM");
    expect(contract).toContain("HRMS");
    expect(contract).toMatch(
      /yetkilendirildi mi[\s\S]{0,120}işlendi mi[\s\S]{0,120}aynı şekilde mi kaydedildi/,
    );
  });

  it("gerçek dünya metaforunu taşır ve normatif olmadığını açıkça söyler", () => {
    for (const token of ["garson", "mutfak", "kasa"]) expect(contract).toContain(token);
    expect(contract).toMatch(/[Mm]etafor normatif değildir/);
    expect(contract).toMatch(
      /invariant[\s\S]{0,80}sözleşme[\s\S]{0,80}test[\s\S]{0,40}yerine geçmez/,
    );
  });

  it("capability delta = NONE'u sade Türkçeye çevirir ve ürün yeteneği saymaz", () => {
    expect(contract).toContain("capability delta = NONE");
    expect(contract).toContain("Sade Türkçesi:");
    expect(contract).toMatch(/yeni bir runtime\/ürün yeteneği olarak sunulmaz/);
  });

  it("insan/teknik karar sınırını tanımlar", () => {
    expect(contract).toMatch(/geri alınabilir[\s\S]{0,120}sahibe onaylatılmaz/);
    for (const token of [
      "ürün/marka kapsamı",
      "geri alınamaz etki",
      "dış maliyet",
      "güvenlik risk iştahı",
      "repo gerçekliği",
      "küçük geri alınabilir deney",
      "bağımsız review",
    ])
      expect(contract).toContain(token);
  });
});

describe("AP-OC1/2 teknoloji kanıtı — popülerlik kanıt değildir", () => {
  it("`küresel ölçekte kanıtlı` iddiasını kanıt kaydına bağlar", () => {
    expect(contract).toContain("küresel ölçekte kanıtlı");
    expect(contract).toMatch(/[Pp]opülerlik[\s\S]{0,80}kanıt değildir/);
  });

  it.each(EVIDENCE_DIMENSIONS)("kanıt boyutu %s tanımlıdır", (dimension) => {
    expect(contract).toContain(dimension);
  });

  it("kanıt yoksa deneysel/koşullu geri düşüşünü ve rollback deneyini zorunlu kılar", () => {
    for (const token of ["deneysel", "koşullu", "rollback deneyi", "sözleşme arkasında izole"])
      expect(contract).toContain(token);
    expect(contract).toMatch(/ölçek iddiası uydurulmaz/);
  });
});

describe("AP-OC1/3 CLAUDE.md yalnız referans verir ve sınırı korur", () => {
  const claude = read("CLAUDE.md");

  it("iki kanonik sahibi referans gösterir, kaldırılan yolu geri getirmez", () => {
    expect(claude).toContain(ANCHOR);
    expect(claude).toContain(GOVERNANCE);
    expect(claude).not.toContain(RETIRED);
  });

  it("tam metni tekrarlamaz (özet + referans)", () => {
    expect(claude.split("\n").length).toBeLessThanOrEqual(80);
    for (const dimension of EVIDENCE_DIMENSIONS) expect(claude).not.toContain(dimension);
  });

  it("güncel çağrı yetkisini yansıtır ve doğrudan MCP writer çağrısını geri getirmez", () => {
    expect(claude).toContain("Codex Desktop MASTER");
    expect(claude).toContain("runpane --agent claude");
    expect(claude).toMatch(/[Dd]oğrudan MCP/);
    expect(claude).not.toMatch(/claude_review|claude_implement/);
  });

  it("DIRECTIVE-ONLY platform yazma sınırını ve fail-closed auth kapısını korur", () => {
    for (const token of [
      "DIRECTIVE-ONLY",
      "read-only-audit",
      "human-developer-only",
      "docs/platform-product-code-write-prohibition-directive.md",
      "claude.ai",
      "firstParty",
      "max",
      "fail-closed",
      "alt görev devredemez",
    ])
      expect(claude).toContain(token);
  });
});

describe("AP-OC1/4 ai-governance.json makine-zorlamalı kuralları", () => {
  const raw = read(GOVERNANCE);
  const standard = StandardContractSchema.parse(JSON.parse(raw || "{}"));
  const byId = new Map(standard.rules.map((rule) => [rule.id, rule]));

  it("StandardContractSchema'ya uyar ve kural id'leri benzersizdir", () => {
    expect(standard.id).toBe("ai-governance");
    expect(byId.size).toBe(standard.rules.length);
  });

  it.each(OWNER_RULE_IDS)("%s kuralı zorlanabilir biçimde tanımlıdır", (ruleId) => {
    const rule = byId.get(ruleId);
    expect(rule, `kural eksik: ${ruleId}`).toBeDefined();
    expect(rule?.severity).toBe("must");
    expect(rule?.check.length ?? 0).toBeGreaterThan(0);
    expect(rule?.rationale.length ?? 0).toBeGreaterThan(0);
  });

  it("faz raporu kuralı beş alanın tamamını sayar", () => {
    const rule = byId.get("owner-comprehension-phase-report-fields")?.rule ?? "";
    for (const field of PHASE_FIELDS) expect(rule).toContain(key(field));
  });

  it("teknoloji kanıtı kuralı yedi boyutun tamamını sayar", () => {
    const rule = byId.get("tech-evidence-global-scale-proof")?.rule ?? "";
    for (const dimension of EVIDENCE_DIMENSIONS) expect(rule).toContain(dimension);
  });

  it("kanonik bölümü referans alır ve popülerlik/uydurma iddiayı yasaklar", () => {
    expect(standard.references).toContain(ANCHOR);
    expect(standard.references).not.toContain(RETIRED);
    for (const [list, entry] of [
      [standard.banned, "popularity-as-technology-evidence"],
      [standard.banned, "fabricated-global-scale-claim"],
      [standard.banned, "owner-approval-for-reversible-technical-detail"],
      [standard.banned, "capability-none-presented-as-product-capability"],
      [standard.allowed, "plain-language-phase-report"],
      [standard.allowed, "non-normative-real-world-metaphor"],
      [standard.allowed, "conditional-experimental-technology-with-rollback"],
    ] as const)
      expect(list).toContain(entry);
  });
});
