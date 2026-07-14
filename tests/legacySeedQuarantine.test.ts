import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
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

// --- Q3 tam quarantine: shared + Q2 + Q3 wholesale arşiv ailesi -------------------------
// 8 shared-mutator tüketici + 11 Q2 wholesale arşiv stub + 9 Q3 wholesale arşiv stub +
// helper + public agents:seed rotası fail-closed olmalı. Q3 ile pending=0: bekleyen doğrudan
// yazıcı KALMAZ. Statik kapı YEŞİL olana kadar hiçbir Q3 hedefi spawn/import EDİLMEZ.
const GUARD_PATH = "tools/agents/legacy-seed-quarantine.mjs";
const HELPER_PATH = "tools/agents/seed-docs-lib.mjs";
const Q3_GATE_PATH = "tools/agents/check-legacy-seed-quarantine.mjs";
const sharedEntrypoints = [
  "tools/agents/seed-build.mjs",
  "tools/agents/seed-edu.mjs",
  "tools/agents/seed-egitim.mjs",
  "tools/agents/seed-genel.mjs",
  "tools/agents/seed-kararlar.mjs",
  "tools/agents/seed-landx.mjs",
  "tools/agents/seed-meta.mjs",
  "tools/agents/seed-sus.mjs",
] as const;
// Q2: wholesale arşive alınan 11 doğrudan yazıcı — tek koşulsuz guard'ı import eden stub.
const guardedQ2 = [
  "tools/agents/seed-aday.mjs",
  "tools/agents/seed-core-operations.mjs",
  "tools/agents/seed-crosscut.mjs",
  "tools/agents/seed-frontend.mjs",
  "tools/agents/seed-kernel.mjs",
  "tools/agents/seed-kernel-deep.mjs",
  "tools/agents/seed-layer0.mjs",
  "tools/agents/seed-layer1.mjs",
  "tools/agents/seed-platform-horizontal.mjs",
  "tools/agents/seed-scale.mjs",
  "tools/seed-pilot-traceability.mjs",
] as const;
// Q3: wholesale arşive alınan son 9 doğrudan yazıcı — tek koşulsuz guard'ı import eden stub.
const guardedQ3 = [
  "tools/agents/seed-backend.mjs",
  "tools/agents/seed-content-collaboration.mjs",
  "tools/agents/seed-customer-revenue.mjs",
  "tools/agents/seed-data-intelligence.mjs",
  "tools/agents/seed-dx-atomic.mjs",
  "tools/agents/seed-finance.mjs",
  "tools/agents/seed-hr.mjs",
  "tools/agents/seed-supply-chain.mjs",
  "tools/agents/seed-vertical.mjs",
] as const;
// Q3 sonrası pending set BOŞ: bekleyen doğrudan yazıcı kalmaz (pending=0).
const pendingDirectWriters = [] as const;

describe("Q3 legacy seed tam karantinası — statik kapsam (29 dosya, pending=0)", () => {
  it("statik kapı (check-legacy-seed-quarantine) yeşil çıkar", () => {
    const result = spawnSync(process.execPath, [path.join(ROOT, Q3_GATE_PATH)], {
      cwd: ROOT,
      encoding: "utf8",
    });
    expect(result.stdout + result.stderr).toContain("SONUÇ: YEŞİL");
    expect(result.status).toBe(0);
  });

  it("korpus 29 = 8 shared + 11 Q2 + 9 Q3 + helper; pending=0; kesişim yok", () => {
    expect(sharedEntrypoints).toHaveLength(8);
    expect(guardedQ2).toHaveLength(11);
    expect(guardedQ3).toHaveLength(9);
    expect(pendingDirectWriters).toHaveLength(0);
    const all = new Set([...sharedEntrypoints, ...guardedQ2, ...guardedQ3, HELPER_PATH]);
    expect(all.size).toBe(29);
    for (const seedPath of [...sharedEntrypoints, ...guardedQ2, ...guardedQ3, HELPER_PATH])
      expect(fs.existsSync(path.join(ROOT, seedPath))).toBe(true);
  });

  it("tek koşulsuz guard markörleri taşır, env/argv bypass içermez", () => {
    const guard = read(GUARD_PATH);
    for (const token of ["ARCHIVED-LEGACY-MUTATOR", "FAIL-CLOSED", "process.exit(2)"])
      expect(guard).toContain(token);
    for (const bypass of [
      "ALLOW_LEGACY_SEED",
      "SEED_APPLY",
      "process.env",
      "process.argv",
      "--force",
    ])
      expect(guard).not.toContain(bypass);
  });

  it("helper fail-closed: guard import eder, canonical writer izi taşımaz", () => {
    const helper = read(HELPER_PATH);
    expect(helper).toContain('import "./legacy-seed-quarantine.mjs"');
    expect(helper).toContain("ARCHIVED-LEGACY-MUTATOR");
    for (const forbidden of [
      "writeFileSync",
      "NODES_DIR",
      "node:fs",
      "readFileSync",
      "featureDefs",
    ])
      expect(helper).not.toContain(forbidden);
  });

  it("8 shared-mutator tüketici inline stub veya fail-closed helper importu ile guarded", () => {
    for (const seedPath of sharedEntrypoints) {
      const source = read(seedPath);
      const inlineStub =
        source.includes("ARCHIVED-LEGACY-MUTATOR") && source.includes("process.exit(2)");
      const viaHelper = source.includes('from "./seed-docs-lib.mjs"');
      expect(inlineStub || viaHelper).toBe(true);
    }
  });

  it("11 Q2 wholesale arşiv stub tek koşulsuz guard'ı import eder, writer izi taşımaz", () => {
    for (const seedPath of guardedQ2) {
      const source = read(seedPath);
      const specifier = seedPath.startsWith("tools/agents/")
        ? "./legacy-seed-quarantine.mjs"
        : "./agents/legacy-seed-quarantine.mjs";
      expect(source).toContain(`import "${specifier}"`);
      expect(source).toContain("ARCHIVED-LEGACY-MUTATOR");
      expect(source).toContain("FAIL-CLOSED");
      for (const forbidden of [
        "writeFileSync",
        "readFileSync",
        "node:fs",
        "NODES",
        "const CONTENT",
        "apply(",
        "featureDefs",
      ])
        expect(source).not.toContain(forbidden);
      for (const bypass of [
        "ALLOW_LEGACY_SEED",
        "SEED_APPLY",
        "process.env",
        "process.argv",
        "--force",
      ])
        expect(source).not.toContain(bypass);
    }
  });

  it("9 Q3 wholesale arşiv stub tek koşulsuz guard'ı import eder, writer izi taşımaz", () => {
    for (const seedPath of guardedQ3) {
      const source = read(seedPath);
      expect(source).toContain('import "./legacy-seed-quarantine.mjs"');
      expect(source).toContain("ARCHIVED-LEGACY-MUTATOR");
      expect(source).toContain("FAIL-CLOSED");
      for (const forbidden of [
        "writeFileSync",
        "readFileSync",
        "node:fs",
        "NODES",
        "const CONTENT",
        "apply(",
        "featureDefs",
      ])
        expect(source).not.toContain(forbidden);
      for (const bypass of [
        "ALLOW_LEGACY_SEED",
        "SEED_APPLY",
        "process.env",
        "process.argv",
        "--force",
      ])
        expect(source).not.toContain(bypass);
    }
  });

  it("public agents:seed rotası guard'a gider, seed-kernel'e gitmez", () => {
    const pkg = JSON.parse(read("package.json"));
    const agentsSeed = pkg.scripts["agents:seed"] as string;
    expect(agentsSeed).toContain("legacy-seed-quarantine.mjs");
    expect(agentsSeed).not.toContain("seed-kernel");
    const qa = pkg.scripts["qa:legacy-seed-quarantine"] as string;
    expect(qa).toContain("check-legacy-seed-quarantine.mjs");
    expect(qa).toContain("legacySeedQuarantine.test");
    expect(qa.indexOf("check-legacy-seed-quarantine.mjs")).toBeLessThan(
      qa.indexOf("legacySeedQuarantine.test"),
    );
  });
});

// --- Q4 final-state doküman invariantı: docs/next-30-days-plan.md -----------------------
// Q2 ile seed-platform-horizontal arşiv stub'a alındı, Q3 ile pending=0 oldu. Plan artık onu
// "pending doğrudan yazıcı" olarak tanımlayan STALE iddiayı taşıyamaz; kararlı bir final markör
// ile 29 dosya · 28 entrypoint + 1 helper · fail-closed · pending=0 son durumunu bildirmelidir.
// Stale ifade dönerse VEYA bir markör eksikse hem statik kapı hem bu test fail-closed kırılır.
const PLAN_PATH = "docs/next-30-days-plan.md";
const planStalePhrases = ["pending doğrudan yazıcıdır"] as const;
const planFinalMarkers = [
  "LEGACY-SEED-QUARANTINE-FINAL",
  "29 dosya",
  "28 entrypoint + 1 helper",
  "fail-closed",
  "pending=0",
] as const;

describe("Q4 final-state doküman karantinası — next-30-days-plan.md", () => {
  it("plan stale 'pending doğrudan yazıcı' iddiasını taşımaz", () => {
    const plan = read(PLAN_PATH);
    for (const stale of planStalePhrases) expect(plan).not.toContain(stale);
  });

  it("plan kararlı final markörle 29 dosya · 28 entrypoint + 1 helper · fail-closed · pending=0 bildirir", () => {
    const plan = read(PLAN_PATH);
    for (const marker of planFinalMarkers) expect(plan).toContain(marker);
  });

  it("statik kapı doküman invariantını fail-closed uygular (stale/eksik markör = KIRMIZI)", () => {
    const result = spawnSync(process.execPath, [path.join(ROOT, Q3_GATE_PATH)], {
      cwd: ROOT,
      encoding: "utf8",
    });
    const plan = read(PLAN_PATH);
    const staleClean = planStalePhrases.every((stale) => !plan.includes(stale));
    const markersPresent = planFinalMarkers.every((marker) => plan.includes(marker));
    if (staleClean && markersPresent) {
      expect(result.status).toBe(0);
      expect(result.stdout + result.stderr).toContain("SONUÇ: YEŞİL");
    } else {
      expect(result.status).not.toBe(0);
      expect(result.stdout + result.stderr).toContain("SONUÇ: KIRMIZI");
    }
  });
});

describe("Q3 legacy seed tam karantinası — davranış (statik kanıttan SONRA)", () => {
  const fuzzEnv = { ...process.env, ALLOW_LEGACY_SEED: "1", SEED_APPLY: "1", CI: "false" };
  const guardTargets: string[] = [
    GUARD_PATH,
    HELPER_PATH,
    ...sharedEntrypoints,
    ...guardedQ2,
    ...guardedQ3,
  ];

  const staticGateGreen = () => {
    const gate = spawnSync(process.execPath, [path.join(ROOT, Q3_GATE_PATH)], {
      cwd: ROOT,
      encoding: "utf8",
    });
    return gate.status === 0;
  };

  // Fail-safe: statik kapı yeşil değilse hiçbir probu çalıştırma; pending set (pending=0) ASLA
  // spawn edilmez ve kapsam dışı hiçbir hedef koşturulmaz.
  const assertProbeSafe = (target: string) => {
    if (!staticGateGreen())
      throw new Error("UNSAFE-TEST-STOP: statik kapı yeşil değil, davranış probu çalıştırılamaz");
    if ((pendingDirectWriters as readonly string[]).includes(target))
      throw new Error(`UNSAFE-TEST-STOP: pending doğrudan yazıcı spawn edilemez: ${target}`);
    if (!guardTargets.includes(target))
      throw new Error(`UNSAFE-TEST-STOP: kapsam dışı hedef: ${target}`);
  };

  const hashCanonicalUniverse = () => {
    const files = [
      ...fs
        .readdirSync(path.join(ROOT, "src/data/generated/nodes"))
        .filter((file) => file.endsWith(".json"))
        .sort()
        .map((file) => `src/data/generated/nodes/${file}`),
      "src/data/generated/index.json",
      "src/data/generated/navigation.json",
      "src/data/generated/meta.json",
      "public/data/nodes.json",
      "reports/doc-task-content-matrix.csv",
    ];
    const digest = createHash("sha256");
    for (const rel of files) digest.update(rel).update("\0").update(read(rel)).update("\0");
    return { count: files.length, hash: digest.digest("hex") };
  };

  it("statik kapı davranış problarından ÖNCE yeşil olmalı", () => {
    expect(staticGateGreen()).toBe(true);
  });

  it.each(guardTargets)("%s doğrudan çalıştırma env+argv fuzz'a rağmen exit 2", (target) => {
    assertProbeSafe(target);
    const result = spawnSync(process.execPath, [path.join(ROOT, target), "--force"], {
      cwd: ROOT,
      encoding: "utf8",
      env: fuzzEnv,
    });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("ARCHIVED-LEGACY-MUTATOR");
    expect(result.stderr).toContain("FAIL-CLOSED");
  });

  it.each(guardTargets)("%s dinamik import env fuzz'a rağmen exit 2", (target) => {
    assertProbeSafe(target);
    const url = pathToFileURL(path.join(ROOT, target)).href;
    const result = spawnSync(
      process.execPath,
      ["--input-type=module", "-e", `await import(${JSON.stringify(url)});`],
      { cwd: ROOT, encoding: "utf8", env: fuzzEnv },
    );
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("ARCHIVED-LEGACY-MUTATOR");
    expect(result.stderr).toContain("FAIL-CLOSED");
  });

  it("617 canonical + türev dosya SHA-256 prob öncesi/sonrası birebir aynı", () => {
    const before = hashCanonicalUniverse();
    // 617 node + generated index/navigation/meta + public/data/nodes.json + matrix.csv
    expect(before.count).toBe(622);
    for (const target of guardTargets) {
      assertProbeSafe(target);
      spawnSync(process.execPath, [path.join(ROOT, target), "--force"], {
        cwd: ROOT,
        encoding: "utf8",
        env: fuzzEnv,
      });
      const url = pathToFileURL(path.join(ROOT, target)).href;
      spawnSync(
        process.execPath,
        ["--input-type=module", "-e", `await import(${JSON.stringify(url)});`],
        { cwd: ROOT, encoding: "utf8", env: fuzzEnv },
      );
    }
    const after = hashCanonicalUniverse();
    expect(after.hash).toBe(before.hash);
  });
});
