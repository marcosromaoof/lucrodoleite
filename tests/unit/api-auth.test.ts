import { describe, expect, it } from "vitest";
import { authenticateApiRequest, createApiToken, hashApiToken } from "@/lib/api/auth";

describe("api bearer auth", () => {
  it("hashes bearer tokens deterministically without exposing the raw value", () => {
    const token = "lld_secret";

    expect(hashApiToken(token)).toBe(hashApiToken(token));
    expect(hashApiToken(token)).not.toBe(token);
  });

  it("persists only the token hash when creating an API token", async () => {
    const inserted: Record<string, unknown>[] = [];
    const db = {
      insert: () => ({
        values(value: Record<string, unknown>) {
          inserted.push(value);

          return {
            returning: async () => [
              {
                expiresAt: value.expiresAt,
                id: "token-id",
                tokenPrefix: value.tokenPrefix,
              },
            ],
          };
        },
      }),
    };

    const created = await createApiToken(db as never, { userId: "user-id" });

    expect(created.token).toMatch(/^lld_/);
    expect(inserted[0].tokenHash).toBe(hashApiToken(created.token));
    expect(inserted[0].tokenHash).not.toBe(created.token);
    expect(JSON.stringify(inserted[0])).not.toContain(created.token);
  });

  it("rejects requests without a Bearer token before touching the database", async () => {
    const result = await authenticateApiRequest(new Request("https://app.local/api/v1/me"));

    expect(result.user).toBeNull();
    expect(result.error?.status).toBe(401);
  });
});
