// @vitest-environment jsdom
import architectureJson from "@/data/standards/architecture.json";
import { StandardContractSchema, TaskNodeSchema } from "@/schemas";
import * as TaskDetailModule from "@/views/TaskDetailView";
import { render, screen, within } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it } from "vitest";

const architecture = StandardContractSchema.parse(architectureJson);
const node = TaskNodeSchema.parse({
  id: "standard-panel-fixture",
  level: "feature",
  title: "Standard Panel Fixture",
  slug: "standard-panel-fixture",
  standardRefs: { architectureRef: architecture.id },
});

const StandardsRefsPanel = (
  TaskDetailModule as unknown as {
    StandardsRefsPanel?: ComponentType<{ node: typeof node }>;
  }
).StandardsRefsPanel;

describe("StandardsRefsPanel canonical contract details", () => {
  it("is an independently testable task-page panel", () => {
    expect(StandardsRefsPanel).toBeTypeOf("function");
  });

  it("renders resolved rule, severity, check and source details instead of name-only badges", () => {
    expect(StandardsRefsPanel).toBeTypeOf("function");
    if (!StandardsRefsPanel) return;

    render(<StandardsRefsPanel node={node} />);

    const panel = screen.getByTestId("standards-refs-panel");
    const firstRule = architecture.rules[0];
    expect(within(panel).getByText(architecture.name)).toBeInTheDocument();
    expect(within(panel).getByText(architecture.summary)).toBeInTheDocument();
    expect(within(panel).getByText(firstRule.id)).toBeInTheDocument();
    expect(within(panel).getByText(firstRule.rule)).toBeInTheDocument();
    expect(within(panel).getAllByText(firstRule.severity).length).toBeGreaterThan(0);
    expect(within(panel).getByText(firstRule.check)).toBeInTheDocument();
    expect(within(panel).getByText("src/data/standards/architecture.json")).toBeInTheDocument();
  });
});
