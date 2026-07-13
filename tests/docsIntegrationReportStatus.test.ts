import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "..");
const REPORT = fs.readFileSync(
  path.join(ROOT, "docs/docs-json-integration-full-report-2026-07-13.md"),
  "utf8",
);

describe("docs JSON integration report current status", () => {
  it("uygulanan WBS kapsamını ve insan-sahip karar kuyruğunu güncel sayılarla açıklar", () => {
    expect(REPORT).toContain("**Durum:** UYGULANDI");
    expect(REPORT).toContain("| Git tarafından izlenen Markdown | 290 |");
    expect(REPORT).toContain("| Task içeriğine materyalize edilen | 218 |");
    expect(REPORT).toContain("| İnsan sahiplik kararı bekleyen | 10 |");
    expect(REPORT).toContain("| Canonical standard / arşiv / kök indeks kaynağı | 62 |");
    expect(REPORT).toContain("| Sınıfsız / erişilemeyen | 0 |");
    expect(REPORT).toContain("| WBS düğümü / görev sayfası | 496 |");
    expect(REPORT).toContain("| Görev uygulaması (items + prompt) | 2.426 |");
    expect(REPORT).toContain("| Runtime direct rule×task eşliği | 2.426/2.426 |");
    expect(REPORT).toContain("`catalog:`");
    expect(REPORT).toContain("`decision:`");
  });
});
