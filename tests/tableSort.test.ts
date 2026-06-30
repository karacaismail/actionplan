import { sortNodes } from "@/engine";
import { type TaskNode, TaskNodeSchema } from "@/schemas";
import { describe, expect, it } from "vitest";

/**
 * Tablo wbsCode sıralaması DOĞAL (numeric-aware) olmalı: "2" < "10", "1.2" < "1.10".
 * Eski hâli metin sıralıyordu → kümeler 1,10,11,…,2 gibi karışıyor (ve Kernel doğru görünmüyordu).
 */
const node = (id: string, wbsCode: string): TaskNode =>
  TaskNodeSchema.parse({ id, level: "app", title: id, slug: id, wbsCode });

describe("tablo wbsCode doğal sıralama", () => {
  it("kök kümeler sayısal sırada (2 < 10, 1 ilk)", () => {
    const nodes = [node("a", "10"), node("b", "2"), node("c", "1"), node("d", "17")];
    const sorted = sortNodes(nodes, "wbsCode", "asc", () => 0);
    expect(sorted.map((n) => n.wbsCode)).toEqual(["1", "2", "10", "17"]);
  });

  it("alt-öğeler de doğal: 1.2 < 1.10", () => {
    const nodes = [node("a", "1.10"), node("b", "1.2"), node("c", "1.1")];
    const sorted = sortNodes(nodes, "wbsCode", "asc", () => 0);
    expect(sorted.map((n) => n.wbsCode)).toEqual(["1.1", "1.2", "1.10"]);
  });
});
