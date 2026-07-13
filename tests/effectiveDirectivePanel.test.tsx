import { EffectiveDirectivePanel } from "@/components/task-contract/EffectiveDirectivePanel";
import { indexById } from "@/engine/resolve";
import { TaskNodeSchema } from "@/schemas";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("EffectiveDirectivePanel", () => {
  it("shows JSON-backed virtual directive content and prompt on a protected module page", () => {
    const node = TaskNodeSchema.parse({
      id: "protected-module",
      level: "module",
      title: "Korunan Modül",
      slug: "protected-module",
    });
    render(<EffectiveDirectivePanel node={node} index={indexById([node])} />);

    expect(screen.getByTestId("effective-directive-panel")).toBeInTheDocument();
    expect(screen.getAllByText(/docs\/task-to-code-contract\.md/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Korunan Modül/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Görev promptu/).length).toBeGreaterThan(0);
  });
});
