import { describe, expect, it } from "vitest";
import { createFarmAction } from "@/app/configuracoes/actions";
import { createProductionAction } from "@/app/producao/actions";

describe("server actions guards", () => {
  it("blocks farm creation when DATABASE_URL is not configured", async () => {
    const formData = new FormData();
    formData.set("name", "Fazenda Boa Vista");

    const result = await createFarmAction(formData);

    expect(result.ok).toBe(false);
    expect(result.message).toContain("DATABASE_URL");
  });

  it("requires farm scope before saving production", async () => {
    const formData = new FormData();
    formData.set("date", "2026-06-13");
    formData.set("liters", "120");

    const result = await createProductionAction(formData);

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected validation failure.");
    }

    expect(result.message).toBe("Confira os dados da produção.");
    expect(result.fieldErrors?.farmId?.length).toBeGreaterThan(0);
  });
});
