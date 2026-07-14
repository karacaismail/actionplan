import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NODE_DIR = path.join(ROOT, "src", "data", "generated", "nodes");

describe("app/module raw JSON enterprise ve SDK standart bağları", () => {
  const nodes = fs
    .readdirSync(NODE_DIR)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(fs.readFileSync(path.join(NODE_DIR, file), "utf8")))
    .filter((node) => node.level === "app" || node.level === "module");

  it("her app ve module raw JSON içinde iki kanonik ref'i taşır", () => {
    const missing = nodes
      .filter(
        (node) =>
          node.standardRefs?.enterpriseDeliveryRef !== "enterprise-delivery" ||
          node.standardRefs?.sdkDevelopmentRef !== "sdk-development",
      )
      .map((node) => node.id);

    expect(missing, `raw enterprise/SDK ref eksik:\n${missing.join("\n")}`).toEqual([]);
  });
});
