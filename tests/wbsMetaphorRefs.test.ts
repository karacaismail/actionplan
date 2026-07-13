import { execFileSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "..");

describe("WBS metaphor gate document refs", () => {
  it("tarihsel sözcük taşıyan gerçek docs path'lerini node anlatı drift'i saymaz", () => {
    expect(() =>
      execFileSync("node", ["tools/agents/check-wbs-metaphors.mjs"], {
        cwd: ROOT,
        encoding: "utf8",
      }),
    ).not.toThrow();
  });
});
