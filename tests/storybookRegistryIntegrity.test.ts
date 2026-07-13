import fs from "node:fs";
import path from "node:path";
import { UiArtifactRolesFileSchema } from "@/schemas";
import { describe, expect, it } from "vitest";
// @ts-expect-error Pure Node ESM gate helper has no TypeScript declaration file.
import { validateUiArtifactRoleRecords } from "../tools/lib/storybook-registry-validation.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const ROLE_FILE = path.join(ROOT, "src/data/storybook/ui-artifact-roles.json");
const NODE_DIR = path.join(ROOT, "src/data/generated/nodes");

type RoleRecord = {
  nodeId: string;
  role: string;
  reason: string;
  decidedBy: string;
  decidedAt: string;
};

const canonical = JSON.parse(fs.readFileSync(ROLE_FILE, "utf8")) as {
  note: string;
  records: RoleRecord[];
};
const knownNodeIds = new Set(
  fs
    .readdirSync(NODE_DIR)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const node = JSON.parse(fs.readFileSync(path.join(NODE_DIR, file), "utf8")) as {
        id: string;
      };
      return node.id;
    }),
);

const validRecord: RoleRecord = {
  nodeId: "customer",
  role: "changes-ui-contract",
  reason: "Customer surface state contract is explicitly affected.",
  decidedBy: "Codex MASTER semantic audit",
  decidedAt: "2026-07-13",
};

const violationsFor = (records: unknown[]) =>
  validateUiArtifactRoleRecords(records, knownNodeIds) as string[];

describe("Storybook ui-artifact role registry integrity", () => {
  it("canonical 40-record registry passes the Zod schema, duplicate guard, and node FK gate", () => {
    expect(UiArtifactRolesFileSchema.parse(canonical).records).toHaveLength(40);
    expect(violationsFor(canonical.records)).toEqual([]);
  });

  it("rejects duplicate nodeId values", () => {
    const records = [validRecord, { ...validRecord }];

    expect(() => UiArtifactRolesFileSchema.parse({ note: "test", records })).toThrow();
    expect(violationsFor(records).join("\n")).toMatch(/duplicate nodeId.*customer/i);
  });

  it("rejects a nodeId that does not resolve to the generated WBS corpus", () => {
    const records = [{ ...validRecord, nodeId: "missing-wbs-node" }];

    expect(violationsFor(records).join("\n")).toMatch(/nodeId FK.*missing-wbs-node/i);
  });

  it.each([
    ["blank reason", { reason: "   " }, /reason.*zorunlu/i],
    ["blank decidedBy", { decidedBy: "\t" }, /decidedBy.*zorunlu/i],
    ["non-canonical date", { decidedAt: "2026-7-13" }, /decidedAt.*YYYY-MM-DD/i],
    ["impossible calendar date", { decidedAt: "2026-02-30" }, /decidedAt.*YYYY-MM-DD/i],
    ["unknown role", { role: "produces_ui" }, /gecersiz role|geçersiz role/i],
  ])("rejects %s", (_label, patch, expectedMessage) => {
    const records = [{ ...validRecord, ...patch }];

    expect(() => UiArtifactRolesFileSchema.parse({ note: "test", records })).toThrow();
    expect(violationsFor(records).join("\n")).toMatch(expectedMessage);
  });
});
