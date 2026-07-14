import { type TaskNode, TaskNodeSchema } from "@/schemas";
import {
  applyOverrides,
  clearOverrides,
  hasOverrides,
  loadOverrides,
  saveOverrides,
} from "@/store/persist";
import { beforeEach, describe, expect, it } from "vitest";

const node = (id: string, patch: Partial<TaskNode> = {}): TaskNode =>
  TaskNodeSchema.parse({ id, level: "micro_step", title: id.toUpperCase(), slug: id, ...patch });

describe("browser-storage kalıcılık (override)", () => {
  beforeEach(() => clearOverrides());

  it("save → load round-trip ve hasOverrides", () => {
    expect(hasOverrides()).toBe(false);
    const a = node("a", { status: "done" });
    expect(saveOverrides({ a })).toBe(true);
    expect(hasOverrides()).toBe(true);
    expect(loadOverrides().a.status).toBe("done");
  });

  it("clear override'ları siler", () => {
    saveOverrides({ a: node("a") });
    clearOverrides();
    expect(hasOverrides()).toBe(false);
    expect(loadOverrides()).toEqual({});
  });

  it("applyOverrides taban düğümün üzerine biner", () => {
    const base = [node("a", { status: "todo" }), node("b")];
    const overridden = node("a", { status: "done", owner: "alice" });
    const merged = applyOverrides(base, { a: overridden });
    expect(merged.find((n) => n.id === "a")?.status).toBe("done");
    expect(merged.find((n) => n.id === "a")?.owner).toBe("alice");
    expect(merged.find((n) => n.id === "b")?.status).toBe("backlog");
  });

  it("override taban dışı id'yi ekler", () => {
    const merged = applyOverrides([node("a")], { c: node("c") });
    expect(merged.map((n) => n.id).sort()).toEqual(["a", "c"]);
  });

  it("eski override yeni kanonik app/module teslimat alanlarını düşüremez", () => {
    const appDefinition = { contract: "canonical-app" } as unknown as TaskNode["appDefinition"];
    const moduleDefinition = {
      contract: "canonical-module",
    } as unknown as TaskNode["moduleDefinition"];
    const deliveryContext = {
      contract: "canonical-delivery",
    } as unknown as TaskNode["deliveryContext"];
    const kernelIntegration = {
      role: "not-applicable",
      reason: "Canonical Kernel integration decision belongs to the base dataset.",
    } as TaskNode["kernelIntegration"];
    const base = {
      ...node("a", { status: "todo" }),
      artifactKind: "sellable-app",
      canonicalId: "canonical-a",
      appDefinition,
      moduleDefinition,
      deliveryContext,
      kernelIntegration,
    } as unknown as TaskNode;
    const staleOverride = node("a", { status: "done", owner: "alice" });

    const [merged] = applyOverrides([base], { a: staleOverride });

    expect(merged.status).toBe("done");
    expect(merged.owner).toBe("alice");
    expect(merged.artifactKind).toBe("sellable-app");
    expect(merged.canonicalId).toBe("canonical-a");
    expect(merged.appDefinition).toBe(appDefinition);
    expect(merged.moduleDefinition).toBe(moduleDefinition);
    expect(merged.deliveryContext).toBe(deliveryContext);
    expect(merged.kernelIntegration).toBe(kernelIntegration);
  });
});
