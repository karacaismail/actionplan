import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "..");
const PUBLIC_NODES = JSON.parse(
  fs.readFileSync(path.join(ROOT, "public/data/nodes.json"), "utf8"),
) as Array<{ id: string; refs?: string[] }>;

const DOC_NODE_REFS: Record<string, string[]> = {
  "docs/adr-A1-actor-party.md": ["k-party", "k-actor"],
  "docs/adr-A2-capability.md": ["k-capability"],
  "docs/adr-A3-mode-profile.md": ["k-mode"],
  "docs/adr-A4-computation.md": ["k-computation"],
  "docs/adr-K1-kernel-kimlik.md": ["k-schema", "app-kernel"],
  "docs/adr-P1-pdp.md": ["k-policy-pdp"],
  "docs/adr-0026-tech-profiles.md": ["fe-eng-standards"],
  "docs/adr-0028-olculu-kisa-taslak.md": ["app-kararlar"],
  "docs/capability-entitlement-contract.md": ["k-capability"],
  "docs/pdp-policy-contract.md": ["k-policy-pdp"],
};

describe("DOC-NODE-REF-1 kanonik belgeler mevcut WBS düğümlerinden erişilebilir", () => {
  for (const [docPath, nodeIds] of Object.entries(DOC_NODE_REFS)) {
    it(`${docPath} -> ${nodeIds.join(", ")}`, () => {
      expect(fs.existsSync(path.join(ROOT, docPath)), `doküman yok: ${docPath}`).toBe(true);

      for (const nodeId of nodeIds) {
        const nodePath = path.join(ROOT, "src/data/generated/nodes", `${nodeId}.json`);
        const node = JSON.parse(fs.readFileSync(nodePath, "utf8")) as { refs?: string[] };
        const linked = (node.refs ?? []).some((ref) => ref.includes(docPath));
        expect(linked, `${nodeId}: refs[] içinde ${docPath} yok`).toBe(true);

        const publicNode = PUBLIC_NODES.find((candidate) => candidate.id === nodeId);
        expect(publicNode, `public/data/nodes.json içinde ${nodeId} yok`).toBeDefined();
        expect(publicNode?.refs, `${nodeId}: public refs canonical refs ile eşleşmiyor`).toEqual(
          node.refs ?? [],
        );
      }
    });
  }

  it("public node refs kanonik 496 düğümle eşleşir", () => {
    const nodesDir = path.join(ROOT, "src/data/generated/nodes");
    const canonicalNodes = fs
      .readdirSync(nodesDir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => JSON.parse(fs.readFileSync(path.join(nodesDir, file), "utf8"))) as Array<{
      id: string;
      refs?: string[];
    }>;

    expect(PUBLIC_NODES).toHaveLength(canonicalNodes.length);
    for (const node of canonicalNodes) {
      const publicNode = PUBLIC_NODES.find((candidate) => candidate.id === node.id);
      expect(publicNode?.refs, `${node.id}: public refs canonical refs ile eşleşmiyor`).toEqual(
        node.refs ?? [],
      );
    }
  });
});
