import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildTree,
  computeCriticalPath,
  evaluateAgentPolicy,
  evaluateEca,
  exportCSV,
  exportJSON,
  exportTask,
  getAncestors,
  importCSV,
  importJSON,
  indexById,
} from "@/engine";
import {
  AgentPolicySchema,
  EcaRuleSchema,
  type TaskNode,
  TaskNodeArraySchema,
  TaskNodeSchema,
} from "@/schemas";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const generatedNodesDir = path.resolve(__dirname, "../src/data/generated/nodes");

function loadGeneratedNodes(): TaskNode[] {
  const nodes = fs
    .readdirSync(generatedNodesDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(generatedNodesDir, f), "utf8")));
  return TaskNodeArraySchema.parse(nodes);
}

function node(over: Record<string, unknown>): TaskNode {
  return TaskNodeSchema.parse({
    id: "x",
    level: "module",
    title: "X",
    slug: "x",
    ...over,
  });
}

describe("buildTree + rollup", () => {
  const data = [
    node({ id: "root", level: "app", title: "Kök", slug: "root", wbsCode: "1" }),
    node({
      id: "a",
      parentId: "root",
      wbsCode: "1.1",
      progress: 100,
      status: "done",
      effort: { estimate: 2, unit: "sp", spent: 0 },
    }),
    node({
      id: "b",
      parentId: "root",
      wbsCode: "1.2",
      progress: 0,
      status: "in-progress",
      effort: { estimate: 2, unit: "sp", spent: 0 },
    }),
  ];

  it("ağacı kurar ve çocukları bağlar", () => {
    const tree = buildTree(data);
    expect(tree).toHaveLength(1);
    expect(tree[0].children.map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("ebeveyn ilerlemesini ağırlıklı türetir", () => {
    const tree = buildTree(data);
    // eşit ağırlık (2,2): (100+0)/2 = 50
    expect(tree[0].rollup.progress).toBe(50);
  });

  it("hepsi bitmediyse ebeveyn durumu done değildir", () => {
    const tree = buildTree(data);
    expect(tree[0].rollup.status).not.toBe("done");
  });
});

describe("export/import round-trip", () => {
  const nodes = [
    node({
      id: "alpha",
      title: "Alpha",
      slug: "alpha",
      wbsCode: "1",
      tags: ["x", "y"],
      dependsOn: ["beta"],
    }),
    node({
      id: "beta",
      title: "Beta, virgüllü",
      slug: "beta",
      wbsCode: "2",
      owner: "ismail",
      progress: 40,
    }),
  ];

  it("JSON tam-doğruluklu döner", () => {
    const result = importJSON(exportJSON(nodes));
    expect(result.errors).toEqual([]);
    expect(result.nodes).toEqual(nodes);
  });

  it("CSV düz alanları korur (virgül/escape dahil)", () => {
    const result = importCSV(exportCSV(nodes));
    expect(result.errors).toEqual([]);
    expect(result.nodes.map((n) => n.title)).toEqual(["Alpha", "Beta, virgüllü"]);
    expect(result.nodes[0].tags).toEqual(["x", "y"]);
    expect(result.nodes[0].dependsOn).toEqual(["beta"]);
    expect(result.nodes[1].progress).toBe(40);
  });

  it("bozuk JSON hatayı yakalar, çökmez", () => {
    const result = importJSON("{ bozuk");
    expect(result.nodes).toEqual([]);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("CSV tam-fidelity: _node ile 14 boyut/7 faz/risk round-trip korunur", () => {
    const full = node({
      id: "gamma",
      title: "Gamma",
      slug: "gamma",
      wbsCode: "3",
      dimensions: {
        featureDefs: {
          key: "featureDefs",
          title: "Özellik",
          status: "filled",
          items: ["a", "b"],
          notes: "n",
        },
      },
      deliverables: ["d1", "d2"],
      risks: [{ id: "r1", desc: "risk", severity: "high", mitigation: "m" }],
      acceptanceCriteria: ["k1"],
    });
    const result = importCSV(exportCSV([full]));
    expect(result.errors).toEqual([]);
    expect(result.nodes[0]).toEqual(full); // tam eşitlik (boyut/faz/risk dahil)
  });

  it("exportTask tek görevi tam JSON verir (round-trip, veriden — DOM değil)", () => {
    const n = node({
      id: "solo",
      title: "Solo",
      slug: "solo",
      wbsCode: "9",
      owner: "x",
      progress: 30,
    });
    const back = TaskNodeSchema.parse(JSON.parse(exportTask(n)));
    expect(back).toEqual(n);
  });
});

describe("kritik yol", () => {
  it("en uzun bağımlılık zincirini bulur", () => {
    const nodes = [
      node({ id: "a", title: "A", slug: "a", effort: { estimate: 1, unit: "sp", spent: 0 } }),
      node({
        id: "b",
        title: "B",
        slug: "b",
        dependsOn: ["a"],
        effort: { estimate: 1, unit: "sp", spent: 0 },
      }),
      node({
        id: "c",
        title: "C",
        slug: "c",
        dependsOn: ["b"],
        effort: { estimate: 1, unit: "sp", spent: 0 },
      }),
      node({ id: "d", title: "D", slug: "d", effort: { estimate: 1, unit: "sp", spent: 0 } }),
    ];
    const cp = computeCriticalPath(nodes);
    expect(cp.path).toEqual(["a", "b", "c"]);
    expect(cp.ids.has("d")).toBe(false);
    expect(cp.length).toBe(3);
  });

  it("döngüde sonsuz döngüye girmez", () => {
    const nodes = [
      node({ id: "x", title: "X", slug: "x", dependsOn: ["y"] }),
      node({ id: "y", title: "Y", slug: "y", dependsOn: ["x"] }),
    ];
    expect(() => computeCriticalPath(nodes)).not.toThrow();
  });
});

describe("ECA motoru (yapısal — gerçekten çalışır, mock değil)", () => {
  const rule = EcaRuleSchema.parse({
    id: "r1",
    event: "task.status.changed",
    when: [{ field: "status", op: "eq", value: "done" }],
    then: { type: "notify", params: { target: "owner" } },
  });

  it("olay + koşul sağlanınca tetiklenir ve aksiyonu döner", () => {
    const r = evaluateEca(rule, "task.status.changed", { status: "done" });
    expect(r.fired).toBe(true);
    expect(r.action?.type).toBe("notify");
  });

  it("koşul sağlanmazsa tetiklenmez", () => {
    expect(evaluateEca(rule, "task.status.changed", { status: "todo" }).fired).toBe(false);
  });

  it("olay eşleşmezse tetiklenmez", () => {
    expect(evaluateEca(rule, "task.progress.changed", { status: "done" }).fired).toBe(false);
  });

  it("maxChainDepth aşılınca tetiklenmez (sonsuz zincir koruması — maks 6)", () => {
    expect(evaluateEca(rule, "task.status.changed", { status: "done" }, 6).fired).toBe(false);
  });
});

describe("AI ArcheType güvenlik sınırı", () => {
  const policy = AgentPolicySchema.parse({
    autonomy: "draft",
    allowedTargets: ["archetype"],
    forbiddenTargets: ["app", "module"],
  });

  it("AI app/module üretemez veya güncelleyemez", () => {
    expect(
      evaluateAgentPolicy(policy, { actor: "ai", action: "generate", targetLevel: "app" }).allowed,
    ).toBe(false);
    expect(
      evaluateAgentPolicy(policy, { actor: "ai", action: "generate", targetLevel: "module" })
        .allowed,
    ).toBe(false);
    expect(
      evaluateAgentPolicy(policy, { actor: "ai", action: "update", targetLevel: "module" }).allowed,
    ).toBe(false);
  });

  it("AI yalnız ArcheType taslağı üretebilir", () => {
    const decision = evaluateAgentPolicy(policy, {
      actor: "ai",
      action: "generate",
      targetLevel: "archetype",
      environment: "draft",
    });
    expect(decision.allowed).toBe(true);
    expect(decision.requiresApproval).toBe(true);
  });

  it("prod ArcheType update geçmiş veri korunmadan geçmez", () => {
    const denied = evaluateAgentPolicy(policy, {
      actor: "ai",
      action: "update",
      targetLevel: "archetype",
      environment: "production",
      historyPreserved: false,
    });
    expect(denied.allowed).toBe(false);

    const allowed = evaluateAgentPolicy(policy, {
      actor: "ai",
      action: "update",
      targetLevel: "archetype",
      environment: "production",
      historyPreserved: true,
      snapshotCreated: true,
      rollbackReady: true,
      compatibilityChecked: true,
      migrationMode: "append-only",
    });
    expect(allowed.allowed).toBe(true);
    expect(allowed.requiresApproval).toBe(true);
  });

  it("AI ruleset dışına çıkamaz", () => {
    const decision = evaluateAgentPolicy(policy, {
      actor: "ai",
      action: "change-ruleset",
      targetLevel: "archetype",
      rulesetBypassAttempt: true,
    });
    expect(decision.allowed).toBe(false);
  });
});

describe("üretilmiş JSON agentPolicy/ECA kapıları", () => {
  const nodes = loadGeneratedNodes();

  it("app/module düğümlerinde AI mutasyon otonomisi yoktur", () => {
    const violations = nodes
      .filter((n) => n.level === "app" || n.level === "module")
      .filter((n) => n.agentPolicy?.autonomy !== "none");
    expect(violations.map((n) => `${n.id}:${n.agentPolicy?.autonomy}`)).toEqual([]);
  });

  it("ECA publish otomasyonu üretmez", () => {
    const publishRules = nodes.flatMap((n) =>
      n.ecaRules.filter((r) => r.then.type === "publish").map((r) => `${n.id}:${r.id}`),
    );
    expect(publishRules).toEqual([]);
  });

  it("her düğümde backend AI deny ruleset'i vardır", () => {
    const missing = nodes.filter((n) => {
      const events = new Set(n.ecaRules.map((r) => r.event));
      return (
        !events.has("ai.generation.requested") ||
        !events.has("ai.update.requested") ||
        !events.has("ai.ruleset.override.requested")
      );
    });
    expect(missing.map((n) => n.id)).toEqual([]);
  });

  it("ArcheType düğümleri prod update geçmiş veri gate'i taşır", () => {
    const missing = nodes.filter((n) => {
      if (n.level !== "archetype") return false;
      const ruleIds = new Set(n.ecaRules.map((r) => r.id));
      return (
        !ruleIds.has(`eca-${n.id}-archetype-draft-allow`) ||
        !ruleIds.has(`eca-${n.id}-archetype-prod-update-gated`)
      );
    });
    expect(missing.map((n) => n.id)).toEqual([]);
  });
});

describe("resolve", () => {
  it("breadcrumb zincirini kökten kurar", () => {
    const nodes = [
      node({ id: "app1", level: "app", title: "App", slug: "app1" }),
      node({ id: "mod1", parentId: "app1", title: "Mod", slug: "mod1" }),
      node({ id: "leaf", parentId: "mod1", title: "Leaf", slug: "leaf" }),
    ];
    const chain = getAncestors(indexById(nodes), "leaf");
    expect(chain.map((n) => n.id)).toEqual(["app1", "mod1", "leaf"]);
  });
});
