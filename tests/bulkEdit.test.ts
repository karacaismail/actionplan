import { applyBulk, sanitizeBulkPatch } from "@/engine";
import { type TaskNode, TaskNodeSchema } from "@/schemas";
import { describe, expect, it } from "vitest";

const node = (p: Partial<TaskNode> & { id: string }): TaskNode =>
  TaskNodeSchema.parse({ level: "atom", title: p.id, slug: p.id, ...p });

const nodes: TaskNode[] = [node({ id: "a", status: "todo" }), node({ id: "b", status: "todo" }), node({ id: "c", status: "todo" })];

describe("toplu düzenleme (applyBulk)", () => {
  it("yalnız seçili id'leri yamalar", () => {
    const out = applyBulk(nodes, ["a", "c"], { status: "done" });
    expect(out.find((n) => n.id === "a")?.status).toBe("done");
    expect(out.find((n) => n.id === "c")?.status).toBe("done");
    expect(out.find((n) => n.id === "b")?.status).toBe("todo");
  });

  it("beyaz-liste dışı alanları yok sayar (audit/dimensions korunur)", () => {
    const dirty = { status: "review", progress: 99 } as unknown as Parameters<typeof sanitizeBulkPatch>[0];
    const safe = sanitizeBulkPatch(dirty);
    expect(safe.status).toBe("review");
    expect("progress" in safe).toBe(false);
  });

  it("boş yama → düğümler değişmez (aynı referans)", () => {
    expect(applyBulk(nodes, ["a"], {})).toBe(nodes);
  });

  it("çoklu atama (assignees) toplu set edilir", () => {
    const out = applyBulk(nodes, ["b"], { assignees: ["crm-ekibi", "qa-ekibi"] });
    expect(out.find((n) => n.id === "b")?.assignees).toEqual(["crm-ekibi", "qa-ekibi"]);
  });
});
