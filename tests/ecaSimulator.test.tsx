// @vitest-environment jsdom
import { EcaSimulator } from "@/components/eca/EcaPanel";
import type { EcaRule } from "@/schemas";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

/**
 * ECA simülatörü KALICI UX kilidi: koşul alanları SERBEST METİN KUTUSU değil AÇILIR MENÜ (select)
 * olmalı ve tetikleyen gerçekçi senaryoyla ÖN-DOLU gelmeli → sonuç anında görünür ("çalışmıyor" regresyonu).
 */
const rule = {
  id: "r-ai-deny",
  event: "agent.action.requested",
  when: [
    { field: "action", op: "in", value: ["generate-app", "override-ruleset"] },
    { field: "actor", op: "eq", value: "ai" },
  ],
  then: { type: "deny", params: { reason: "AI app/module üretemez" } },
  requiresApproval: false,
  maxChainDepth: 6,
} as unknown as EcaRule;
const rules = [{ ...rule, source: "inline" as const }];

describe("ECA simülatörü — açılır menü + ön-dolu tetikleyen senaryo", () => {
  it("koşul alanları select (combobox); en az 3 menü (olay+action+actor)", () => {
    const { getAllByRole, queryAllByRole } = render(<EcaSimulator rules={rules} />);
    expect(getAllByRole("combobox").length).toBeGreaterThanOrEqual(3);
    expect(queryAllByRole("textbox").length).toBe(0); // serbest metin kutusu YOK
  });

  it("ön-dolu senaryo bir kuralı TETİKLER → sonuç (Reddedilir) anında görünür", () => {
    const { getByText } = render(<EcaSimulator rules={rules} />);
    expect(getByText(/Reddedilir/)).toBeTruthy();
  });
});
