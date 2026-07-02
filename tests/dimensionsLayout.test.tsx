// @vitest-environment jsdom
import { TaskNodeSchema } from "@/schemas";
import { Dimensions } from "@/views/TaskDetailView";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

/**
 * KALICI YERLEŞİM KİLİDİ: boyut kartları 2-sütun GRID içinde olmalı (yan yana),
 * masonry/CSS-columns DEĞİL. CSS `columns` kartları dikey akıtıp tek-sütun gösteriyordu;
 * bu test bir daha o regresyonu (yan yana durmama) sessizce geçirmez.
 */
const node = TaskNodeSchema.parse({ id: "x-grid", level: "micro_step", title: "x", slug: "x" });

describe("boyut kartları yerleşimi — 2-sütun grid (yan yana)", () => {
  it("dimensions-grid GRID sınıfı taşır, columns(masonry) taşımaz", () => {
    const { getByTestId } = render(<Dimensions node={node} />);
    const grid = getByTestId("dimensions-grid");
    expect(grid.className).toMatch(/\bgrid\b/);
    expect(grid.className).toMatch(/md:grid-cols-2/);
    expect(grid.className).not.toMatch(/columns-/);
  });

  it("grid tam 17 boyut kartını doğrudan çocuk olarak render eder", () => {
    const { getByTestId } = render(<Dimensions node={node} />);
    expect(getByTestId("dimensions-grid").children.length).toBe(17);
  });
});
