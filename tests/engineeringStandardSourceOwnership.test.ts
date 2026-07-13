import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("reference-only engineering sources", () => {
  it("maps every hidden engineering Markdown source to a canonical JSON owner", () => {
    const classification = JSON.parse(
      fs.readFileSync(path.join(ROOT, "src/data/doc-task-content-classification.json"), "utf8"),
    ) as Array<{ decision: string; docPath: string; documentClass: string }>;
    const expected = classification
      .filter(
        (entry) =>
          entry.decision === "reference-only" && entry.documentClass === "engineering-standard",
      )
      .map((entry) => entry.docPath)
      .sort();
    const owners = fs
      .readdirSync(path.join(ROOT, "src/data/standards"))
      .filter((file) => file.endsWith(".json"))
      .flatMap((file) => {
        const standard = JSON.parse(
          fs.readFileSync(path.join(ROOT, "src/data/standards", file), "utf8"),
        ) as { references?: string[] };
        return standard.references ?? [];
      });
    const techProfiles = JSON.parse(
      fs.readFileSync(path.join(ROOT, "src/data/tech-profiles.json"), "utf8"),
    ) as { references?: string[] };
    const canonicalSources = new Set([...owners, ...(techProfiles.references ?? [])]);
    const missing = expected.filter((docPath) => !canonicalSources.has(docPath));

    expect(missing, `canonical JSON owner eksik:\n${missing.join("\n")}`).toEqual([]);
  });
});
