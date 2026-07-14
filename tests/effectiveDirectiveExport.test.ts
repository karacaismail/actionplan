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
  it("isolates each source-owned directive from composite dimension items and prompts", () => {
    const node = byId.get("s-clm")!;
    const applications = effectiveDirectiveApplications(node, index);
    const sourceOwned = applications.filter((application) => application.ownerNodeId === node.id);
    const expectedCount = node.refs.filter((ref) => ref.startsWith("doc-apply:")).length;

    expect(sourceOwned).toHaveLength(expectedCount);
    for (const application of sourceOwned) {
      expect(application.mode).toBe("direct");
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

  it("preserves every descendant owner alongside the typed app's own source ownership", () => {
    const app = byId.get("s-crm")!;
    const expectedOwners = [app, ...getDescendants(nodes, app.id)]
      .filter((node) => node.refs.some((ref) => ref.startsWith("doc-apply:ready-for-dev: ")))
      .map((node) => node.id)
      .sort();
    const actualOwners = effectiveDirectiveApplications(app, index)
      .filter((application) => application.ruleId === "ready-for-dev")
      .map((application) => application.ownerNodeId)
      .sort();

    expect(expectedOwners.length).toBeGreaterThan(1);
    expect(actualOwners).toEqual(expectedOwners);
    expect(actualOwners).toContain("s-crm-core");
    expect(actualOwners).toContain("m-crm-sales");

    const applications = effectiveDirectiveApplications(app, index).filter(
      (application) => application.ruleId === "ready-for-dev",
    );
    expect(applications.find((application) => application.ownerNodeId === "s-crm")?.mode).toBe(
      "direct",
    );
    expect(applications.find((application) => application.ownerNodeId === "s-crm-core")?.mode).toBe(
      "inherited",
    );
    expect(
      applications.find((application) => application.ownerNodeId === "m-crm-sales")?.mode,
    ).toBe("inherited");
  });

  it("gives protected roll-up leaves a virtual global directive without raw materialization", () => {
    for (const nodeId of ["cc-a11y-backend", "cc-cultural-ux"]) {
      const node = byId.get(nodeId)!;
      const before = JSON.stringify(node);

      expect(node.artifactKind).toBe("platform-foundation");
      expect(node.refs.some((ref) => ref.startsWith("doc-apply:"))).toBe(false);
      expect(before).not.toContain("[DOC-APPLY:");

      const applications = effectiveDirectiveApplications(node, index);
      expect(applications.length, nodeId).toBeGreaterThan(0);
      expect(
        applications.every((application) => application.mode === "virtual"),
        nodeId,
      ).toBe(true);
      expect(
        applications.every((application) => application.ownerNodeId === nodeId),
        nodeId,
      ).toBe(true);
      expect(JSON.stringify(node)).toBe(before);
    }
  });

  it("exports resolved directives without stripping typed app contracts or materialized JSON clauses", () => {
    const direct = byId.get("s-clm")!;
    const directExport = JSON.parse(exportTask(direct, index));
    expect(directExport.resolvedDirectives).toEqual(effectiveDirectiveApplications(direct, index));

    const typedApp = byId.get("s-crm")!;
    const typedAppExport = JSON.parse(exportTask(typedApp, index));
    expect(JSON.stringify(typedAppExport.task)).toContain("[DOC-APPLY:");
    expect(JSON.stringify(typedAppExport.task)).toContain('"doc-apply:');
    expect(typedAppExport.task.appDefinition).toEqual(typedApp.appDefinition);
    expect(typedAppExport.task.deliveryContext).toEqual(typedApp.deliveryContext);
    expect(typedAppExport.resolvedDirectives.length).toBeGreaterThan(0);
    expect(typedAppExport.resolvedDirectives).toEqual(
      effectiveDirectiveApplications(typedApp, index),
    );
    expect(
      typedAppExport.resolvedDirectives.some(
        (application: { ownerNodeId: string }) => application.ownerNodeId === "tas-crm-lead-mgmt",
      ),
    ).toBe(true);
  });

  it("exports a non-empty resolved-directive sidecar for all 617 JSON-backed pages", () => {
    const before = JSON.stringify(nodes);
    const exported = JSON.parse(exportJSON(nodes));

    expect(Object.keys(exported.resolvedDirectivesByNode)).toHaveLength(617);
    for (const node of nodes) {
      expect(exported.resolvedDirectivesByNode[node.id].length, node.id).toBeGreaterThan(0);
    }
    expect(JSON.stringify(nodes)).toBe(before);
  });

  it("puts every source-owned and inherited directive into agent prompts without internal markers", () => {
    for (const nodeId of ["s-clm", "s-crm"]) {
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
