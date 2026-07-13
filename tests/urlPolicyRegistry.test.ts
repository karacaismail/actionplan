import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { StandardContractSchema, TaskNodeSchema, UrlPolicyRegistrySchema } from "@/schemas";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (relative: string) =>
  JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
const registry = () => UrlPolicyRegistrySchema.parse(readJson("src/data/url-policy/registry.json"));

describe("URLP-M1 makine-okunur registry", () => {
  it("registry kanonik metadata ve kilitli gramerleri taşır", () => {
    const r = registry();
    expect(r.id).toBe("k-route-policy");
    expect(r.status).toBe("active");
    expect(r.canonicalDoc).toBe("docs/url-policy.md");
    expect(r.implementationProgramRef).toBe("src/data/url-policy/implementation-program.json");
    expect(r.defaults.workspaceTopology).toBe("tenant-subdomain-suite-path");
    expect(r.defaults.privatePiiTemplate).toBe("/{app}/{collection}/{typedId}");
    expect(r.defaults.publicTemplate).toBe("/{locale}/{mount?}/{collection}/{typedId}/{asciiSlug}");
    expect(r.defaults.graphqlPath).toBe("/graphql");
  });

  it("11 resource kind/prefix tekil, random ve bounded-context sahipliğindedir", () => {
    const kinds = registry().resourceKinds;
    expect(kinds.map((x) => x.prefix)).toEqual([
      "p_",
      "usr_",
      "emp_",
      "org_",
      "co_",
      "inv_",
      "po_",
      "wo_",
      "prd_",
      "lst_",
      "rpt_",
    ]);
    expect(new Set(kinds.map((x) => x.kind)).size).toBe(kinds.length);
    expect(new Set(kinds.map((x) => x.prefix)).size).toBe(kinds.length);
    for (const kind of kinds) {
      expect(kind.idStrategy).toBe("random-128-crockford-base32");
      expect(kind.ownerBoundedContext.length).toBeGreaterThan(0);
    }
  });

  it("route/projection/host/slug referansları çözülür ve canonical tekildir", () => {
    const r = registry();
    const routeIds = new Set(r.routeDefinitions.map((x) => x.routeId));
    const hostIds = new Set(r.hostBindingProfiles.map((x) => x.id));
    const slugIds = new Set(r.slugProfiles.map((x) => x.id));
    expect(routeIds.size).toBe(r.routeDefinitions.length);
    for (const p of r.routeProjections) {
      expect(routeIds.has(p.routeRef), `dangling routeRef: ${p.routeRef}`).toBe(true);
      expect(hostIds.has(p.hostBindingProfileRef), `dangling host ref: ${p.id}`).toBe(true);
      if (p.canonicalSlugProfileRef)
        expect(slugIds.has(p.canonicalSlugProfileRef), `dangling slug ref: ${p.id}`).toBe(true);
    }
    const canonicalKeys = r.routeProjections
      .filter((x) => x.canonical)
      .map((x) => `${x.routeRef}:${x.hostBindingProfileRef}`);
    expect(new Set(canonicalKeys).size).toBe(canonicalKeys.length);
  });

  it("private PII ID-only, public locale+typedId+ASCII slug ve GraphQL-first kalır", () => {
    const routes = new Map(registry().routeDefinitions.map((x) => [x.routeId, x]));
    expect(routes.get("workspace.private-pii-detail")?.pathTemplate).toBe(
      "/{app}/{collection}/{typedId}",
    );
    expect(routes.get("public.indexable-detail")?.pathTemplate).toBe(
      "/{locale}/{mount?}/{collection}/{typedId}/{asciiSlug}",
    );
    expect(routes.get("platform.graphql")?.pathTemplate).toBe("/graphql");
  });

  it("Ada'dan Atom'a yedi seviye URL sorumluluğu eksiksizdir", () => {
    const levels = registry().levelObligations;
    expect(levels.map((x) => x.level)).toEqual([
      "app",
      "module",
      "archetype",
      "feature",
      "component",
      "work_unit",
      "micro_step",
    ]);
    expect(levels.find((x) => x.level === "component")?.obligations.join(" ")).toContain(
      "RouteRef",
    );
    expect(levels.find((x) => x.level === "micro_step")?.obligations.length).toBeGreaterThanOrEqual(
      4,
    );
  });

  it("registry eski ve reddedilmiş URL kararlarını içermez", () => {
    const text = JSON.stringify(registry());
    for (const forbidden of ["slug~typedId", "k-route-identity", "resource_identity", "/node/1"])
      expect(text).not.toContain(forbidden);
  });
});

describe("URLP-M1 standart ve content-base yayılımı", () => {
  it("url-policy standardı şemaya uyar ve registry'yi kaynak gösterir", () => {
    const standard = StandardContractSchema.parse(readJson("src/data/standards/url-policy.json"));
    expect(standard.id).toBe("url-policy");
    expect(standard.references).toContain("src/data/url-policy/registry.json");
    expect(standard.references).toContain("docs/url-policy.md");
  });

  it("üretilmiş content düğümlerinin tamamı merkezi urlPolicyRef varsayılanını miras alır", () => {
    const dir = path.join(ROOT, "src/data/generated/nodes");
    const files = fs.readdirSync(dir).filter((x) => x.endsWith(".json"));
    const meta = readJson("src/data/generated/meta.json");
    expect(files.length).toBe(meta.counts.total);
    for (const file of files) {
      const node = TaskNodeSchema.parse(JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")));
      expect(node.standardRefs.urlPolicyRef, file).toBe("url-policy");
    }
  });

  it("kanonik doküman registry ve standard bağını açıkça ilan eder", () => {
    const doc = fs.readFileSync(path.join(ROOT, "docs/url-policy.md"), "utf8");
    expect(doc).toContain("src/data/url-policy/registry.json");
    expect(doc).toContain("src/data/standards/url-policy.json");
    expect(doc).toContain("URLP-M1");
    expect(doc).toContain("Tamamlandı");
  });
});
