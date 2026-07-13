import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const EXPECTED_REFS: Record<string, string[]> = {
  "s-ai-governance": [
    "docs/enterprise-saas-phase-5h-ai-data-science-candidates.md",
    "docs/enterprise-saas-phase-9-adversarial-review.md",
    "docs/enterprise-saas-waterfall-claude-multi-agent-directive.md",
    "docs/implementation-prompt-boundary-gap-report-2026-07-08.md",
    "docs/templates/platform-agent-boundary/AGENTS.md",
    "docs/templates/platform-agent-boundary/CLAUDE.md",
  ],
  "cc-security": [
    "docs/enterprise-saas-phase-5d-security-privacy-compliance-candidates.md",
    "docs/standards/03-authn-authz-iam-standard.md",
    "docs/standards/04-rbac-abac-permission-standard.md",
    "docs/standards/12-devops-infrastructure-standard.md",
  ],
  "k-sso": [
    "docs/enterprise-saas-phase-5b-identity-tenant-org-candidates.md",
    "docs/standards/03-authn-authz-iam-standard.md",
  ],
  "s-data-catalog": ["docs/enterprise-saas-source-normalization-matrix.md"],
};

describe("AI ve security dokümanları semantic WBS refs entegrasyonu", () => {
  for (const [nodeId, expectedRefs] of Object.entries(EXPECTED_REFS)) {
    it(`${nodeId} archetype/feature hedefte exact ve tekil ref verir`, () => {
      const nodePath = path.join(ROOT, "src/data/generated/nodes", `${nodeId}.json`);
      const node = JSON.parse(fs.readFileSync(nodePath, "utf8")) as {
        level: string;
        refs?: string[];
      };

      expect(["archetype", "feature"], `${nodeId}: hedef seviye geçersiz`).toContain(node.level);

      for (const ref of expectedRefs) {
        expect(fs.existsSync(path.join(ROOT, ref)), `doküman yok: ${ref}`).toBe(true);
        expect(
          node.refs?.filter((candidate) => candidate === ref),
          `${nodeId}: exact/tekil ref bekleniyor ${ref}`,
        ).toHaveLength(1);
      }
    });
  }
});
