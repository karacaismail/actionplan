import { z } from "zod";

export const UrlRouteSurfaceSchema = z.enum([
  "public",
  "workspace",
  "admin",
  "graphql",
  "developer-api",
  "webhook",
  "asset",
  "auth-callback",
]);
export const UrlRendererSchema = z.enum(["spa", "ssr", "prerender", "api", "static"]);

export const UrlResourceKindSchema = z.object({
  kind: z.string().regex(/^[a-z][a-z0-9-]*$/),
  prefix: z.string().regex(/^[a-z][a-z0-9]*_$/),
  ownerBoundedContext: z.string().min(1),
  idStrategy: z.literal("random-128-crockford-base32"),
  defaultExposure: z.enum(["restricted", "internal-readable", "public"]),
  slugPolicy: z.enum(["none", "optional-decorative", "required-decorative"]),
});

export const UrlRouteDefinitionSchema = z.object({
  routeId: z.string().regex(/^[a-z][a-z0-9.-]*$/),
  ownerApp: z.string().min(1),
  ownerModule: z.string().optional(),
  surface: UrlRouteSurfaceSchema,
  pathTemplate: z.string().startsWith("/"),
  paramsSchemaRef: z.string().min(1),
  querySchemaRef: z.string().optional(),
  requiredCapability: z.string().optional(),
  accessPolicyRef: z.string().min(1),
  indexabilityPolicyRef: z.string().min(1),
  cachePolicyRef: z.string().min(1),
  renderer: UrlRendererSchema,
  version: z.number().int().positive(),
});

export const HostBindingProfileSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  mode: z.enum([
    "platform-shared",
    "tenant-subdomain",
    "tenant-path",
    "app-subdomain",
    "custom-domain",
  ]),
  hostTemplate: z.string().min(1),
  pathPrefixTemplate: z.string(),
  tenantSource: z.enum(["host", "path", "binding-record", "none"]),
  appSource: z.enum(["path", "host", "binding-record", "route", "none"]),
  default: z.boolean(),
  allowedSurfaces: z.array(UrlRouteSurfaceSchema).min(1),
  verificationRequired: z.boolean(),
});

export const UrlSlugProfileSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  version: z.number().int().positive(),
  mode: z.enum(["ascii", "unicode", "machine-key"]),
  normalization: z.literal("NFC"),
  sourceLocaleRequired: z.boolean(),
  separator: z.literal("-"),
  maxSerializedBytes: z.number().int().positive().max(255),
  transliterationProfileRefs: z.record(z.string()),
  unicodeSecurityProfileRef: z.string().min(1),
});

export const UrlRouteProjectionSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9.-]*$/),
  routeRef: z.string().min(1),
  hostBindingProfileRef: z.string().min(1),
  appMount: z.string().optional(),
  collectionAlias: z.string().optional(),
  localeMode: z.enum(["none", "prefix-always"]),
  canonicalSlugProfileRef: z.string().optional(),
  unicodeAliasEnabled: z.boolean(),
  canonical: z.boolean(),
  migrationState: z.enum(["stable", "draft", "migration-pending", "dual-read", "retiring"]),
});

export const UrlLevelObligationSchema = z.object({
  level: z.enum(["app", "module", "archetype", "feature", "component", "work_unit", "micro_step"]),
  natureMetaphor: z.enum(["ada", "dağ", "kaya", "taş", "kum", "molekül", "atom"]),
  obligations: z.array(z.string().min(1)).min(1),
});

export const UrlPolicyRegistrySchema = z.object({
  schemaVersion: z.string().min(1),
  id: z.literal("k-route-policy"),
  version: z.string().min(1),
  status: z.literal("active"),
  canonicalDoc: z.literal("docs/url-policy.md"),
  implementationProgramRef: z.literal("src/data/url-policy/implementation-program.json"),
  standardRef: z.literal("url-policy"),
  defaults: z.object({
    workspaceTopology: z.literal("tenant-subdomain-suite-path"),
    privatePiiTemplate: z.literal("/{app}/{collection}/{typedId}"),
    publicTemplate: z.literal("/{locale}/{mount?}/{collection}/{typedId}/{asciiSlug}"),
    graphqlPath: z.literal("/graphql"),
    publicLocaleMode: z.literal("prefix-always"),
    publicSlugProfileRef: z.literal("public-ascii-v1"),
    unknownResourceExposure: z.literal("restricted"),
  }),
  reservedNamespaces: z.array(z.string().startsWith("/")).min(10),
  invariants: z.array(z.string().min(1)).min(8),
  resourceKinds: z.array(UrlResourceKindSchema).min(1),
  routeDefinitions: z.array(UrlRouteDefinitionSchema).min(1),
  hostBindingProfiles: z.array(HostBindingProfileSchema).min(1),
  routeProjections: z.array(UrlRouteProjectionSchema).min(1),
  slugProfiles: z.array(UrlSlugProfileSchema).min(1),
  levelObligations: z.array(UrlLevelObligationSchema).length(7),
});

export type UrlPolicyRegistry = z.infer<typeof UrlPolicyRegistrySchema>;
