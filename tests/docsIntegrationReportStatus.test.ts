import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "..");
const REPORT = fs.readFileSync(
  path.join(ROOT, "docs/docs-json-integration-full-report-2026-07-13.md"),
  "utf8",
);
const APP_CATALOG = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/data/app-catalog-decisions.json"), "utf8"),
) as { sourceSnapshot: { expectedNodeCount: number } };
const META = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/data/generated/meta.json"), "utf8"),
) as { counts: { total: number; byArtifactKind?: Record<string, number> } };
const CLASSIFICATION = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/data/doc-task-content-classification.json"), "utf8"),
) as Array<{ decision: "task-materialize" | "human-decision" | "reference-only" }>;
const STANDARD_COUNT = fs
  .readdirSync(path.join(ROOT, "src/data/standards"))
  .filter((file) => file.endsWith(".json")).length;

describe("docs JSON integration report current status", () => {
  it("kaynak snapshot ile materialized WBS kapsamını birbirine karıştırmadan açıklar", () => {
    expect(APP_CATALOG.sourceSnapshot.expectedNodeCount).toBe(496);
    expect(META.counts.total).toBe(617);
    expect(META.counts.byArtifactKind?.["legacy-alias"]).toBe(5);
    expect(STANDARD_COUNT).toBe(38);
    expect(CLASSIFICATION).toHaveLength(292);
    expect(CLASSIFICATION.filter((entry) => entry.decision === "task-materialize")).toHaveLength(
      218,
    );
    expect(CLASSIFICATION.filter((entry) => entry.decision === "human-decision")).toHaveLength(10);
    expect(CLASSIFICATION.filter((entry) => entry.decision === "reference-only")).toHaveLength(64);

    expect(REPORT).toContain("**Durum:** UYGULANDI");
    expect(REPORT).toContain("| Entegrasyon sınıflandırmasındaki Markdown kaynağı | 292 |");
    expect(REPORT).toContain("| Task içeriğine materyalize edilen | 218 |");
    expect(REPORT).toContain("| İnsan sahiplik kararı bekleyen | 10 |");
    expect(REPORT).toContain("| Canonical standard / arşiv / kök indeks kaynağı | 64 |");
    expect(REPORT).toContain("| Sınıfsız / erişilemeyen | 0 |");
    expect(REPORT).toContain("| App kimlik kaynak snapshot'ı | 496 |");
    expect(REPORT).toContain("| Materialized fiziksel WBS JSON'u / görev sayfası | 617 |");
    expect(REPORT).toContain("| Aktif WBS kaydı (legacy alias hariç) | 612 |");
    expect(REPORT).toContain("| Legacy alias / yönlendirme kaydı | 5 |");
    expect(REPORT).toContain("| Canonical standard sözleşmesi | 38 |");
    expect(REPORT).toContain("496 düğümlük kaynak snapshot'ın tarihsel");
    expect(REPORT).toContain("617/617 materialized sayfa");
    expect(REPORT).toContain("`catalog:`");
    expect(REPORT).toContain("`decision:`");
  });
});
