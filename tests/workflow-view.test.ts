import { allWorkflows, outgoing, workflowsForNode } from "@/lib/workflow-view";
import type { WorkflowContract } from "@/schemas";
import { describe, expect, it } from "vitest";

/**
 * workflow-view (Küme E faz-2) — Surface/Workflow kataloğunu (Küme D) panelde görselleştirmek için
 * okuyan saf-mantık. Salt-okunur; durum makinesini değiştirmez.
 */

const wf = (id: string, archetypeRef: string): WorkflowContract => ({
  id,
  name: id,
  description: "test",
  version: "1.0.0",
  archetypeRef,
  states: ["a", "b", "c"],
  initial: "a",
  terminalStates: ["c"],
  transitions: [
    { from: "a", to: "b", on: "go", guard: "", action: "notify", requiresApproval: false },
    { from: "b", to: "c", on: "finish", guard: "", action: "set-field", requiresApproval: true },
  ],
  rulesetRefs: ["rs-status-notify"],
  approvals: [],
});

describe("workflow-view", () => {
  it("workflowsForNode düğüm id'siyle eşleşen workflow'ları döndürür", () => {
    const catalog = [wf("w1", "s-payroll"), wf("w2", "s-helpdesk")];
    expect(workflowsForNode("s-payroll", catalog).map((w) => w.id)).toEqual(["w1"]);
    expect(workflowsForNode("yok", catalog)).toHaveLength(0);
  });

  it("outgoing bir durumdan çıkan geçişleri verir", () => {
    const w = wf("w1", "x");
    expect(outgoing(w, "a").map((t) => t.to)).toEqual(["b"]);
    expect(outgoing(w, "c")).toHaveLength(0);
  });

  it("gerçek katalog en az 5 workflow içerir ve her birinin initial'ı states içindedir", () => {
    const all = allWorkflows();
    expect(all.length).toBeGreaterThanOrEqual(5);
    for (const w of all) expect(w.states).toContain(w.initial);
  });
});
