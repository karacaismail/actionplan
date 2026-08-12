import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

// P2A-1: change-package ÖLÇÜM çekirdeği. Burada bant, eşik veya bütçe kararı YOKTUR — çekirdek
// yalnız numstat girdisini dürüstçe okur, yol yazılışını doğrular, kategori sözleşmesini iki
// yönden denetler ve kapanan bir muhasebe üretir; bandı karara bağlamak P2A-2 CLI'ının işidir.
// Reviewer bulguları buraya kilitlenir: rapor boru üzerinde KESİLMESİN, bozuk sayısal alan
// YANLIŞ teşhis edilmesin, kategori TAM YOLU üretim kaynağını GİZLEMESİN, yol yazılışı sessizce
// DEĞİŞTİRİLMESİN. "Eşik kopyası yok" iddiası da kanonik kaynağa karşı koşulur; iddia değil ölçüm.
const ROOT = process.cwd();
const CORE = "tools/lib/pr-size-core.mjs";
const SELF = "tests/prSizeCore.test.ts";
const CANONICAL = "src/data/standards/short-code.json";
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const budget = JSON.parse(read(CANONICAL)).changePackageBudget;
const CATEGORIES = budget.separatelyReported;
// Number() bunları ya sessizce yutar (0x10→256, 1e3→1000, 10.5→10.5, ""→0, tam-genişlik １→1) ya
// da NaN üretir; ikisi de "ölçemedim" DEĞİL, yanlış bir sayı ya da yanlış bir teşhis demektir.
// biome-ignore format: the adversarial numeric-field set stays compact for the shard budget
const INVALID_NUMERIC = ["abc", "0x10", "1e3", "10.5", "", "-5", "+1", "007", " 1", "1 ", "NaN",
  "Infinity", "１", "9007199254740993"];
// biome-ignore lint/suspicious/noExplicitAny: the shipped pure JavaScript core has no declaration file.
const core: any = await import(pathToFileURL(path.join(ROOT, CORE)).href);
const numstat = (...lines: string[]) => `${lines.join("\n")}\n`;
const measure = (text: string, categories: unknown = CATEGORIES) =>
  core.measure({ numstat: text, categories });
const errorOf = (t: string, c: unknown = CATEGORIES) => measure(t, c).error;
const INPUT_INVALID = "measurement-input-invalid";

describe("pr-size çekirdeği — numstat girdisi ve yol normalizasyonu", () => {
  it("yalnız `-` veya ASCII negatif-olmayan tamsayı ölçülür", () => {
    const parsed = core.parseNumstat(
      numstat("1\t2\tsrc/a.ts", "0\t0\tsrc/b.ts", "-\t-\tpublic/logo.png"),
    );
    expect(parsed.invalid).toEqual([]);
    expect(parsed.rows).toEqual([
      { additions: 1, deletions: 2, file: "src/a.ts" },
      { additions: 0, deletions: 0, file: "src/b.ts" },
      { additions: null, deletions: null, file: "public/logo.png" },
    ]);
  });

  it("her geçersiz sayısal biçim yapısal olarak reddedilir, satır ÖLÇÜLMEZ", () => {
    for (const bad of INVALID_NUMERIC) {
      for (const line of [`${bad}\t0\tsrc/a.ts`, `0\t${bad}\tsrc/a.ts`]) {
        const at = JSON.stringify(line);
        const parsed = core.parseNumstat(numstat(line));
        expect(parsed.rows, `ölçülmemeliydi: ${at}`).toEqual([]);
        expect(parsed.invalid, `bildirilmeliydi: ${at}`).toHaveLength(1);
        expect(errorOf(numstat(line)).id, `yanlış teşhis: ${at}`).toBe(INPUT_INVALID);
      }
    }
  });

  it("eksik alan ve boş yol da ölçüm girdisi hatasıdır", () => {
    for (const line of ["1\t0", "1\t0\t", "sadece-metin"])
      expect(errorOf(numstat(line)).id, `kabul edilmemeliydi: ${line}`).toBe(INPUT_INVALID);
  });

  it("bozuk girdi ASLA bölme/bant kararına dönüşmez", () => {
    const result = measure(numstat("abc\t0\tsrc/a.ts"));
    expect(result.ok).toBe(false);
    expect(Object.keys(result)).toEqual(["ok", "error"]);
    expect(JSON.stringify(result)).not.toMatch(/split|bant/i);
  });

  it("ikili satır 0 SAYILMAZ; ölçülemeyen olarak işaretlenir", () => {
    const result = measure(numstat("-\t-\tpublic/logo.png", "5\t1\tsrc/a.ts"));
    expect(result.ok).toBe(true);
    expect(result.binaryFiles).toEqual(["public/logo.png"]);
    expect(result.totals.grossAdditions).toBe(5);
    expect(result.totals.files).toBe(2);
  });

  it("rename hedefi tek dosyadır (süslü ve düz sözdizimi)", () => {
    expect(core.renameTarget("src/{a.ts => b.ts}")).toBe("src/b.ts");
    expect(core.renameTarget("src/{ => sub}/a.ts")).toBe("src/sub/a.ts");
    expect(core.renameTarget("src/{sub => }/a.ts")).toBe("src/a.ts");
    expect(core.renameTarget("old.ts => new.ts")).toBe("new.ts");
    const result = measure(numstat("3\t1\tsrc/{a.ts => b.ts}", "2\t0\told.ts => new.ts"));
    expect(result.totals.files, "rename iki kez sayılmamalı").toBe(2);
    expect(result.governed.grossAdditions).toBe(5);
  });

  it("normalize edilemeyen yol fail-closed durdurur (rename ile kaçış dâhil)", () => {
    // biome-ignore format: the path-attack set stays compact for the shard budget
    const unsafe = ["/etc/passwd", "C:/x.ts", "C:\\x.ts", "src/\0a.ts", "dist\\hidden.ts",
      "./src/a.ts", "src/../../etc/x.ts", "src//a.ts", "src/a.ts/", "src/./a.ts",
      " dist/leadspace.ts"];
    for (const bad of unsafe) {
      expect(core.safePath(bad), `güvensiz sayılmalıydı: ${bad}`).toBeNull();
      expect(errorOf(numstat(`1\t0\t${bad}`)).id, `ölçüm durmalıydı: ${bad}`).toBe("path-unsafe");
    }
    expect(core.safePath("")).toBeNull();
    expect(core.safePath("src/a.ts")).toBe("src/a.ts");
    expect(errorOf(numstat("9\t0\tsrc/{a.ts => ../../etc/x.ts}")).id).toBe("path-unsafe");
    const leak = measure(numstat("500\t0\t dist/leadspace.ts", "1\t0\tsrc/a.ts"));
    expect(Object.keys(leak), "kırpma üretimi generated'a taşırdı").toEqual(["ok", "error"]);
    expect(leak.error.detail, "yol yazılışı raporda korunmalı").toContain(" dist/leadspace.ts");
  });
});

describe("pr-size çekirdeği — kategori sözleşmesi", () => {
  it("kanonik generated/lockfile/mechanical eşlemesi geçerlidir", () => {
    // biome-ignore format: the canonical category id set stays one line for side-by-side reading
    expect(CATEGORIES.map((c: { id: string }) => c.id)).toEqual(["generated", "lockfile", "mechanical-projection"]);
    expect(core.validateCategories(CATEGORIES)).toEqual([]);
    const duplicated = [...CATEGORIES, CATEGORIES[0]];
    expect(core.validateCategories(duplicated), "tekrarlı kimlik").not.toEqual([]);
  });

  it("kaynak kökünü yutan önek reddedilir", () => {
    for (const prefix of ["src/", "src", "s", "tools/", "docs", "tests/"]) {
      const swallow = [{ id: "generated", paths: [], pathPrefixes: [prefix] }];
      expect(core.validateCategories(swallow), `yutan önek: ${prefix}`).not.toEqual([]);
      expect(errorOf(numstat("1\t0\tsrc/a.ts"), swallow).id).toBe("category-config-invalid");
    }
  });

  it("güvensiz önek ve güvensiz tam yol reddedilir", () => {
    for (const bad of ["/abs/", "../x/", "", "C:/x/"]) {
      const asPrefix = [{ id: "generated", paths: [], pathPrefixes: [bad] }];
      const asPath = [{ id: "generated", paths: [bad], pathPrefixes: [] }];
      expect(core.validateCategories(asPrefix), `önek: ${bad}`).not.toEqual([]);
      expect(core.validateCategories(asPath), `tam yol: ${bad}`).not.toEqual([]);
    }
  });

  it("kaynak kodu dosyası TAM YOL olarak kategoriye gizlenemez", () => {
    // biome-ignore format: the pinned source-extension vocabulary stays compact for the shard budget
    expect(core.SOURCE_CODE_EXTENSIONS).toEqual([".ts", ".tsx", ".js", ".mjs", ".cjs", ".py",
      ".go", ".rs", ".java", ".kt", ".cs", ".php", ".rb", ".swift", ".vue", ".svelte"]);
    for (const ext of core.SOURCE_CODE_EXTENSIONS) {
      const hiding = [{ id: "generated", paths: [`src/App${ext}`], pathPrefixes: [] }];
      expect(core.validateCategories(hiding), `gizleme geçmemeliydi: ${ext}`).not.toEqual([]);
      // Aksi halde yüzlerce satır üretim kodu "ayrı raporlanan" diye bütçe dışına çıkardı.
      expect(errorOf(numstat(`500\t0\tsrc/App${ext}`), hiding).id).toBe("category-config-invalid");
    }
  });

  it("kategori eşleşmesi SEGMENT sınırındadır", () => {
    const lines = numstat(
      "1\t0\tsrc/data/generated/nodes/a.json",
      "2\t0\tsrc/data/generatedX/a.json",
      "3\t0\tdist/bundle.js",
      "4\t0\tdist-notreally/bundle.js",
      "5\t0\tpackage-lock.json",
      "6\t0\tpackage-lock.json.bak",
      "7\t0\ttools/platform-content/x.json",
    );
    const result = measure(lines);
    const byId = Object.fromEntries(result.categories.map((c: { id: string }) => [c.id, c]));
    expect(byId.generated.grossAdditions, "src/data/generated/ + dist/").toBe(4);
    expect(byId.lockfile.grossAdditions).toBe(5);
    expect(byId["mechanical-projection"].grossAdditions).toBe(7);
    expect(result.governed.grossAdditions, "generatedX + dist-notreally + .bak üretimdir").toBe(12);
    expect(result.governed.files).toBe(3);
  });
});

describe("pr-size çekirdeği — muhasebe, boru-güvenli çıktı ve çekirdek sınırları", () => {
  it("brüt/net/dosya ve kategori muhasebesi kapanır", () => {
    type Bucket = { grossAdditions: number; grossDeletions: number; files: number };
    // biome-ignore format: the mixed governed/category/binary fixture stays compact
    const result = measure(numstat("10\t4\tsrc/a.ts", "3\t1\tdist/b.js", "2\t2\tpackage-lock.json",
      "-\t-\tpublic/logo.png"));
    const sum = (pick: (b: Bucket) => number) =>
      result.categories.reduce((t: number, c: Bucket) => t + pick(c), pick(result.governed));
    expect(sum((b) => b.grossAdditions)).toBe(result.totals.grossAdditions);
    expect(sum((b) => b.grossDeletions)).toBe(result.totals.grossDeletions);
    expect(sum((b) => b.files)).toBe(result.totals.files);
    const { grossAdditions, grossDeletions, measuredNet, gross } = result.totals;
    expect(measuredNet).toBe(grossAdditions - grossDeletions);
    expect(gross).toBe(grossAdditions + grossDeletions);
    // biome-ignore format: the expected governed bucket stays one block for side-by-side reading
    expect(result.governed).toEqual({
      grossAdditions: 10, grossDeletions: 4, measuredNet: 6, gross: 14, files: 2,
    });
    expect(result.binaryFiles).toEqual(["public/logo.png"]);
  });

  it("128 KiB üstü rapor gerçek bir pipe'tan eksiksiz geçer (hemen exit'e rağmen)", () => {
    const child = `
import { writeAllSync } from ${JSON.stringify(pathToFileURL(path.join(ROOT, CORE)).href)};
const findings = Array.from({ length: 6000 }, (_, i) => ({ id: "row-" + i, detail: "x".repeat(32) }));
const payload = JSON.stringify({ findings, tail: "END" });
if (writeAllSync(1, payload) !== Buffer.byteLength(payload)) process.exit(9);
process.exit(3);`;
    const run = spawnSync(process.execPath, ["--input-type=module", "-e", child], {
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 32 * 1024 * 1024,
    });
    expect(run.stderr.toString(), "çocuk süreç hata verdi").toBe("");
    expect(run.status, "tam yazım tamamlanmadı").toBe(3);
    expect(run.stdout.length, "kanıt boyutu 128 KiB altında").toBeGreaterThanOrEqual(128 * 1024);
    const parsed = JSON.parse(run.stdout.toString());
    expect(parsed.tail, "JSON kuyruğu kesilmiş").toBe("END");
    expect(parsed.findings).toHaveLength(6000);
  });

  it("çekirdek exit sahiplenmez ve kanonik eşik/bant kopyası taşımaz", () => {
    expect(read(CORE), "çıkış kodu kararı P2A-2 CLI'ındır").not.toMatch(/process\.exit/);
    // biome-ignore format: the derived canonical threshold set stays compact for the shard budget
    const numbers = new Set<number>([...budget.bands.map((b: { maxNet: number }) => b.maxNet),
      ...budget.classes.map((c: { maxNet: number }) => c.maxNet),
      budget.splitRequiredAboveNet, budget.maxChangedFiles]);
    const ids = budget.bands.map((b: { id: string }) => b.id);
    for (const file of [CORE, SELF]) {
      const source = read(file);
      for (const n of numbers)
        expect(source, `${file}: eşik kopyası ${n}`).not.toMatch(new RegExp(`\\b${n}\\b`));
      for (const id of ids)
        expect(source, `${file}: bant kimliği ${id}`).not.toMatch(new RegExp(`\\b${id}\\b`));
    }
  });
});
