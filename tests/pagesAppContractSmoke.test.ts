import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const roots: string[] = [];
const checker = path.resolve("tools/agents/check-pages-app-contract-smoke.mjs");

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function writeFixture() {
  const dist = mkdtempSync(path.join(tmpdir(), "actionplan-pages-smoke-"));
  roots.push(dist);
  const html = [
    "<!doctype html>",
    '<script type="module" src="/actionplan/assets/index-test.js"></script>',
    '<link rel="stylesheet" href="/actionplan/assets/index-test.css">',
  ].join("\n");
  const routes = ["", "task/s-clinic", "task/s-clinic-core", "task/dist-clinic"];
  for (const route of routes) {
    const dir = path.join(dist, route);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, "index.html"), html);
  }
  writeFileSync(path.join(dist, "404.html"), html);
  mkdirSync(path.join(dist, "assets"), { recursive: true });
  writeFileSync(
    path.join(dist, "assets/index-test.js"),
    'const dataUrl="/actionplan/data/nodes.json";const router={basepath:"/actionplan/"};',
  );
  writeFileSync(path.join(dist, "assets/index-test.css"), "body{}\n");
  mkdirSync(path.join(dist, "data"), { recursive: true });
  writeFileSync(
    path.join(dist, "data/nodes.json"),
    JSON.stringify([
      {
        id: "s-clinic",
        level: "app",
        artifactKind: "sellable-app",
        dependsOn: ["s-clinic-core"],
        appDefinition: {
          artifactKind: "sellable-app",
          productSlug: "s-clinic",
          appCoreModuleId: "s-clinic-core",
          requiredModuleIds: ["s-clinic-core"],
          classification: { primaryCategory: "sector-app" },
          commercialModel: { licensingModel: "enterprise-subscription" },
          manifest: {
            kernelPrimitiveIds: [
              "k-jurisdiction",
              "k-surface-consumer",
              "scale-invariant",
              "k-calendar-capacity",
            ],
          },
          sdkDelivery: {
            required: true,
            manualEditAllowed: false,
            publicPortsOnly: true,
            kernelInternalsAllowed: false,
          },
          enterpriseDelivery: {
            targetGrade: "enterprise",
            deliveryPolicy: "enterprise-only",
            mvpAllowed: false,
          },
        },
        kernelIntegration: {
          role: "consumer",
          requiredPrimitiveIds: ["k-calendar-capacity"],
          publicBoundary: {
            directKernelInternalsAllowed: false,
            directKernelDatabaseAccessAllowed: false,
            crossContextWritesAllowed: false,
          },
        },
      },
      {
        id: "s-clinic-core",
        level: "module",
        artifactKind: "app-core-module",
        parentId: "s-clinic",
        moduleDefinition: {
          artifactKind: "app-core-module",
          moduleId: "s-clinic-core",
          appId: "s-clinic",
          appCoreModuleId: "s-clinic-core",
          consumedPorts: [
            "kernel.jurisdiction.v1",
            "kernel.consumer-surface.v1",
            "kernel.scale-invariant.v1",
            "kernel.business-time.v1",
          ],
          sdkDelivery: {
            required: true,
            manualEditAllowed: false,
            publicPortsOnly: true,
            kernelInternalsAllowed: false,
          },
          enterpriseDelivery: {
            targetGrade: "enterprise",
            deliveryPolicy: "enterprise-only",
            mvpAllowed: false,
          },
        },
        kernelIntegration: {
          role: "consumer",
          publicBoundary: {
            directKernelInternalsAllowed: false,
            directKernelDatabaseAccessAllowed: false,
            crossContextWritesAllowed: false,
          },
        },
      },
      {
        id: "dist-clinic",
        level: "module",
        artifactKind: "legacy-alias",
        canonicalId: "s-clinic",
        kernelIntegration: {
          role: "not-applicable",
          reason: "Legacy alias uses the canonical app Kernel contract.",
        },
      },
    ]),
  );
  return dist;
}

function runChecker(dist: string) {
  return spawnSync(process.execPath, [checker, "--dist", dist], { encoding: "utf8" });
}

describe("GitHub Pages enterprise app contract smoke", () => {
  it("Pages base-path, deep routes ve typed app/core/alias artefaktlarını kabul eder", () => {
    const result = runChecker(writeFixture());

    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(result.stdout).toContain("3 deep routes");
  });

  it("root-relative asset ile Pages base-path driftini reddeder", () => {
    const dist = writeFixture();
    const index = path.join(dist, "index.html");
    writeFileSync(index, readFileSync(index, "utf8").replace("/actionplan/assets/", "/assets/"));

    const result = runChecker(dist);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("/actionplan/ base path");
  });

  it("legacy alias canonical app bağını kaybederse fail-closed durur", () => {
    const dist = writeFixture();
    const nodesPath = path.join(dist, "data/nodes.json");
    const nodes = JSON.parse(readFileSync(nodesPath, "utf8")) as Array<Record<string, unknown>>;
    const alias = nodes.find((node) => node.id === "dist-clinic");
    if (alias) alias.canonicalId = "wrong-app";
    writeFileSync(nodesPath, JSON.stringify(nodes));

    const result = runChecker(dist);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("dist-clinic.canonicalId");
  });
});
