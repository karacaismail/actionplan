import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(import.meta.dirname, "..");

describe("GitHub Pages statik rotaları", () => {
  it("DocsView iç içe markdown dosyalarını recursive paketler", () => {
    const source = fs.readFileSync(path.join(ROOT, "src/views/DocsView.tsx"), "utf8");
    expect(source).toContain('import.meta.glob("/docs/**/*.md"');
    expect(source).toContain('replaceAll("/", "--")');
  });

  it("spa404 nested doküman ve her WBS görevi için 200 dönen statik rota üretir", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "actionplan-doc-routes-"));
    fs.mkdirSync(path.join(cwd, "dist"), { recursive: true });
    fs.mkdirSync(path.join(cwd, "docs/standards"), { recursive: true });
    fs.mkdirSync(path.join(cwd, "src/data/generated/nodes"), { recursive: true });
    fs.writeFileSync(path.join(cwd, "dist/index.html"), "<html>ok</html>");
    fs.writeFileSync(path.join(cwd, "docs/README.md"), "# Docs");
    fs.writeFileSync(path.join(cwd, "docs/standards/00-index.md"), "# Standards");
    fs.writeFileSync(path.join(cwd, "src/data/generated/nodes/customer.json"), '{"id":"customer"}');
    fs.writeFileSync(path.join(cwd, "src/data/generated/nodes/s-clm.json"), '{"id":"s-clm"}');

    const run = spawnSync(process.execPath, [path.join(ROOT, "tools/spa404.mjs")], {
      cwd,
      encoding: "utf8",
    });
    expect(run.status, run.stderr).toBe(0);
    expect(fs.existsSync(path.join(cwd, "dist/docs/standards--00-index/index.html"))).toBe(true);
    expect(fs.existsSync(path.join(cwd, "dist/task/customer/index.html"))).toBe(true);
    expect(fs.existsSync(path.join(cwd, "dist/task/s-clm/index.html"))).toBe(true);
  });
});
