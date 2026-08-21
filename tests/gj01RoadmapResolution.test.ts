import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

// GJ01 Roadmap Resolution: a reference-only record freezing the ActionGateway contract,
// business-persistence and typed-bridge ownership, the ASGI-only Delivery/HTTP decision, the
// framework deferral, the legacy-platform/Django no-carryover classification, the stale
// PKG14-19 branch disposition and the first feature package selection. It pins Actionplan
// c34ab04 and public Kernel 8c2e5f0 and consumes src/data/standards-applicability.json by
// sourceCommit reference, never restating its owned values.
const ROOT = process.cwd();
const RECORD = "reports/gj01-roadmap-resolution-2026-08-21.json";
const VALIDATOR = "tools/lib/gj01-roadmap-resolution.mjs";
const APPLICABILITY = "actionplan-kernel-governance-gj01-roadmap-resolution";
const ACTIONPLAN_SHA = "c34ab04ac3a0846ee29386ad495a68efd99891d5";
const KERNEL_SHA = "8c2e5f0acf52338d2617547fad6585dd459b75f4";
// biome-ignore format: the closed record root key set, sorted; a quietly added or dropped root is a diff
const ROOT_KEYS = ["actionGateway", "applicability", "businessPersistenceOwner", "canonicalRefs", "frameworkDecision", "generatedAt", "httpDelivery", "id", "legacyPlatform", "nonGoals", "prohibitions", "roadmap", "schemaVersion", "scopeHash", "staleBranches", "status", "typedBridge"];

const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const readJson = (relative: string) => JSON.parse(read(relative));
const exists = (relative: string) => fs.existsSync(path.join(ROOT, relative));
// biome-ignore lint/suspicious/noExplicitAny: the shipped pure JavaScript validator has no declaration file.
const load = async (relative: string): Promise<any> => import(pathToFileURL(path.join(ROOT, relative)).href);
// biome-ignore lint/suspicious/noExplicitAny: the validator consumes untyped JSON documents.
const clone = (value: any): any => JSON.parse(JSON.stringify(value));

describe("GJ01 roadmap resolution reference-only record", () => {
  it("exists, is closed, and pins Actionplan/Kernel base plus the standards-applicability source commit", () => {
    expect(exists(RECORD), `record-missing:${RECORD}`).toBe(true);
    const record = readJson(RECORD);
    expect(Object.keys(record).sort(), "record-root-key-drift").toEqual(ROOT_KEYS);
    expect(record.applicability).toBe(APPLICABILITY);
    expect(record.canonicalRefs.actionplanBase.sha).toBe(ACTIONPLAN_SHA);
    expect(record.canonicalRefs.kernelBase.sha).toBe(KERNEL_SHA);
    expect(exists(record.canonicalRefs.standardsApplicability.path)).toBe(true);
    expect(record.canonicalRefs.standardsApplicability.sourceCommit).toMatch(/^[0-9a-f]{40}$/);
  });

  it("freezes the ActionGateway contract, ownership, framework deferral and HTTP/Delivery decision", () => {
    const record = readJson(RECORD);
    expect(record.actionGateway).toEqual({
      signature: "ActionGateway.execute(ActionSpec) -> ActionOutcome | CommitReceipt",
      status: "FROZEN",
    });
    expect(record.businessPersistenceOwner).toBe("APPLICATION");
    expect(record.typedBridge).toEqual({
      owner: "GENERATED_SDK_PACKAGE_FROM_KERNEL_CONTRACTS",
      artifactStatus: "ABSENT_CLOSED",
    });
    expect(record.frameworkDecision).toBe("DEFERRED_UNTIL_V4");
    expect(record.httpDelivery).toEqual({
      transport: "ASGI",
      scope: "DELIVERY_ONLY",
      referenceServer: "UVICORN_DEFAULT",
      conformanceServer: "HYPERCORN_CONFORMANCE",
      fastapiRole: "OPTIONAL_ADAPTER_NEVER_DEVELOPMENT_BASE",
    });
  });

  it("classifies dirty legacy platform as archive evidence, Django as no-carryover, and PKG14-19 as historical", () => {
    const record = readJson(RECORD);
    expect(record.legacyPlatform).toEqual({
      dirtyRootClassification: "ARCHIVE_EVIDENCE",
      djangoStatus: "DELETED_ABSENT_NO_CARRYOVER",
    });
    expect(record.staleBranches).toEqual({
      range: "PKG14-PKG19",
      base: "60568",
      status: "HISTORICAL_NO_CARRYOVER",
    });
    expect(record.roadmap).toEqual({
      firstFeaturePackage: "GJ01-V0-FAILURE-ARCHAEOLOGY",
      resolvedFromLiveEvidence: true,
      capabilityDelta: "NONE",
    });
  });

  it("fails closed on pin, owner, framework, package, applicability and scopeHash drift", async () => {
    expect(exists(VALIDATOR), `validator-missing:${VALIDATOR}`).toBe(true);
    const record = readJson(RECORD);
    const { evaluateRoadmapResolution, computeScopeHash, RECORD_ROOT_KEYS } = await load(VALIDATOR);
    expect(RECORD_ROOT_KEYS).toEqual(ROOT_KEYS);
    const clean = evaluateRoadmapResolution({ record });
    expect(clean.errors, "clean-record-rejected").toEqual([]);
    expect(clean.accepted).toBe(true);
    expect(record.scopeHash).toBe(computeScopeHash(record));

    const drift = (mutate: (r: unknown) => void) => {
      const r = clone(record);
      mutate(r);
      return evaluateRoadmapResolution({ record: r });
    };
    expect(drift((r: any) => { r.canonicalRefs.kernelBase.sha = "0".repeat(40); }).accepted, "kernel-pin-drift-not-refused").toBe(false);
    expect(drift((r: any) => { r.canonicalRefs.actionplanBase.sha = "0".repeat(40); }).accepted, "actionplan-pin-drift-not-refused").toBe(false);
    expect(drift((r: any) => { r.businessPersistenceOwner = "KERNEL"; }).accepted, "owner-drift-not-refused").toBe(false);
    expect(drift((r: any) => { r.typedBridge.artifactStatus = "PRESENT"; }).accepted, "typed-bridge-drift-not-refused").toBe(false);
    expect(drift((r: any) => { r.frameworkDecision = "FASTAPI_NOW"; }).accepted, "framework-drift-not-refused").toBe(false);
    expect(drift((r: any) => { r.staleBranches.status = "carry-over"; }).accepted, "package-drift-not-refused").toBe(false);
    expect(drift((r: any) => { r.applicability = "other"; }).accepted, "applicability-drift-not-refused").toBe(false);
    expect(drift((r: any) => { r.scopeHash = "deadbeef"; }).accepted, "hash-drift-not-refused").toBe(false);
    expect(drift((r: any) => { r.extraRoot = "x"; }).accepted, "unknown-root-not-refused").toBe(false);
    expect(drift(() => {}).accepted, "harness-rejects-clean").toBe(true);
  });
});
