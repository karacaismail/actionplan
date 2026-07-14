import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  classifyUiImpact,
  deriveUiArtifactRole,
  evaluateUiDeliveryGate,
} from "../tools/lib/ui-impact.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NODE_DIR = path.resolve(
  process.env.DOC_TASK_CONTENT_NODE_DIR ?? path.join(ROOT, "src/data/generated/nodes"),
);

type UiRole = "produces-ui" | "changes-ui-contract" | "governs-ui" | "consumes-ui" | "no-ui";

type UiDelivery = {
  applies: boolean;
  impact: string;
  reviewStatus: string;
  storyRefs?: string[];
  requiredStoryStates?: string[];
  storybookUrl?: string | null;
  visualEvidenceRefs?: string[];
};

type TaskNode = {
  id: string;
  level?: string;
  artifactKind?: string;
  title?: string;
  summary?: string;
  refs?: string[];
  deliverables?: string[];
  acceptanceCriteria?: string[];
  uiArtifactRole?: UiRole;
  uiDelivery?: UiDelivery;
  source?: { cluster?: string };
};

type RoleRecord = {
  nodeId: string;
  role: UiRole;
  reason: string;
  decidedBy: string;
  decidedAt: string;
};

type DeliveryRecord = {
  nodeId: string;
  sourceRules: string[];
  storyTargetStatus: string;
  uiDelivery: UiDelivery;
};

type ContentRule = {
  id: string;
  selector: { nodeIds?: string[] };
  content?: { humanDecisionBlocker?: boolean };
};

const readJson = <T>(relativePath: string): T =>
  JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8")) as T;

const nodes = fs
  .readdirSync(NODE_DIR)
  .filter((file) => file.endsWith(".json"))
  .sort()
  .map((file) => JSON.parse(fs.readFileSync(path.join(NODE_DIR, file), "utf8")) as TaskNode);
const nodeById = new Map(nodes.map((node) => [node.id, node]));

const roleFile = readJson<{ records: RoleRecord[] }>("src/data/storybook/ui-artifact-roles.json");
const deliveryFile = readJson<{ records: DeliveryRecord[] }>(
  "src/data/doc-task-ui-deliveries.json",
);
const roleRegistry = Object.fromEntries(
  roleFile.records.map((record) => [record.nodeId, record.role]),
);
const deliveryByNodeId = new Map(deliveryFile.records.map((record) => [record.nodeId, record]));
const contentRuleById = new Map(
  fs
    .readdirSync(path.join(ROOT, "src/data/doc-task-content-rules"))
    .filter((file) => file.endsWith(".json"))
    .flatMap(
      (file) =>
        readJson<{ rules?: ContentRule[] }>(`src/data/doc-task-content-rules/${file}`).rules ?? [],
    )
    .map((rule) => [rule.id, rule]),
);
const humanDecisionOwnerIds = new Set(
  [...contentRuleById.values()]
    .filter((rule) => rule.content?.humanDecisionBlocker === true)
    .flatMap((rule) => rule.selector.nodeIds ?? []),
);
const isExplicitDirectOwner = (node: TaskNode) =>
  node.source?.cluster === "platform-directive-owner" || humanDecisionOwnerIds.has(node.id);

const EXPECTED_ROLES = {
  "atom-crm-domain-blocklist": "no-ui",
  "atom-crm-email-regex": "no-ui",
  "atom-crm-score-range-check": "no-ui",
  "cc-security": "no-ui",
  customer: "changes-ui-contract",
  "customer-app-core-shell": "changes-ui-contract",
  "deploy-yap": "governs-ui",
  "hello-platform-smoke": "governs-ui",
  "k-wbs": "governs-ui",
  "l1-audit": "no-ui",
  "l1-search-deep": "changes-ui-contract",
  "molekul-crm-score-field-validator": "no-ui",
  "molekul-crm-score-weight-config": "no-ui",
  "platform-customer-graphql": "changes-ui-contract",
  "platform-customer-seed": "changes-ui-contract",
  product: "changes-ui-contract",
  "s-accounting": "changes-ui-contract",
  "s-cms": "consumes-ui",
  "s-commerce": "changes-ui-contract",
  "s-community": "consumes-ui",
  "s-data-catalog": "changes-ui-contract",
  "s-dms": "no-ui",
  "s-helpdesk": "consumes-ui",
  "s-inventory": "produces-ui",
  "s-marketplace": "consumes-ui",
  "s-membership": "consumes-ui",
  "s-observability": "governs-ui",
  "s-payment-methods": "consumes-ui",
  "s-pim": "changes-ui-contract",
  "s-pmo": "consumes-ui",
  "s-property": "consumes-ui",
  "s-sales": "produces-ui",
  "s-social": "consumes-ui",
  "s-social-commerce": "consumes-ui",
  "s-studio": "consumes-ui",
  "s-tax-compliance": "consumes-ui",
  "scale-invariant": "no-ui",
  "sdk-app-core-template": "changes-ui-contract",
  "sus-actions": "changes-ui-contract",
  "sus-declarative": "changes-ui-contract",
} satisfies Record<string, UiRole>;

const EXPECTED_UI_DELIVERY_NODES = Object.entries(EXPECTED_ROLES)
  .filter(([, role]) => role === "produces-ui" || role === "changes-ui-contract")
  .map(([nodeId]) => nodeId)
  .sort();

describe("DOC-APPLY semantic UI role projection", () => {
  it("records the exact 40-node semantic decision matrix", () => {
    expect(roleRegistry).toEqual(EXPECTED_ROLES);
    expect(roleFile.records).toHaveLength(40);
    expect(
      roleFile.records.reduce<Record<UiRole, number>>(
        (counts, record) => {
          counts[record.role] += 1;
          return counts;
        },
        {
          "produces-ui": 0,
          "changes-ui-contract": 0,
          "governs-ui": 0,
          "consumes-ui": 0,
          "no-ui": 0,
        },
      ),
    ).toEqual({
      "produces-ui": 2,
      "changes-ui-contract": 13,
      "governs-ui": 4,
      "consumes-ui": 12,
      "no-ui": 9,
    });
  });

  it("materializes all 40 role decisions and only 15 planned uiDelivery contracts", () => {
    expect([...deliveryByNodeId.keys()].sort()).toEqual(EXPECTED_UI_DELIVERY_NODES);
    expect(deliveryFile.records).toHaveLength(15);

    for (const [nodeId, role] of Object.entries(EXPECTED_ROLES)) {
      const node = nodeById.get(nodeId);
      expect(node, nodeId).toBeDefined();
      expect(node?.uiArtifactRole, nodeId).toBe(role);
      expect(node?.refs, nodeId).toContain(
        `doc-ui-contract:${nodeId}: src/data/storybook/ui-artifact-roles.json`,
      );

      if (node?.artifactKind === "platform-foundation" && !isExplicitDirectOwner(node)) {
        expect(
          node.refs?.some((ref) => ref.startsWith("doc-apply:")),
          `${nodeId}: audited UI metadata must not reopen generic foundation content`,
        ).toBe(false);
        expect(JSON.stringify(node).includes("[DOC-APPLY:"), `${nodeId}: foundation roll-up`).toBe(
          false,
        );
      }

      const planned = deliveryByNodeId.get(nodeId);
      if (planned) {
        expect(node?.uiDelivery, nodeId).toEqual(planned.uiDelivery);
        expect(node?.refs, nodeId).toContain(
          `doc-ui-delivery:${nodeId}: src/data/doc-task-ui-deliveries.json`,
        );
      } else {
        expect(node?.uiDelivery, nodeId).toBeUndefined();
        expect(
          node?.refs?.some((ref) => ref.startsWith("doc-ui-delivery:")),
          nodeId,
        ).toBe(false);
      }
    }
  });

  it("keeps planned story targets separate from runtime evidence", () => {
    for (const record of deliveryFile.records) {
      expect(record.storyTargetStatus, record.nodeId).toBe("planned-not-created");
      expect(record.sourceRules.length, record.nodeId).toBeGreaterThan(0);
      expect(record.uiDelivery.applies, record.nodeId).toBe(true);
      expect(record.uiDelivery.impact, record.nodeId).not.toBe("none");
      expect(record.uiDelivery.reviewStatus, record.nodeId).toBe("planned");
      expect(record.uiDelivery.storybookUrl, record.nodeId).toBeNull();
      expect(record.uiDelivery.visualEvidenceRefs ?? [], record.nodeId).toEqual([]);
      expect(record.uiDelivery).not.toHaveProperty("reviewer");
      expect(record.uiDelivery).not.toHaveProperty("baselineGovernance");
      expect(record.uiDelivery.storyRefs?.length ?? 0, record.nodeId).toBeGreaterThan(0);
      expect(record.uiDelivery.requiredStoryStates, record.nodeId).toEqual([
        "default",
        "loading",
        "empty",
        "error",
        "permission-denied",
        "long-content",
      ]);
      expect(
        record.uiDelivery.storyRefs?.every((ref) => ref.includes(".stories.")),
        record.nodeId,
      ).toBe(true);

      const serializedNode = JSON.stringify(nodeById.get(record.nodeId));
      for (const sourceRule of record.sourceRules) {
        const node = nodeById.get(record.nodeId);
        if (node?.artifactKind === "platform-foundation" && !isExplicitDirectOwner(node)) {
          expect(
            contentRuleById.get(sourceRule)?.selector.nodeIds,
            `${record.nodeId}:${sourceRule}: audited roll-up owner parity`,
          ).toContain(record.nodeId);
          expect(
            serializedNode,
            `${record.nodeId}:${sourceRule}: no raw foundation projection`,
          ).not.toContain(`[DOC-APPLY:${sourceRule}]`);
        } else {
          expect(serializedNode, `${record.nodeId}:${sourceRule}`).toContain(
            `[DOC-APPLY:${sourceRule}]`,
          );
        }
      }
    }
  });

  it("preserves DOC-APPLY UI semantics and uses explicit roles to resolve false positives", () => {
    const globalGateText = {
      id: "managed-global-gates",
      title: "Backend atom",
      deliverables: ["[DOC-APPLY:ready-for-dev] UI/URL etkisi varsa ilgili ek kapı girdileri."],
      acceptanceCriteria: [
        "[DOC-APPLY:evidence-dod] Planlanan kanıt, tek ekran görüntüsü veya kırık bağ reddedilir.",
      ],
    };
    expect(classifyUiImpact(globalGateText).impact).toBe("none");

    const genuineContract = {
      id: "managed-ui-contract",
      title: "Backend projection",
      deliverables: ["[DOC-APPLY:surface] Surface state, locale ve navigation sözleşmesi"],
    };
    expect(classifyUiImpact(genuineContract).impact).toBe("surface");
    expect(deriveUiArtifactRole(genuineContract).role).toBe("produces-ui");

    const explicitNonProducer = {
      ...genuineContract,
      id: "managed-non-producer",
      uiArtifactRole: "no-ui",
    } as const;
    expect(deriveUiArtifactRole(explicitNonProducer).role).toBe("no-ui");
  });

  it("rejects an explicit candidate role with an N/A uiDelivery contract", () => {
    const node = {
      id: "declared-na",
      title: "Declared producer",
      uiArtifactRole: "produces-ui",
      uiDelivery: {
        applies: false,
        impact: "none",
        componentKind: "none",
        reason: "Bu somut gerekçe eski N/A sözleşmesini açıklıyor.",
      },
    };

    const result = evaluateUiDeliveryGate([node], { allowedWarnings: [] });
    expect(result.result).toBe("FAIL");
    expect(result.violations.join("\n")).toContain("applies=true");
  });

  it("rejects a registry candidate role with an N/A uiDelivery contract", () => {
    const node = {
      id: "registry-na",
      title: "Registry producer",
      uiDelivery: {
        applies: false,
        impact: "none",
        componentKind: "none",
        reason: "Bu somut gerekçe eski N/A sözleşmesini açıklıyor.",
      },
    };

    const result = evaluateUiDeliveryGate(
      [node],
      { allowedWarnings: [] },
      {
        roleRegistry: { "registry-na": "changes-ui-contract" },
      },
    );
    expect(result.result).toBe("FAIL");
    expect(result.violations.join("\n")).toContain("applies=true");
  });

  it("keeps the full generated corpus free of baseline-external violations", () => {
    const baseline = readJson<{ allowedWarnings: string[] }>(
      "tools/agents/ui-delivery-baseline.json",
    );
    const result = evaluateUiDeliveryGate(nodes, baseline, { roleRegistry });

    expect(result.violations).toEqual([]);
    expect(result.candidates).toBeGreaterThanOrEqual(deliveryFile.records.length);
    expect(result.migration.decided).toBeGreaterThanOrEqual(roleFile.records.length);
    expect(result.result).toBe("MIGRATION_INCOMPLETE");
  });

  it("passes the audited 40-node subcorpus with exactly 15 candidates", () => {
    const auditedNodes = Object.keys(EXPECTED_ROLES).map((nodeId) => nodeById.get(nodeId));
    expect(auditedNodes.every(Boolean)).toBe(true);

    const result = evaluateUiDeliveryGate(
      auditedNodes as TaskNode[],
      { allowedWarnings: [] },
      {
        roleRegistry,
      },
    );
    expect(result).toMatchObject({
      result: "PASS",
      candidates: 15,
      violations: [],
      warnings: [],
      migration: { decided: 40, undecided: 0 },
    });
  });
});
