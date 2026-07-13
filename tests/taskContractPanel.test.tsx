// @vitest-environment jsdom
import { TaskContractPanel, docsLink } from "@/components/task-contract/TaskContractPanel";
import { TaskNodeSchema } from "@/schemas";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

const node = TaskNodeSchema.parse({
  id: "contract-panel-fixture",
  level: "feature",
  title: "Contract Panel Fixture",
  slug: "contract-panel-fixture",
  deliverables: ["[DOC-APPLY:task-handoff] Somut teslimat"],
  acceptanceCriteria: ["[DOC-APPLY:ready-for-dev] Ölçülebilir kabul"],
  phases: {
    requirements: {
      status: "pending",
      passed: false,
      notes: "Karar notu",
      criteria: ["[DOC-APPLY:evidence-dod] Gereksinim çıkış kriteri"],
    },
  },
  risks: [
    {
      id: "risk-1",
      desc: "[DOC-APPLY:high-risk-dod] Somut risk",
      severity: "high",
      mitigation: "Somut azaltım",
    },
  ],
  rollback: "Geri alma ve doğrulama adımı",
  evidence: ["evidence://fixture"],
  refs: [
    "decision: docs/reference/example.md#karar (Wave 0-4)",
    "doc-apply:task-handoff: docs/task-to-code-contract.md",
    "kaynak-korpus: fixture",
  ],
});

describe("TaskContractPanel", () => {
  it("renders deliverables, acceptance, phase criteria, risks, rollback and evidence", () => {
    render(<TaskContractPanel node={node} />);

    const panel = screen.getByTestId("task-contract-panel");
    for (const text of [
      "Somut teslimat",
      "Ölçülebilir kabul",
      "Gereksinim çıkış kriteri",
      "Karar notu",
      "Somut risk",
      "Somut azaltım",
      "Geri alma ve doğrulama adımı",
      "evidence://fixture",
    ]) {
      expect(within(panel).getByText(text)).toBeInTheDocument();
    }
    expect(panel).not.toHaveTextContent("[DOC-APPLY:");
  });

  it("turns Markdown refs into Docs routes without hiding provenance context", () => {
    render(<TaskContractPanel node={node} />);
    expect(screen.getByRole("link", { name: "docs/reference/example.md" })).toHaveAttribute(
      "href",
      "/docs/reference--example#karar",
    );
    expect(screen.getByText(/decision:/)).toBeInTheDocument();
    expect(screen.getByText(/#karar \(Wave 0-4\)/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "docs/task-to-code-contract.md" })).toHaveAttribute(
      "href",
      "/docs/task-to-code-contract",
    );
    expect(screen.queryByText(/doc-apply:task-handoff:/)).not.toBeInTheDocument();
    expect(screen.getByText("kaynak-korpus: fixture")).toBeInTheDocument();
  });

  it("builds links under the configured GitHub Pages base path", () => {
    expect(docsLink("docs/reference/example.md", "/actionplan/")?.href).toBe(
      "/actionplan/docs/reference--example",
    );
    expect(docsLink("notdocs/reference/example.md", "/actionplan/")).toBeNull();
  });
});
