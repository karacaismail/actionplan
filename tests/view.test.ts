import people from "@/data/people.json";
import { PeopleArraySchema, SavedViewSchema, TaskNodeSchema } from "@/schemas";
import { loadSavedViews, loadViewState, saveSavedViews, saveViewState } from "@/store/viewState";
import { beforeEach, describe, expect, it } from "vitest";

describe("Faz 0 — şema + görünüm kalıcılığı", () => {
  beforeEach(() => {
    saveSavedViews([]);
  });

  it("people.json şemaya uyar; id benzersiz; kapasite ≥ 0", () => {
    const parsed = PeopleArraySchema.parse(people);
    const ids = parsed.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(parsed.every((p) => p.capacityPerDay >= 0)).toBe(true);
  });

  it("TaskNode.assignees default [] + schedule.baseline null (geriye uyumlu)", () => {
    const n = TaskNodeSchema.parse({ id: "x", level: "atom", title: "X", slug: "x" });
    expect(n.assignees).toEqual([]);
    expect(n.schedule.baselineStart).toBeNull();
    expect(n.schedule.baselineEnd).toBeNull();
  });

  it("SavedView validate + default'lar", () => {
    const v = SavedViewSchema.parse({ id: "v1", name: "Bitenler", query: "status = done" });
    expect(v.query).toBe("status = done");
    expect(v.columns).toEqual([]);
    expect(v.group).toBeNull();
  });

  it("savedViews + viewState round-trip (localStorage)", () => {
    saveSavedViews([{ id: "v1", name: "X", query: "level = app", columns: ["title"], sort: [], group: null, createdAt: "" }]);
    expect(loadSavedViews()).toHaveLength(1);
    expect(loadSavedViews()[0].query).toBe("level = app");
    saveViewState({ query: "status = done" });
    expect(loadViewState().query).toBe("status = done");
  });
});
