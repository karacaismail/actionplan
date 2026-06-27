import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Gate: bileşen/görünümlerde GÖMÜLÜ UI metni YASAK — tüm metin src/data/strings.json'da.
 * Bu test, yeni eklenen satır-içi metinleri (literal aria-label/placeholder/title/header/label
 * veya TR-özel karakterli string literal) yakalayıp CI'ı kırar → "bir daha bozulmasın".
 */
const ROOTS = ["src/components", "src/views"].map((d) => path.resolve(process.cwd(), d));

function walk(d: string): string[] {
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

const ATTR = /(aria-label|placeholder|title|ariaLabel)="[^"]*[A-Za-zçğıöşüÇĞİÖŞÜ][^"]*"/;
const LABEL = /\b(header|label):\s*"[^"]*[A-Za-zçğıöşüÇĞİÖŞÜ][^"]*"/;
const TR_DQ = /"[^"]*[çğıöşüÇĞİÖŞÜ][^"]*"/;
const TR_SQ = /'[^']*[çğıöşüÇĞİÖŞÜ][^']*'/;

function scan(): string[] {
  const files = ROOTS.flatMap(walk).filter((f) => f.endsWith(".tsx"));
  const violations: string[] = [];
  for (const f of files) {
    const rel = f.split("/src/")[1] ?? f;
    const lines = fs.readFileSync(f, "utf8").split("\n");
    let inBlock = false;
    lines.forEach((ln, i) => {
      const s = ln.trim();
      if (s.startsWith("/*")) inBlock = true;
      const isComment =
        inBlock || s.startsWith("//") || s.startsWith("*") || s.startsWith("import ");
      if (s.includes("*/")) inBlock = false;
      if (isComment) return;
      if (ATTR.test(ln)) violations.push(`${rel}:${i + 1} (literal aria/placeholder/title)`);
      else if (LABEL.test(ln)) violations.push(`${rel}:${i + 1} (literal header/label)`);
      else if (TR_DQ.test(ln) || TR_SQ.test(ln))
        violations.push(`${rel}:${i + 1} (gömülü TR metin)`);
    });
  }
  return violations;
}

describe("UI metni tek kaynak: strings.json (gömülü TR/UI string yasak)", () => {
  it("src/components ve src/views'te satır-içi UI metni yok", () => {
    const violations = scan();
    expect(violations).toEqual([]);
  });
});
