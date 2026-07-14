import { DeliveryContextSchema } from "@/schemas/delivery-context";
import { TaskNodeSchema } from "@/schemas/task";
import { describe, expect, it } from "vitest";

const runtimeContext = {
  applicability: "runtime",
  appRef: "app-clinic-management",
  moduleRef: "app-clinic-management-core",
  sdkRequired: true,
  sdkContractRef: "sdk-public-contract",
  contractRefs: ["enterprise-delivery", "sdk-development"],
} as const;

describe("DeliveryContextSchema", () => {
  it("accepts a runtime task bound to an app, module, and SDK contract", () => {
    expect(DeliveryContextSchema.parse(runtimeContext)).toEqual(runtimeContext);
  });

  it("accepts a non-runtime task only with an explicit reason", () => {
    expect(
      DeliveryContextSchema.parse({
        applicability: "not-applicable",
        reason: "Portfolio governance does not produce a runtime artifact.",
      }),
    ).toBeTruthy();
  });

  it("rejects runtime delivery without its complete SDK and ownership chain", () => {
    const { moduleRef: _moduleRef, ...missingModule } = runtimeContext;
    expect(() => DeliveryContextSchema.parse(missingModule)).toThrow();

    expect(() => DeliveryContextSchema.parse({ ...runtimeContext, sdkRequired: false })).toThrow();
    expect(() => DeliveryContextSchema.parse({ ...runtimeContext, contractRefs: [] })).toThrow();
  });

  it("rejects an empty not-applicable reason", () => {
    expect(() =>
      DeliveryContextSchema.parse({ applicability: "not-applicable", reason: "  " }),
    ).toThrow();
  });

  it("keeps TaskNode deliveryContext optional during rollout and parses either branch", () => {
    const baseNode = {
      id: "clinic-scheduling-task",
      level: "archetype",
      title: "Clinic scheduling delivery task",
      slug: "clinic-scheduling-task",
    };

    expect(TaskNodeSchema.parse(baseNode).deliveryContext).toBeUndefined();
    expect(TaskNodeSchema.parse({ ...baseNode, deliveryContext: runtimeContext })).toBeTruthy();
    expect(
      TaskNodeSchema.parse({
        ...baseNode,
        deliveryContext: {
          applicability: "not-applicable",
          reason: "Decision-only governance task.",
        },
      }),
    ).toBeTruthy();
  });
});
