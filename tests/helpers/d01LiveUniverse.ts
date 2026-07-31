import fs from "node:fs";
import path from "node:path";
// @ts-expect-error -- the JavaScript governance helper intentionally has no declaration file.
import { resolveD01NodeUniverse } from "../../tools/lib/kernel-node-universe.mjs";

type Options = {
  root?: string;
  nodeDir?: string;
  handoffPath?: string;
};

export function readD01LiveUniverse(options: Options = {}) {
  const root = options.root ?? process.cwd();
  const nodeDir = options.nodeDir ?? path.join(root, "src/data/generated/nodes");
  const handoffPath =
    options.handoffPath ??
    path.join(root, "reports/kernel-code-bearing-descendant-handoff-2026-07-15.json");
  const nodeRecords = fs
    .readdirSync(nodeDir)
    .filter((filename) => filename.endsWith(".json"))
    .sort()
    .map((filename) => ({
      filename,
      node: JSON.parse(fs.readFileSync(path.join(nodeDir, filename), "utf8")),
    }));
  const handoff = JSON.parse(fs.readFileSync(handoffPath, "utf8"));
  const validatedLiveUniverse = resolveD01NodeUniverse({ records: nodeRecords, handoff });

  return {
    handoff,
    nodeRecords,
    nodes: nodeRecords.map(({ node }) => node),
    validatedLiveUniverse,
    liveExpectedNodeCount: validatedLiveUniverse.expectedNodeCount,
  };
}
