import { describe, expect, it } from "vitest";
import { normalizeUserEmail } from "@/lib/repositories/user-access";

describe("normalizeUserEmail", () => {
  it("normalizes email before matching account access", () => {
    expect(normalizeUserEmail("  Produtor@EXEMPLO.com.br  ")).toBe("produtor@exemplo.com.br");
  });

  it("returns an empty string for missing email", () => {
    expect(normalizeUserEmail(null)).toBe("");
    expect(normalizeUserEmail(undefined)).toBe("");
  });
});
