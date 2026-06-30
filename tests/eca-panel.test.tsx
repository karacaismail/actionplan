import { EcaPanel } from "@/components/eca/EcaPanel";
import type { TaskNode } from "@/schemas";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

/**
 * EcaPanel bileşen testi (Küme E) — render + SALT-OKUNUR simülasyon akışı.
 * Simülasyon artık açılır menü + tetikleyen ön-dolu senaryo ile CANLI çalışır (boş input/buton-tıklama yok).
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
  it("başlığı, simülasyon bölümünü ve zincir düğmesini gösterir", () => {
    render(<EcaPanel node={mockNode} />);
    expect(screen.getByText("ECA Otomasyon Kuralları")).toBeInTheDocument();
    expect(screen.getByText("Simülasyon")).toBeInTheDocument();
    expect(screen.getByText("Zincir Simüle Et")).toBeInTheDocument();
    // "veri değişmez" güvence etiketi her zaman görünür
    expect(screen.getByText(/veri değişmez/)).toBeInTheDocument();
  });

  it("inline kural kartını (olay) listeler", () => {
    render(<EcaPanel node={mockNode} />);
    // En az bir kural kartında olay adı görünür (inline + paket)
    expect(screen.getAllByText("task.status.changed").length).toBeGreaterThan(0);
  });

  it("ön-dolu tetikleyen senaryo kuralı CANLI tetikler (tıklama yok, salt-okunur)", () => {
    render(<EcaPanel node={mockNode} />);
    // Açılır menüler tetikleyen değerlerle ön-dolu → sonuç anında görünür.
    expect(screen.getByText(/kural tetiklenir/)).toBeInTheDocument();
  });
});
