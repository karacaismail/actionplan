import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")) as {
  scripts: Record<string, string>;
};
const deploy = fs.readFileSync(path.join(ROOT, ".github/workflows/deploy.yml"), "utf8");

const releaseGates = [
  "qa:platform-write-boundary",
  "qa:ui-delivery",
  "qa:market-readiness",
  "qa:finance-model",
  "qa:storybook-registry",
  "qa:atom",
];

describe("local and Pages release gate parity", () => {
  it.each(releaseGates)("%s is a named local gate and part of qa:ci", (gate) => {
    expect(pkg.scripts[gate], `${gate} named script`).toBeTruthy();
    expect(pkg.scripts["qa:ci"], `${gate} missing from qa:ci`).toContain(`npm run ${gate}`);
  });

  it.each(releaseGates)("deploy invokes the same named %s gate", (gate) => {
    expect(deploy).toContain(`run: npm run ${gate}`);
  });

  it("the UI gate runs its focused governance and DOC-APPLY regression tests", () => {
    expect(pkg.scripts["qa:ui-delivery"]).toContain("check-ui-delivery.mjs");
    expect(pkg.scripts["qa:ui-delivery"]).toContain("uiDeliveryGovernance.test.ts");
    expect(pkg.scripts["qa:ui-delivery"]).toContain("docAppliedUiRoleIsolation.test.ts");
  });
});
