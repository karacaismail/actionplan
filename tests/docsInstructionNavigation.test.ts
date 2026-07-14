import { execFileSync } from "node:child_process";
import * as DocsViewModule from "@/views/DocsView";
import { describe, expect, it } from "vitest";

interface DocEntry {
  docPath: string;
  slug: string;
}

const exported = DocsViewModule as unknown as {
  ALL_DOCS?: DocEntry[];
  DOCS?: DocEntry[];
  isCatalogedDocPath?: (docPath: string) => boolean;
  isSidebarDocPath?: (docPath: string) => boolean;
};

describe("docs navigation vs task content ownership", () => {
  it("shows only the root index in the sidebar", () => {
    expect(exported.DOCS?.map((doc) => doc.docPath)).toEqual(["docs/README.md"]);
  });

  it("keeps all 292 tracked sources in the direct-link catalog", () => {
    const tracked = execFileSync("git", ["ls-files", "docs/*.md", "docs/**/*.md"], {
      encoding: "utf8",
    })
      .trim()
      .split("\n")
      .filter(Boolean)
      .sort();
    expect(tracked).toHaveLength(292);
    expect(exported.ALL_DOCS?.map((doc) => doc.docPath).sort()).toEqual(tracked);
  });

  it("fails closed for an unclassified local markdown file", () => {
    expect(exported.isCatalogedDocPath).toBeTypeOf("function");
    expect(exported.isSidebarDocPath).toBeTypeOf("function");
    expect(exported.isCatalogedDocPath?.("docs/local-unclassified.md")).toBe(false);
    expect(exported.isSidebarDocPath?.("docs/local-unclassified.md")).toBe(false);
  });
});
