import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readD01LiveUniverse } from "./helpers/d01LiveUniverse";

const ROOT = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative: string) => JSON.parse(read(relative));

const GAP = "docs/kernel-readiness-gap-analysis-2026-07-14.md";
const PACK = "docs/platform-kdp01-archetype-storage-agent-pack-2026-07-14.md";
const QUEUE = "reports/kernel-data-plane-readiness-queue-2026-07-14.json";

describe("kernel readiness gap paketi", () => {
  it("immutable 2026-07-14 pre-D01 snapshot'ını iddia edilen walking skeleton'dan ayırır", () => {
    const gap = read(GAP);
    for (const token of [
      "617",
      "10.082 SP",
      "41",
      "787 SP",
      "2 backend testi",
      "28 test",
      "doğrulanmadı",
      "PR-01",
      "NO-GO",
    ]) {
      expect(gap).toContain(token);
    }
    expect(gap).toMatch(/28 test.*doğrulanmadı/s);
    expect(gap).not.toMatch(/28 tests?[^.\n]*(green|pass|yeşil)/i);
  });

  it("current-live kapsamını tarihsel tuple yerine kanonik resolver'dan türetir", () => {
    const { liveExpectedNodeCount, nodes } = readD01LiveUniverse();
    expect(nodes).toHaveLength(liveExpectedNodeCount);
  });

  it("module sınırını korur ve code-start durumunu izinli task JSON'a yansıtır", () => {
    const moduleNode = readJson("src/data/generated/nodes/k-archetype-storage.json");
    const contractNode = readJson("src/data/generated/nodes/archetype-storage-contract.json");

    expect(moduleNode.level).toBe("module");
    expect(moduleNode.dependsOn).toEqual(["edu-u25", "scale-cache", "cc-obs-deep"]);
    expect(moduleNode.refs).not.toEqual(expect.arrayContaining([GAP, QUEUE]));
    expect(read(GAP)).toContain("parent JSON bu pakette değiştirilmez");
    expect(read(GAP)).toContain("insan-onaylı changeset");

    expect(contractNode.status).toBe("backlog");
    expect(contractNode.phase).toBe("requirements");
    expect(contractNode.evidence).toEqual([]);
    expect(contractNode.refs).toEqual(expect.arrayContaining([GAP, PACK, QUEUE]));
    expect(contractNode.traceability ?? null).toBeNull();
    expect(contractNode.phases.requirements.notes).toContain("NO-GO");
    expect(read(PACK)).toContain("apps/api/src/meta_api/kernel/archetypes/**");
    expect(read(PACK)).toContain("tests/kernel/archetypes");
  });

  it("KDP kuyruğunu ve typed-action mutasyon sınırını kilitler", () => {
    const queue = readJson(QUEUE);
    const pack = read(PACK);
    const kdp01 = queue.items.find((item: { id: string }) => item.id === "KDP-01");

    expect(queue.baseQueue.currentNextActionable).toBe("PR-01");
    expect(queue.items.map((item: { id: string }) => item.id)).toEqual([
      "KDP-00",
      "KDP-01",
      "KDP-02",
      "KDP-03",
    ]);
    expect(kdp01.status).toBe("blocked");
    expect(queue.humanQueueDecisionRequired).toBe(true);
    for (const item of queue.items) {
      expect(item.codeStartAllowed).toBe(false);
      expect(item.blockedBy).toContain("human-queue-order-decision");
    }
    expect(kdp01).toMatchObject({
      scopeNode: "k-archetype-storage",
      codeBearingNode: "archetype-storage-contract",
    });
    expect(queue.items.find((item: { id: string }) => item.id === "KDP-00")).toMatchObject({
      mode: "contract-readiness-only",
      codeBearingNode: null,
    });
    expect(read(GAP)).toContain("PR-01..PR-11");
    expect(read(PACK)).toContain("task/archetype-storage-contract-record-api");
    for (const token of [
      "DIRECTIVE-ONLY",
      "human-developer-only",
      "generated CRUD yalnız read-only",
      "typed action/command",
      "hard delete",
      "tenant",
      "PDP",
      "audit",
      "outbox",
      "rollback",
    ]) {
      expect(pack).toContain(token);
    }
  });
});
