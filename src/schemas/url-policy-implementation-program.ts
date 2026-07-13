import { z } from "zod";

const NonEmptyTextSchema = z.string().trim().min(1);
const NonEmptyTextArraySchema = z.array(NonEmptyTextSchema).min(1);
const UrlPolicyPhaseIdSchema = z.string().regex(/^URLP-(0[0-9]|1[0-6])$/);

export const UrlPolicyImplementationStatusSchema = z.enum([
  "planned",
  "blocked",
  "ready",
  "in-progress",
  "verified",
  "completed",
]);

export const UrlPolicyAcceptanceCriterionSchema = z
  .object({
    id: NonEmptyTextSchema,
    statement: NonEmptyTextSchema,
    evidence: NonEmptyTextSchema,
  })
  .strict();

export const UrlPolicyRedTestSchema = z
  .object({
    id: NonEmptyTextSchema,
    file: NonEmptyTextSchema,
    assertion: NonEmptyTextSchema,
  })
  .strict();

export const UrlPolicyRollbackSchema = z
  .object({
    trigger: NonEmptyTextSchema,
    procedure: NonEmptyTextSchema,
    verification: NonEmptyTextSchema,
  })
  .strict();

export const UrlPolicyAgentPromptSchema = z
  .object({
    objective: NonEmptyTextSchema,
    instructions: NonEmptyTextArraySchema,
    stopConditions: NonEmptyTextArraySchema,
  })
  .strict();

export const UrlPolicyImplementationPhaseSchema = z
  .object({
    phaseId: UrlPolicyPhaseIdSchema,
    order: z.number().int().min(0).max(16),
    title: NonEmptyTextSchema,
    status: UrlPolicyImplementationStatusSchema,
    owner: NonEmptyTextSchema,
    targetRepo: z.literal("platform"),
    branch: NonEmptyTextSchema,
    dependsOn: z.array(UrlPolicyPhaseIdSchema),
    allowedFiles: NonEmptyTextArraySchema,
    nonGoals: NonEmptyTextArraySchema,
    requiredRegistryRefs: NonEmptyTextArraySchema,
    acceptanceCriteria: z.array(UrlPolicyAcceptanceCriterionSchema).min(1),
    redTests: z.array(UrlPolicyRedTestSchema).min(1),
    testCommands: NonEmptyTextArraySchema,
    evidenceRequirements: NonEmptyTextArraySchema,
    rollback: UrlPolicyRollbackSchema,
    securityNegativeTests: NonEmptyTextArraySchema,
    outputArtifacts: NonEmptyTextArraySchema,
    wbsRefs: NonEmptyTextArraySchema,
    agentPrompt: UrlPolicyAgentPromptSchema,
  })
  .strict();

export const UrlPolicyImplementationProgramSchema = z
  .object({
    schemaVersion: NonEmptyTextSchema,
    id: z.literal("url-policy-implementation-program"),
    version: NonEmptyTextSchema,
    status: z.literal("active"),
    canonicalPolicyRef: z.literal("docs/url-policy.md"),
    targetRepo: z.literal("platform"),
    phases: z.array(UrlPolicyImplementationPhaseSchema).length(17),
  })
  .strict()
  .superRefine((program, context) => {
    const expectedIds = Array.from(
      { length: 17 },
      (_, index) => `URLP-${String(index).padStart(2, "0")}`,
    );
    const wbsRefs = new Set<string>();

    program.phases.forEach((phase, index) => {
      if (phase.phaseId !== expectedIds[index] || phase.order !== index) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phases", index],
          message: `Faz sırası ${expectedIds[index]} ve order=${index} olmalıdır`,
        });
      }

      const expectedDependencies = index === 0 ? [] : [expectedIds[index - 1]];
      if (JSON.stringify(phase.dependsOn) !== JSON.stringify(expectedDependencies)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phases", index, "dependsOn"],
          message: `${phase.phaseId} yalnız doğrudan önceki faza bağımlı olmalıdır`,
        });
      }

      if (!phase.branch.startsWith(`task/${expectedIds[index]}-`)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phases", index, "branch"],
          message: `Branch task/${expectedIds[index]}-<slug> biçiminde olmalıdır`,
        });
      }

      const expectedWbsRef = `urlp-${String(index).padStart(2, "0")}`;
      if (phase.wbsRefs.length !== 1 || phase.wbsRefs[0] !== expectedWbsRef) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phases", index, "wbsRefs"],
          message: `${phase.phaseId} yalnız ${expectedWbsRef} WBS atomuna bağlanmalıdır`,
        });
      }

      if (phase.allowedFiles.some((file) => file === "**" || file === "*" || file === "/")) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phases", index, "allowedFiles"],
          message: "Kök/sınırsız wildcard allowedFiles içinde yasaktır",
        });
      }

      if (new Set(phase.allowedFiles).size !== phase.allowedFiles.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phases", index, "allowedFiles"],
          message: "allowedFiles yinelenen kayıt içeremez",
        });
      }

      if (
        phase.allowedFiles.some((file) => file.startsWith("/") || /(^|\/)\.\.($|\/)/.test(file))
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phases", index, "allowedFiles"],
          message: "allowedFiles yalnız hedef repo içindeki göreli yolları kullanmalıdır",
        });
      }

      if (
        phase.testCommands.some((command) =>
          /\|\|\s*(true|:)|;\s*true\b|--no-verify\b/.test(command),
        )
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phases", index, "testCommands"],
          message: "Test komutu hatayı yutamaz veya doğrulama kapısını atlayamaz",
        });
      }

      if (
        index > 0 &&
        ["ready", "in-progress", "verified", "completed"].includes(phase.status) &&
        !["verified", "completed"].includes(program.phases[index - 1].status)
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phases", index, "status"],
          message: `${phase.phaseId} ilerlemeden önce ${expectedIds[index - 1]} verified olmalıdır`,
        });
      }

      for (const ref of phase.wbsRefs) {
        if (wbsRefs.has(ref)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["phases", index, "wbsRefs"],
            message: `WBS ref tekil olmalıdır: ${ref}`,
          });
        }
        wbsRefs.add(ref);
      }
    });
  });

export type UrlPolicyImplementationPhase = z.infer<typeof UrlPolicyImplementationPhaseSchema>;
export type UrlPolicyImplementationProgram = z.infer<typeof UrlPolicyImplementationProgramSchema>;
