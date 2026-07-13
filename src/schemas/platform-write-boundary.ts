import { z } from "zod";

const NonEmptyText = z.string().trim().min(1);
const NonEmptyList = z.array(NonEmptyText).min(1);

export const PlatformWriteBoundarySchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    id: z.literal("platform-product-code-write-prohibition"),
    version: NonEmptyText,
    status: z.literal("active"),
    canonicalDirective: z.literal("docs/platform-product-code-write-prohibition-directive.md"),
    targetWorkspaceId: z.literal("platform"),
    targetPath: z.literal("/Users/karaca/DEV/mimari/platform"),
    aiActors: z.array(z.enum(["codex", "claude", "cursor", "aider", "windsurf"])).min(3),
    aiAccess: z.literal("read-only-audit"),
    productCodeWriter: z.literal("human-developer-only"),
    directiveWriteRoots: z.tuple([z.literal("/Users/karaca/DEV/mimari/actionplan")]),
    humanInstallTargets: z
      .array(
        z
          .object({
            source: NonEmptyText,
            target: NonEmptyText,
          })
          .strict(),
      )
      .length(3),
    prohibitedActions: NonEmptyList,
    allowedActions: NonEmptyList,
    requiredHandoffFields: NonEmptyList,
    stopConditions: NonEmptyList,
  })
  .strict()
  .superRefine((policy, context) => {
    const requiredProhibitions = [
      "write-product-code",
      "write-tests",
      "create-migration",
      "create-branch",
      "create-commit",
      "open-pull-request",
    ];
    for (const action of requiredProhibitions) {
      if (!policy.prohibitedActions.includes(action)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["prohibitedActions"],
          message: `Zorunlu yasak eksik: ${action}`,
        });
      }
    }
  });

export type PlatformWriteBoundary = z.infer<typeof PlatformWriteBoundarySchema>;
