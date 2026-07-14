import { z } from "zod";

const NonEmptyTextSchema = z.string().trim().min(1);

export const RuntimeDeliveryContextSchema = z
  .object({
    applicability: z.literal("runtime"),
    appRef: NonEmptyTextSchema,
    moduleRef: NonEmptyTextSchema,
    sdkRequired: z.literal(true),
    sdkContractRef: NonEmptyTextSchema,
    contractRefs: z.array(NonEmptyTextSchema).min(1),
  })
  .strict();
export type RuntimeDeliveryContext = z.infer<typeof RuntimeDeliveryContextSchema>;

export const NotApplicableDeliveryContextSchema = z
  .object({
    applicability: z.literal("not-applicable"),
    reason: NonEmptyTextSchema,
  })
  .strict();
export type NotApplicableDeliveryContext = z.infer<typeof NotApplicableDeliveryContextSchema>;

/** Runtime işlerini SDK zincirine bağlar; yönetişim işlerinde açık N/A gerekçesi ister. */
export const DeliveryContextSchema = z.discriminatedUnion("applicability", [
  RuntimeDeliveryContextSchema,
  NotApplicableDeliveryContextSchema,
]);
export type DeliveryContext = z.infer<typeof DeliveryContextSchema>;
