import fs from "node:fs";
import path from "node:path";
import { exportAgentPrompt, exportJSON, exportTask, getDescendants, indexById } from "@/engine";
import { effectiveDirectiveApplications } from "@/engine/effectiveDirectives";
import type { TaskNode } from "@/schemas";
import { describe, expect, it } from "vitest";

const NODE_DIR = path.join(process.cwd(), "src/data/generated/nodes");
const nodes = fs
  .readdirSync(NODE_DIR)
  .filter((file) => file.endsWith(".json"))
  .map((file) => JSON.parse(fs.readFileSync(path.join(NODE_DIR, file), "utf8")) as TaskNode);
const index = indexById(nodes);
const byId = new Map(nodes.map((node) => [node.id, node]));

const openingMarkers = (value: string) =>
  [...value.matchAll(/(?<!\/)\[DOC-APPLY:([^\]]+)\]/g)].map((match) => match[1]);

describe("effective document directives in JSON and prompt exports", () => {
  it("isolates each direct source from composite dimension items and prompts", () => {
    const node = byId.get("s-clm")!;
    const applications = effectiveDirectiveApplications(node, index);
    const expectedCount = node.refs.filter((ref) => ref.startsWith("doc-apply:")).length;

    expect(applications).toHaveLength(expectedCount);
    for (const application of applications) {
      expect(openingMarkers(application.item), `${application.ruleId}.item`).toEqual([
        application.ruleId,
      ]);
      expect(openingMarkers(application.prompt), `${application.ruleId}.prompt`).toEqual([
        application.ruleId,
      ]);
      expect(application.prompt).toContain(`Kaynak: ${application.source}`);
      expect(application.prompt).toContain(`[/DOC-APPLY:${application.ruleId}]`);
    }
  });

  it("preserves every descendant owner instead of keeping one arbitrary inherited owner", () => {
    const app = byId.get("app-customer-revenue")!;
    const expectedOwners = getDescendants(nodes, app.id)
      .filter((node) => node.refs.some((ref) => ref.startsWith("doc-apply:ready-for-dev: ")))
      .map((node) => node.id)
      .sort();
    const actualOwners = effectiveDirectiveApplications(app, index)
      .filter((application) => application.ruleId === "ready-for-dev")
      .map((application) => application.ownerNodeId)
      .sort();

    expect(expectedOwners.length).toBeGreaterThan(1);
    expect(actualOwners).toEqual(expectedOwners);
  });

  it("adds exact resolved directives to direct and protected single-task JSON exports", () => {
    const direct = byId.get("s-clm")!;
    const directExport = JSON.parse(exportTask(direct, index));
    expect(directExport.resolvedDirectives).toEqual(effectiveDirectiveApplications(direct, index));

    const protectedNode = byId.get("app-customer-revenue")!;
    const protectedExport = JSON.parse(exportTask(protectedNode, index));
    expect(JSON.stringify(protectedExport.task)).not.toContain("[DOC-APPLY:");
    expect(JSON.stringify(protectedExport.task)).not.toContain('"doc-apply:');
    expect(protectedExport.resolvedDirectives.length).toBeGreaterThan(0);
    expect(protectedExport.resolvedDirectives).toEqual(
      effectiveDirectiveApplications(protectedNode, index),
    );
    expect(
      protectedExport.resolvedDirectives.some(
        (application: { ownerNodeId: string }) => application.ownerNodeId === "s-clm",
      ),
    ).toBe(true);
  });

  it("exports a non-empty resolved-directive sidecar for all 496 JSON-backed pages", () => {
    const before = JSON.stringify(nodes);
    const exported = JSON.parse(exportJSON(nodes));

    expect(Object.keys(exported.resolvedDirectivesByNode)).toHaveLength(496);
    for (const node of nodes) {
      expect(exported.resolvedDirectivesByNode[node.id].length, node.id).toBeGreaterThan(0);
    }
    expect(JSON.stringify(nodes)).toBe(before);
  });

  it("puts every exact directive into direct and protected agent prompts without internal markers", () => {
    for (const nodeId of ["s-clm", "app-customer-revenue"]) {
      const node = byId.get(nodeId)!;
      const applications = effectiveDirectiveApplications(node, index);
      const prompt = exportAgentPrompt(node, index);

      expect(prompt).toContain("Resolved Document Directives — From JSON");
      expect(prompt).not.toContain("[DOC-APPLY:");
      for (const application of applications) {
        expect(prompt, `${nodeId}/${application.ruleId}`).toContain(application.ruleId);
        expect(prompt, `${nodeId}/${application.ruleId}`).toContain(application.source);
        expect(prompt, `${nodeId}/${application.ruleId}`).toContain(application.ownerNodeId);
      }
    }
  });
});
