import { z } from "zod";
import { BaseSdkDeliverySchema, EnterpriseDeliverySchema } from "./app-definition";

const NonEmptyTextSchema = z.string().trim().min(1);
const SemverSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/, "semantic version bekleniyor");

export const ModuleSdkDeliverySchema = BaseSdkDeliverySchema.extend({
  templateKind: z.literal("module"),
}).strict();
export type ModuleSdkDelivery = z.infer<typeof ModuleSdkDeliverySchema>;

export const ModuleHealthContractSchema = z
  .object({
    healthPath: z.string().regex(/^\//, "healthPath / ile başlamalı"),
    readinessPath: z.string().regex(/^\//, "readinessPath / ile başlamalı"),
    exposesTenantOrDomainData: z.literal(false),
  })
  .strict();

export const ModuleVersioningSchema = z
  .object({
    moduleVersion: SemverSchema,
    contractVersion: SemverSchema,
    compatibilityPolicy: z.literal("backward-compatible-within-major"),
  })
  .strict();

export const ModuleMigrationSchema = z
  .object({
    authority: NonEmptyTextSchema,
    mode: z.enum(["append-only", "expand-contract", "reversible-backfill"]),
    downgradeRequired: z.literal(true),
  })
  .strict();

export const ModuleDefinitionSchema = z
  .object({
    artifactKind: z.enum(["app-core-module", "app-module"]),
    moduleId: NonEmptyTextSchema,
    moduleSlug: z
      .string()
      .min(1)
      .regex(/^[a-z0-9][a-z0-9-]*$/, "moduleSlug küçük-harf kebab-case olmalı"),
    appId: NonEmptyTextSchema,
    appCoreModuleId: NonEmptyTextSchema,
    boundedContext: NonEmptyTextSchema,
    ownedData: z.array(NonEmptyTextSchema).min(1),
    lifecycleAuthority: z.array(NonEmptyTextSchema).min(1),
    providedPorts: z.array(NonEmptyTextSchema).min(1),
    consumedPorts: z.array(NonEmptyTextSchema).default([]),
    publishedEvents: z.array(NonEmptyTextSchema).default([]),
    subscribedEvents: z.array(NonEmptyTextSchema).default([]),
    capabilityIds: z.array(NonEmptyTextSchema).min(1),
    permissionIds: z.array(NonEmptyTextSchema).min(1),
    routeContributions: z.array(NonEmptyTextSchema).default([]),
    directAppImportsAllowed: z.literal(false),
    directModuleImportsAllowed: z.literal(false),
    kernelInternalsAllowed: z.literal(false),
    crossContextWritesAllowed: z.literal(false),
    healthContract: ModuleHealthContractSchema,
    versioning: ModuleVersioningSchema,
    migration: ModuleMigrationSchema,
    sdkDelivery: ModuleSdkDeliverySchema,
    enterpriseDelivery: EnterpriseDeliverySchema,
  })
  .strict()
  .superRefine((module, ctx) => {
    if (module.artifactKind === "app-core-module" && module.moduleId !== module.appCoreModuleId)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["appCoreModuleId"],
        message: "app-core module kendi moduleId değerini appCoreModuleId olarak taşımalı",
      });
    if (module.artifactKind === "app-module" && module.moduleId === module.appCoreModuleId)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["appCoreModuleId"],
        message: "normal app module app-core ile aynı kimliği taşıyamaz",
      });
  });
export type ModuleDefinition = z.infer<typeof ModuleDefinitionSchema>;
