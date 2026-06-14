import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { apiError } from "@/lib/api/responses";
import { apiTokens, users } from "@/db/schema";
import type { AppDatabase } from "@/lib/repositories/types";
import { syncFarmMembershipsForEmail } from "@/lib/repositories/user-access";

export type ApiAuthenticatedUser = {
  email: string | null;
  id: string;
  image: string | null;
  name: string | null;
};

export const apiTokenLifetimeDays = 90;

export function hashApiToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createApiToken(
  db: AppDatabase,
  input: {
    name?: string;
    userId: string;
  },
) {
  const rawSecret = randomBytes(32).toString("base64url");
  const token = `lld_${rawSecret}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + apiTokenLifetimeDays * 24 * 60 * 60 * 1000);
  const tokenPrefix = token.slice(0, 12);

  const [created] = await db
    .insert(apiTokens)
    .values({
      expiresAt,
      name: input.name ?? "Android",
      tokenHash: hashApiToken(token),
      tokenPrefix,
      userId: input.userId,
    })
    .returning({
      expiresAt: apiTokens.expiresAt,
      id: apiTokens.id,
      tokenPrefix: apiTokens.tokenPrefix,
    });

  return {
    ...created,
    token,
    tokenType: "Bearer" as const,
  };
}

export async function authenticateApiRequest(request: Request): Promise<
  | {
      error: null;
      user: ApiAuthenticatedUser;
    }
  | {
      error: Response;
      user: null;
    }
> {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(/\s+/);

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return {
      error: apiError(401, "missing_token", "Informe um token Bearer valido."),
      user: null,
    };
  }

  const db = getDb();
  const [row] = await db
    .select({
      email: users.email,
      id: users.id,
      image: users.image,
      name: users.name,
      tokenId: apiTokens.id,
    })
    .from(apiTokens)
    .innerJoin(users, eq(apiTokens.userId, users.id))
    .where(
      and(
        eq(apiTokens.tokenHash, hashApiToken(token)),
        isNull(apiTokens.revokedAt),
        gt(apiTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!row) {
    return {
      error: apiError(401, "invalid_token", "Token invalido ou expirado."),
      user: null,
    };
  }

  await db
    .update(apiTokens)
    .set({
      lastUsedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(apiTokens.id, row.tokenId));

  await syncFarmMembershipsForEmail(db, {
    email: row.email,
    userId: row.id,
  });

  return {
    error: null,
    user: {
      email: row.email,
      id: row.id,
      image: row.image,
      name: row.name,
    },
  };
}
