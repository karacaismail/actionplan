import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { StandardContractSchema } from "@/schemas";
import { describe, expect, it } from "vitest";

/**
 * ST-2 (ADR-0027) — Mühendislik standardı katalogları kapısı.
 * src/data/standards/*.json'un tamamı TEK paylaşılan StandardContractSchema'ya uyar;
 * id = dosya adı; ≥3 kural; id'ler benzersiz. P0 dalgası ≥12 standart.
 */
const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/data/standards");
const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith(".json")) : [];

describe("mühendislik standardı katalogları", () => {
  it("P0 dalgası: en az 12 standart sözleşmesi var", () => {
    expect(files.length).toBeGreaterThanOrEqual(12);
  });

  it.each(files)("%s — şemaya uyar, id=dosya adı, ≥3 kural", (f) => {
    const data = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
    const parsed = StandardContractSchema.parse(data);
    expect(parsed.id).toBe(f.replace(/\.json$/, ""));
    expect(parsed.rules.length).toBeGreaterThanOrEqual(3);
  });

  it("id'ler benzersiz", () => {
    const ids = files.map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")).id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
