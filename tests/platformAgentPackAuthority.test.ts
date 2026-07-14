import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");

const PACKS = [
  "docs/platform-cust01-customer-app-core-agent-pack-2026-07-09.md",
  "docs/platform-cust02-customer-model-agent-pack-2026-07-09.md",
  "docs/platform-cust03-customer-graphql-agent-pack-2026-07-09.md",
  "docs/platform-cust04-customer-ui-agent-pack-2026-07-09.md",
  "docs/platform-cust05-customer-seed-agent-pack-2026-07-09.md",
  "docs/platform-cust06-customer-e2e-evidence-agent-pack-2026-07-09.md",
  "docs/platform-pr01-ci-baseline-agent-pack-2026-07-09.md",
  "docs/platform-pr02-tenancy-context-agent-pack-2026-07-09.md",
  "docs/platform-pr03-authz-pdp-agent-pack-2026-07-09.md",
  "docs/platform-pr04-event-outbox-agent-pack-2026-07-09.md",
  "docs/platform-pr05-eca-runtime-agent-pack-2026-07-09.md",
  "docs/platform-pr06-audit-envelope-agent-pack-2026-07-09.md",
  "docs/platform-pr07-capability-registry-agent-pack-2026-07-09.md",
  "docs/platform-pr08-db-schema-migrations-agent-pack-2026-07-09.md",
  "docs/platform-pr09-observability-agent-pack-2026-07-09.md",
  "docs/platform-pr10-sdk-public-contract-agent-pack-2026-07-09.md",
  "docs/platform-pr11-hello-platform-agent-pack-2026-07-09.md",
  "docs/platform-w2-01-sdk-app-core-template-agent-pack-2026-07-09.md",
] as const;

describe("legacy platform execution paketleri yetki kilidi", () => {
  it.each(PACKS)("%s yalnız insan geliştirici handoff'u olarak kalır", (file) => {
    const content = read(file);
    const firstSection = content.indexOf("\n## ");
    expect(firstSection).toBeGreaterThan(0);
    expect(content.slice(0, firstSection)).toContain("AUTHORITY-LOCK");
    for (const required of [
      "Codex → PM → uzman ajanlar → Claude workers/slaves",
      "human-developer-only",
      "read-only-audit",
      "## Human Developer Execution Packet",
      "## Human Developer Checklist",
    ])
      expect(content).toContain(required);
    for (const forbidden of [
      /Claude Code\/Cursor\/Aider/i,
      /kod ajanına/i,
      /^## Agent Prompt$/m,
      /^Durum: docs-only implementation agent pack$/m,
      /Implementation operatörü aşağıdaki prompt'u/i,
    ])
      expect(content).not.toMatch(forbidden);
  });
});
