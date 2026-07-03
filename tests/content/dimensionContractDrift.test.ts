import fs from "node:fs";
import path from "node:path";
import { DIMENSION_KEYS } from "@/schemas";
import { describe, expect, it } from "vitest";
import { SEMANTIC_KEYS, SEMANTIC_RULES } from "../../tools/lib/dimension-semantics.mjs";

/**
 * Doküman ↔ makine kuralı DRIFT kapısı.
 * docs/dimension-contract-17.md (insan-okur sözleşme) ile
 * tools/lib/dimension-semantics.mjs (makine kuralı) ve src/schemas DIMENSION_KEYS
 * arasındaki tutarlılığı zorlar. "Makine kaynağı kazanır" beyanı yeterli değil;
 * drift burada KIRMIZI olur. CI'da npm run test:content ile koşar.
 */

const DOC = fs.readFileSync(path.resolve(process.cwd(), "docs/dimension-contract-17.md"), "utf8");

const DAY2 = ["dataLifecycle", "observability", "reliability"];
const LEGACY = DIMENSION_KEYS.slice(0, 14);

describe("dimension-contract-17 drift kapısı", () => {
  it("şema, semantik modül ve doküman aynı 17 anahtarı taşır", () => {
    expect(DIMENSION_KEYS).toHaveLength(17);
    expect([...SEMANTIC_KEYS].sort()).toEqual([...DIMENSION_KEYS].sort());
    // Doküman kompakt matrisinde her key `| <key> |` hücresi olarak geçmeli.
    for (const key of DIMENSION_KEYS) expect(DOC).toContain(`| ${key} |`);
  });

  it("day-2 üçlüsü enforce=fail, miras 14 enforce=warn", () => {
    for (const k of DAY2) expect(SEMANTIC_RULES[k].enforce).toBe("fail");
    for (const k of LEGACY) expect(SEMANTIC_RULES[k].enforce).toBe("warn");
  });

  it("her kuralda ≥1 must ve ≥2 anyOf kavramı var", () => {
    for (const k of SEMANTIC_KEYS) {
      expect(Object.keys(SEMANTIC_RULES[k].must).length).toBeGreaterThanOrEqual(1);
      expect(Object.keys(SEMANTIC_RULES[k].anyOf).length).toBeGreaterThanOrEqual(2);
    }
  });

  it("doküman sabit kararı beyan eder: 17 sabit, 18. boyut yok", () => {
    expect(DOC).toContain("boyut sayısı 17");
    expect(DOC).toContain("Yeni boyut eklenmez");
  });

  it("WARN-ratchet baseline'ı mevcut, deterministik ve 14 miras boyutu kapsıyor", () => {
    const base = JSON.parse(
      fs.readFileSync(
        path.resolve(process.cwd(), "tools/agents/semantic-warn-baseline.json"),
        "utf8",
      ),
    );
    expect(base.total).toBeGreaterThan(0);
    const keys = Object.keys(base.byKey);
    expect(keys).toEqual([...keys].sort()); // deterministik sıralama (review edilebilir diff)
    for (const k of keys) expect(LEGACY).toContain(k); // yalnız warn-kademesi boyutları
  });
});
