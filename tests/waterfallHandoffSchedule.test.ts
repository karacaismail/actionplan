import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const ROOT = process.cwd();
const CHECKER = path.join(ROOT, "tools/agents/check-waterfall-handoff.mjs");
const SOURCE_NODE = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/data/generated/nodes/s-clinic.json"), "utf8"),
);
const tempDirs: string[] = [];

function validFixture() {
  return {
    ...structuredClone(SOURCE_NODE),
    id: "schedule-fixture",
    slug: "schedule-fixture",
    parentId: null,
    dependsOn: [],
    blocks: [],
    status: "backlog",
    progress: 0,
    schedule: {
      start: null,
      end: null,
      actualStart: null,
      actualEnd: null,
      baselineStart: "2026-07-01",
      baselineEnd: "2026-07-13",
    },
  };
}

function runChecker(node: Record<string, unknown>) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "actionplan-waterfall-"));
  tempDirs.push(dir);
  fs.writeFileSync(path.join(dir, "schedule-fixture.json"), `${JSON.stringify(node, null, 2)}\n`);
  return spawnSync(process.execPath, [CHECKER], {
    cwd: ROOT,
    env: { ...process.env, WATERFALL_NODE_DIR: dir },
    encoding: "utf8",
  });
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe("waterfall handoff schedule semantics", () => {
  it("accepts a typed zero-progress backlog whose expired plan is preserved only as baseline", () => {
    const result = runChecker(validFixture());

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    expect(result.stdout).toContain("SONUÇ: YEŞİL");
  });

  it("accepts a complete current schedule pair", () => {
    const node = validFixture();
    node.schedule.start = "2026-08-01";
    node.schedule.end = "2026-08-20";

    const result = runChecker(node);

    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  });

  it("rejects a partial current schedule pair", () => {
    const node = validFixture();
    node.schedule.start = "2026-08-01";

    const result = runChecker(node);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("schedule-current-pair-bozuk: schedule-fixture");
  });

  it("rejects baseline-only schedules on untyped tasks", () => {
    const node = validFixture();
    node.appDefinition = undefined;

    const result = runChecker(node);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("schedule-current-yok: schedule-fixture");
  });

  it("rejects actual execution dates in a historical zero-progress backlog state", () => {
    const node = validFixture();
    node.schedule.actualStart = "2026-07-02";

    const result = runChecker(node);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("schedule-current-yok: schedule-fixture");
  });

  it("rejects baseline-only state when the frozen plan is not historical", () => {
    const node = validFixture();
    node.schedule.baselineStart = "2026-08-01";
    node.schedule.baselineEnd = "2026-08-20";

    const result = runChecker(node);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("schedule-current-yok: schedule-fixture");
  });

  it("rejects a missing baseline pair even when current dates exist", () => {
    const node = validFixture();
    node.schedule.start = "2026-08-01";
    node.schedule.end = "2026-08-20";
    node.schedule.baselineEnd = null;

    const result = runChecker(node);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("schedule-baseline-yok: schedule-fixture");
  });
});
