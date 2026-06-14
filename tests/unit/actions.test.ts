import { afterEach, describe, expect, it, vi } from "vitest";
import { createFarmAction } from "@/app/configuracoes/actions";
import { createProductionAction } from "@/app/producao/actions";

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
}));

const originalDatabaseUrl = process.env.DATABASE_URL;
const originalAuthSecret = process.env.AUTH_SECRET;

afterEach(() => {
  process.env.DATABASE_URL = originalDatabaseUrl;
  process.env.AUTH_SECRET = originalAuthSecret;
});

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

  it("blocks writes when DATABASE_URL exists but there is no authenticated session", async () => {
    process.env.DATABASE_URL = "postgres://user:pass@example.com/db";
    process.env.AUTH_SECRET = "test-secret";
    const formData = new FormData();
    formData.set("farmId", "11111111-1111-4111-8111-111111111111");
    formData.set("date", "2026-06-13");
    formData.set("liters", "120");

    const result = await createProductionAction(formData);

    expect(result.ok).toBe(false);
    expect(result.message).toBe("Faca login para continuar.");
  });
});
