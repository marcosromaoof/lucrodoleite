import { describe, expect, it } from "vitest";
import { productionSchema } from "@/lib/validations/production";

describe("production validation", () => {
  it("accepts an optional feed test link", () => {
    const parsed = productionSchema.parse({
      date: "2026-06-13",
      feedTestId: "8a42490e-4895-4cb7-8770-bb12f5a95f5d",
      liters: 120,
    });

    expect(parsed.feedTestId).toBe("8a42490e-4895-4cb7-8770-bb12f5a95f5d");
  });

  it("rejects invalid feed test ids", () => {
    const parsed = productionSchema.safeParse({
      date: "2026-06-13",
      feedTestId: "teste-invalido",
      liters: 120,
    });

    expect(parsed.success).toBe(false);
  });
});
