import { EcaPanel } from "@/components/eca/EcaPanel";
import type { TaskNode } from "@/schemas";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

/**
 * EcaPanel bileşen testi (Küme E) — render + SALT-OKUNUR simülasyon akışı.
 * Gerçek ruleset kataloğunu (Küme C) kullanır; düğüm kümesine uyan paket kuralları da görünür.
 */

const mockNode = {
  id: "n1",
  title: "Test Düğümü",
  source: { cluster: "x", corpus: "merged", originalId: "", granularity: "" },
  ecaRules: [
    {
      id: "done",
      event: "task.status.changed",
      when: [{ field: "status", op: "eq", value: "done" }],
      then: { type: "notify", params: { target: "owner" } },
      maxChainDepth: 6,
      requiresApproval: false,
    },
  ],
} as unknown as TaskNode;

describe("EcaPanel", () => {
  it("başlığı, kural sayısını ve simülasyon düğmesini gösterir", () => {
    render(<EcaPanel node={mockNode} />);
    expect(screen.getByText("ECA Otomasyon Kuralları")).toBeInTheDocument();
    expect(screen.getByText("Simüle Et")).toBeInTheDocument();
    // "veri değişmez" güvence etiketi her zaman görünür
    expect(screen.getByText(/veri değişmez/)).toBeInTheDocument();
  });

  it("inline kural kartını (olay) listeler", () => {
    render(<EcaPanel node={mockNode} />);
    // En az bir kural kartında olay adı görünür (inline + paket)
    expect(screen.getAllByText("task.status.changed").length).toBeGreaterThan(0);
  });

  it("simülasyon eşleşen olayda kuralı tetikler (salt-okunur)", () => {
    render(<EcaPanel node={mockNode} />);
    fireEvent.change(screen.getByLabelText("Simüle edilecek olay"), {
      target: { value: "task.status.changed" },
    });
    fireEvent.change(screen.getByLabelText("bağlam: status"), { target: { value: "done" } });
    fireEvent.click(screen.getByText("Simüle Et"));
    expect(screen.getByText(/kural tetiklenir/)).toBeInTheDocument();
  });
});
