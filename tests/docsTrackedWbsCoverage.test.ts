import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "..");
const NODES_DIR = path.join(ROOT, "src/data/generated/nodes");
const DOCS_HUB_SEMANTIC_REFS = new Set([
  "adr: docs/adr-0027-engineering-standards.md",
  "docs/icerik-kalite-sozlesmesi.md",
  "docs/prompt-template-library.md",
  "docs/PENDING-HUMAN-FIXES-2026-07-01.md",
  "docs/README.md",
  "docs/docs-json-integration-full-report-2026-07-13.md",
  "docs/drafts/README.md",
  "docs/historical-gap-report-freshness-gap-report-2026-07-08.md",
  "docs/standards/00-standards-index.md",
  "docs/standards/numeronym-siniflandirma.md",
]);
const HUMAN_OWNER_DECISION_REFS = new Set([
  "decision: docs/archetype-venture-core-directive.md",
  "decision: docs/drafts/k-kms-directive.md",
  "decision: docs/k-evidence-seal-directive.md",
  "decision: docs/k-kms-directive.md",
  "decision: docs/k-legal-hold-retention-directive.md",
  "decision: docs/k-migration-bridge-directive.md",
  "decision: docs/k-obligation-commitment-directive.md",
  "decision: docs/k-provider-adapter-directive.md",
  "decision: docs/k-signature-trust-directive.md",
  "decision: docs/reference/Arsam-Girisim-Yonetim-Gereksinim-Analizi.md",
]);

function trackedMarkdownDocs(): string[] {
  const output = execFileSync("git", ["ls-files", "docs/*.md", "docs/**/*.md"], {
    cwd: ROOT,
    encoding: "utf8",
  });

  return [...new Set(output.split("\n").filter(Boolean))].sort();
}

function refTargetsDoc(ref: string, docPath: string): boolean {
  const escapedPath = docPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[\\s:])${escapedPath}(?=$|[#\\s,)])`).test(ref);
}

describe("tracked docs WBS refs coverage", () => {
  it("her izlenen Markdown belgesini en az bir kanonik WBS düğümünden erişilebilir kılar", () => {
    const nodes = fs
      .readdirSync(NODES_DIR)
      .filter((file) => file.endsWith(".json"))
      .map((file) => JSON.parse(fs.readFileSync(path.join(NODES_DIR, file), "utf8"))) as Array<{
      id: string;
      refs?: string[];
    }>;

    const missing = trackedMarkdownDocs().filter(
      (docPath) =>
        !nodes.some((node) =>
          (node.refs ?? []).some((ref) => typeof ref === "string" && refTargetsDoc(ref, docPath)),
        ),
    );

    expect(missing, `WBS refs[] kapsamı olmayan docs:\n${missing.join("\n")}`).toEqual([]);
  });

  it("docs hub fallback bağlarını semantik sahiplikten catalog önekiyle ayırır", () => {
    const docsHub = JSON.parse(fs.readFileSync(path.join(NODES_DIR, "std-docs.json"), "utf8")) as {
      refs?: string[];
    };
    const unclassified = (docsHub.refs ?? []).filter(
      (ref) =>
        ref.includes("docs/") &&
        !DOCS_HUB_SEMANTIC_REFS.has(ref) &&
        !ref.startsWith("catalog: ") &&
        !ref.startsWith("decision: "),
    );

    expect(
      unclassified,
      `catalog öneki olmayan fallback refs:\n${unclassified.join("\n")}`,
    ).toEqual([]);
    expect(docsHub.refs).toEqual(expect.arrayContaining([...DOCS_HUB_SEMANTIC_REFS]));
    expect((docsHub.refs ?? []).filter((ref) => ref.startsWith("decision: ")).sort()).toEqual(
      [...HUMAN_OWNER_DECISION_REFS].sort(),
    );
  });

  it("refs içindeki Markdown yolunu substring yerine tam path sınırıyla eşler", () => {
    expect(refTargetsDoc("catalog: docs/example.md", "docs/example.md")).toBe(true);
    expect(refTargetsDoc("adr: docs/example.md#decision", "docs/example.md")).toBe(true);
    expect(refTargetsDoc("docs/example.md.backup", "docs/example.md")).toBe(false);
    expect(refTargetsDoc("docs/example.md-extra.md", "docs/example.md")).toBe(false);
  });
});
