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
});
