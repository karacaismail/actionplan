import fs from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

type DecisionProfile = {
  decisionStatus: "accepted" | "proposed" | "audit-pending";
  disposition: string;
  proposedArtifactKind: string;
  reason: string;
};

type DecisionEntry = {
  aliases: string[];
  capabilityIds?: string[];
  canonicalId: string;
  canonicalSlug: string;
  profile: string;
  reason?: string;
};

type DecisionRegistry = {
  decisionProfiles: Record<string, DecisionProfile>;
  entries: Record<string, DecisionEntry>;
  schemaVersion: string;
  sourceSnapshot: {
    expectedNodeCount: number;
    nodeDirectory: string;
  };
  materializedSnapshot: {
    expectedNodeCount: number;
    canonicalApps: number;
    appCores: number;
    legacyAliases: number;
  };
};

const ROOT = process.cwd();
const REGISTRY_PATH = path.join(ROOT, "src/data/app-catalog-decisions.json");
const NODE_DIR = path.join(ROOT, "src/data/generated/nodes");

const EXACT_MERGES = [
  ["s-clinic", "dist-clinic"],
  ["s-education", "dist-education"],
  ["s-legaltech", "dist-legal"],
  ["s-membership", "dist-membership"],
  ["s-restaurant", "dist-restaurant"],
] as const;

const MANDATORY_APP_CANDIDATES = [
  "dist-agritech",
  "dist-clinic",
  "dist-construction",
  "dist-education",
  "dist-legal",
  "dist-membership",
  "dist-ngo",
  "dist-realestate",
  "dist-restaurant",
  "dist-sahibinden",
  "dist-site",
  "dist-travel",
  "dist-veteriner",
  "s-clinic",
  "s-education",
  "s-incentive",
  "s-legaltech",
  "s-membership",
  "s-property",
  "s-restaurant",
  "stack-builder",
  "stack-channel",
  "stack-compliance",
  "stack-messaging",
  "stack-service",
  "stack-workspace",
  "edition-storefront",
  "edition-salescrm",
  "edition-onmuhasebe",
  "edition-people",
  "edition-creator",
  "edition-randevu",
  "edition-departman-copilot",
  "s-esign",
  "s-iot",
  "s-isg",
  "s-kvkk",
  "s-mail",
  "s-comms",
  "s-channel-hub",
  "s-scheduling",
] as const;

let registry: DecisionRegistry;
let nodeIds: string[];

beforeAll(() => {
  registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8")) as DecisionRegistry;
  nodeIds = fs
    .readdirSync(NODE_DIR)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(fs.readFileSync(path.join(NODE_DIR, file), "utf8")).id as string)
    .sort();
});

const resolve = (id: string) => {
  const entry = registry.entries[id];
  const profile = registry.decisionProfiles[entry.profile];
  return { ...profile, ...entry, reason: entry.reason ?? profile.reason };
};

describe("app catalog identity decision registry", () => {
  it("covers the current materialized node snapshot exactly once", () => {
    const registryIds = Object.keys(registry.entries).sort();
    expect(registry.sourceSnapshot.expectedNodeCount).toBe(496);
    expect(registry.materializedSnapshot.expectedNodeCount).toBe(617);
    expect(registry.materializedSnapshot.canonicalApps).toBe(121);
    expect(registry.materializedSnapshot.appCores).toBe(121);
    expect(registry.materializedSnapshot.legacyAliases).toBe(5);
    expect(nodeIds).toHaveLength(617);
    expect(registryIds).toEqual(nodeIds);
    expect(new Set(registryIds).size).toBe(617);
  });

  it("resolves every profile and keeps canonical ids/slugs valid", () => {
    const ids = new Set(nodeIds);
    const failures: string[] = [];
    const canonicalSlugs: string[] = [];

    for (const id of nodeIds) {
      const entry = registry.entries[id];
      const profile = registry.decisionProfiles[entry.profile];
      if (!profile) failures.push(`${id}: unknown profile ${entry.profile}`);
      if (!ids.has(entry.canonicalId))
        failures.push(`${id}: dangling canonicalId ${entry.canonicalId}`);
      if (!/^[a-z0-9][a-z0-9-]*$/.test(entry.canonicalSlug))
        failures.push(`${id}: invalid canonicalSlug ${entry.canonicalSlug}`);
      if (entry.canonicalId === id) canonicalSlugs.push(entry.canonicalSlug);
      if (!Array.isArray(entry.aliases)) failures.push(`${id}: aliases must be an array`);
      if (!(entry.reason ?? profile?.reason)?.trim()) failures.push(`${id}: reason missing`);
    }

    expect(failures).toEqual([]);
    expect(new Set(canonicalSlugs).size).toBe(canonicalSlugs.length);
  });

  it("encodes the five exact duplicate pairs as one canonical app plus a legacy alias", () => {
    for (const [canonicalId, legacyId] of EXACT_MERGES) {
      const canonical = resolve(canonicalId);
      const legacy = resolve(legacyId);
      expect(canonical.proposedArtifactKind, canonicalId).toBe("app-definition");
      expect(canonical.disposition, canonicalId).toBe("PROMOTE_APP");
      expect(canonical.aliases, canonicalId).toContain(legacyId);
      expect(legacy.canonicalId, legacyId).toBe(canonicalId);
      expect(legacy.canonicalSlug, legacyId).toBe(canonical.canonicalSlug);
      expect(legacy.disposition, legacyId).toBe("MERGE_APP_ALIAS");
      expect(legacy.proposedArtifactKind, legacyId).toBe("app-alias");
    }
  });

  it("never leaves a mandatory app candidate classified as a module or archetype", () => {
    expect(MANDATORY_APP_CANDIDATES).toHaveLength(41);
    for (const id of MANDATORY_APP_CANDIDATES) {
      const decision = resolve(id);
      expect(["app-definition", "app-alias"], `${id}: ${decision.proposedArtifactKind}`).toContain(
        decision.proposedArtifactKind,
      );
      expect(decision.decisionStatus, id).toBe("accepted");
    }
  });

  it("keeps the edition taxonomy as governance, not a fake commercial app", () => {
    const decision = resolve("stack-editions");
    expect(decision.disposition).toBe("RECLASSIFY_GOVERNANCE");
    expect(decision.proposedArtifactKind).toBe("governance");
    expect(decision.decisionStatus).toBe("accepted");
  });

  it("classifies all remaining productized s-* packages as accepted apps", () => {
    const productized = nodeIds.filter((id) => resolve(id).profile === "productized-app");
    expect(productized).toHaveLength(84);
    for (const id of productized) {
      const decision = resolve(id);
      expect(decision.disposition, id).toBe("PROMOTE_APP");
      expect(decision.proposedArtifactKind, id).toBe("app-definition");
      expect(decision.decisionStatus, id).toBe("accepted");
    }
  });

  it("pins stable commercial capability ids in the identity registry for every canonical app", () => {
    const canonicalApps = nodeIds.filter((id) => resolve(id).disposition === "PROMOTE_APP");
    expect(canonicalApps).toHaveLength(121);
    for (const id of canonicalApps) {
      expect(registry.entries[id].capabilityIds, id).toEqual([
        `${id}.operate`,
        `${id}.administer`,
        `${id}.report-audit`,
      ]);
    }
  });

  it("preserves every merge alias exactly once", () => {
    const aliases = Object.values(registry.entries).flatMap((entry) => entry.aliases);
    expect(new Set(aliases).size).toBe(aliases.length);
    expect(aliases.sort()).toEqual(EXACT_MERGES.map(([, legacyId]) => legacyId).sort());
  });
});
