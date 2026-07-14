import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const sha256 = (relative: string) => createHash("sha256").update(read(relative)).digest("hex");

const seedContracts = [
  {
    path: "tools/agents/seed-edu.mjs",
    nodeIds: [
      "app-edu",
      "edu-overview",
      "edu-u01",
      "edu-u02",
      "edu-u02b",
      "edu-u03",
      "edu-u04",
      "edu-u04b",
      "edu-u05",
      "edu-u06",
      "edu-u07",
      "edu-u08",
      "edu-u09",
      "edu-u10",
      "edu-u11",
      "edu-u12",
      "edu-u13",
      "edu-u14",
      "edu-u15",
      "edu-u16",
      "edu-u17",
      "edu-u18",
      "edu-u19",
      "edu-u20",
      "edu-u21",
      "edu-u22",
      "edu-u23",
      "edu-u24",
      "edu-u25",
      "edu-vibecoding-ilk-nokta",
      "edu-vibecoding-waterfall-fastapi",
    ],
  },
  {
    path: "tools/agents/seed-egitim.mjs",
    nodeIds: [
      "app-egitim",
      "edu-baslangic-rotasi",
      "edu-faz-haritasi",
      "edu-prompt-kutuphanesi",
      "edu-waterfall-yol-haritasi",
      "edu-yetkinlik-modeli",
    ],
  },
  {
    path: "tools/agents/seed-kararlar.mjs",
    nodeIds: [
      "app-kararlar",
      "adr-0001",
      "adr-0002",
      "adr-0003",
      "adr-0004",
      "adr-0005",
      "adr-0006",
      "adr-0007",
      "adr-0008",
      "adr-0009",
      "adr-0010",
      "adr-0011",
      "adr-0012",
      "adr-0013",
      "adr-0014",
      "adr-0015",
      "adr-0016",
      "adr-0017",
      "adr-0018",
      "adr-0019",
      "adr-0020",
      "adr-0021",
      "adr-0022",
      "adr-0023",
      "adr-0024",
      "adr-0025-frontend-stack-uzlastirma",
    ],
  },
  {
    path: "tools/agents/seed-sus.mjs",
    nodeIds: [
      "app-sus",
      "app-sus-x-atom",
      "app-sus-x-molekul",
      "app-sus-x-kum",
      "sus-overview",
      "sus-actions",
      "sus-ai-uretim-sozlesmesi",
      "sus-bc-policy",
      "sus-bitemporal",
      "sus-boundaries",
      "sus-codemod",
      "sus-conformance",
      "sus-declarative",
      "sus-durable",
      "sus-metadata",
      "sus-timi",
      "sus-versioning",
      "sus-lisans",
      "sus-lisans-tr-hukuk",
      "sus-lisans-vakalar",
      "sus-llm-hata-katalogu",
    ],
  },
] as const;

const authorityTokens = [
  "ARCHIVED-LEGACY-MUTATOR",
  "FAIL-CLOSED",
  "Codex → PM → uzman ajanlar → Claude workers/slaves",
  "read-only-audit",
  "human-developer-only",
];

describe("legacy canonical seed karantinası", () => {
  it("84 benzersiz canonical hedefi açık envanterler", () => {
    const nodeIds = seedContracts.flatMap((contract) => [...contract.nodeIds]);
    expect(nodeIds).toHaveLength(84);
    expect(new Set(nodeIds).size).toBe(84);
    for (const nodeId of nodeIds)
      expect(fs.existsSync(path.join(ROOT, `src/data/generated/nodes/${nodeId}.json`))).toBe(true);
  });

  it.each(seedContracts)(
    "$path doğrudan mutator yerine fail-closed arşivdir",
    ({ path: seedPath }) => {
      const source = read(seedPath);
      for (const token of authorityTokens) expect(source).toContain(token);
      for (const forbidden of ["seed-docs-lib.mjs", "apply(", "writeFileSync", "const CONTENT"])
        expect(source).not.toContain(forbidden);
    },
  );

  it("dört entrypoint exit 2 verir ve 84 canonical node'un hiçbir byte'ını değiştirmez", () => {
    for (const contract of seedContracts)
      if (!read(contract.path).includes("ARCHIVED-LEGACY-MUTATOR"))
        throw new Error(`UNSAFE-TEST-STOP: ${contract.path} karantinaya alınmadan çalıştırılamaz`);

    const nodeIds = seedContracts.flatMap((contract) => [...contract.nodeIds]);
    const before = new Map(
      nodeIds.map((nodeId) => [nodeId, sha256(`src/data/generated/nodes/${nodeId}.json`)]),
    );
    for (const contract of seedContracts) {
      const result = spawnSync(process.execPath, [path.join(ROOT, contract.path)], {
        cwd: ROOT,
        encoding: "utf8",
      });
      expect(result.status).toBe(2);
      for (const token of authorityTokens) expect(result.stderr).toContain(token);
    }
    for (const nodeId of nodeIds)
      expect(sha256(`src/data/generated/nodes/${nodeId}.json`)).toBe(before.get(nodeId));
  });

  it("platform boundary gate dört seed entrypoint'ini fail-closed tarar", () => {
    const gate = read("tools/agents/check-platform-write-boundary.mjs");
    for (const token of [
      "legacySeedPaths",
      "ARCHIVED-LEGACY-MUTATOR",
      "seed-edu.mjs",
      "seed-sus.mjs",
    ])
      expect(gate).toContain(token);
  });
});
