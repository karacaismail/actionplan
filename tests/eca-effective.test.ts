import { describe, expect, it } from "vitest";
import { effectiveRules, firedOutcomes, ruleEvents, simulate } from "@/lib/eca-effective";
import type { EcaRule, EcaRulesetPackage } from "@/schemas";

/**
 * Küme E test-önce çekirdeği — panel ECA görünürlük + simülasyonun saf-mantık tabanı.
 * Bu mantık React'tan bağımsızdır; simülasyon SALT-OKUNUR'dur (veri değiştirmez).
 */

const rule = (
  id: string,
  event: string,
  when: EcaRule["when"] = [],
  then: EcaRule["then"] = { type: "notify", params: {} },
  requiresApproval = false,
): EcaRule => ({ id, event, when, then, maxChainDepth: 6, requiresApproval });

const pkg = (id: string, layer: EcaRulesetPackage["layer"], clusters: string[], rules: EcaRule[]): EcaRulesetPackage => ({
  id,
  name: `paket-${id}`,
  description: "test paketi",
  layer,
  category: "notification",
  version: "1.0.0",
  params: [],
  rules,
  safety: { mutates: false, requiresApproval: false, aiCanModify: layer !== "system", maxChainDepth: 6 },
  appliesTo: { clusters, levels: [] },
});

const node = (cluster: string, ecaRules: EcaRule[]) => ({ id: "n1", ecaRules, source: { cluster } });

describe("eca-effective — etkili kural hesabı", () => {
  it("inline kuralları source=inline olarak döndürür", () => {
    const eff = effectiveRules(node("finance", [rule("r1", "task.status.changed")]), []);
    expect(eff).toHaveLength(1);
    expect(eff[0].source).toBe("inline");
    expect(eff[0].id).toBe("r1");
  });

  it("appliesTo.clusters boş paket TÜM kümelere uygulanır", () => {
    const catalog = [pkg("p-all", "platform", [], [rule("pr1", "task.created")])];
    const eff = effectiveRules(node("hr", []), catalog);
    expect(eff).toHaveLength(1);
    expect(eff[0].source).toBe("package");
    expect(eff[0].packageId).toBe("p-all");
    expect(eff[0].layer).toBe("platform");
  });

  it("kümesi eşleşmeyen paket uygulanmaz", () => {
    const catalog = [pkg("p-fin", "platform", ["finance"], [rule("pr1", "invoice.overdue")])];
    expect(effectiveRules(node("hr", []), catalog)).toHaveLength(0);
    expect(effectiveRules(node("finance", []), catalog)).toHaveLength(1);
  });

  it("inline + paket kurallarını birleştirir", () => {
    const catalog = [pkg("p-all", "system", [], [rule("pr1", "record.field.changed")])];
    const eff = effectiveRules(node("finance", [rule("r1", "task.status.changed")]), catalog);
    expect(eff.map((e) => e.source)).toEqual(["inline", "package"]);
  });

  it("ruleEvents benzersiz ve sıralı olay listesi verir", () => {
    const eff = effectiveRules(node("x", [rule("a", "b.event"), rule("b", "a.event"), rule("c", "b.event")]), []);
    expect(ruleEvents(eff)).toEqual(["a.event", "b.event"]);
  });
});

describe("eca-effective — simülasyon (salt-okunur dry-run)", () => {
  it("yalnız olayı eşleşen ve koşulu sağlanan kuralları tetikler", () => {
    const rules = effectiveRules(
      node("x", [
        rule("done", "task.status.changed", [{ field: "status", op: "eq", value: "done" }]),
        rule("blocked", "task.status.changed", [{ field: "status", op: "eq", value: "blocked" }]),
        rule("other", "task.created"),
      ]),
      [],
    );
    const fired = firedOutcomes(simulate(rules, "task.status.changed", { status: "done" }));
    expect(fired).toHaveLength(1);
    expect(fired[0].rule.id).toBe("done");
    expect(fired[0].result.fired).toBe(true);
  });

  it("eşleşme yoksa hiçbir kural tetiklenmez", () => {
    const rules = effectiveRules(node("x", [rule("done", "task.status.changed")]), []);
    expect(firedOutcomes(simulate(rules, "task.created", {}))).toHaveLength(0);
  });

  it("requiresApproval kuralı sonuçta onay-gerekir işaretini taşır", () => {
    const rules = effectiveRules(node("x", [rule("appr", "task.approved", [], { type: "set-field", params: {} }, true)]), []);
    const fired = firedOutcomes(simulate(rules, "task.approved", {}));
    expect(fired[0].result.requiresApproval).toBe(true);
  });

  it("simülasyon hiçbir mutasyon yapmaz (girdi kuralları değişmez)", () => {
    const inline = [rule("done", "task.status.changed", [{ field: "status", op: "eq", value: "done" }])];
    const frozen = JSON.stringify(inline);
    const rules = effectiveRules(node("x", inline), []);
    simulate(rules, "task.status.changed", { status: "done" });
    expect(JSON.stringify(inline)).toBe(frozen); // girdi dokunulmadı
  });
});
