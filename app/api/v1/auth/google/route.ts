import { randomUUID } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { accounts, users } from "@/db/schema";
import { isDatabaseConfigured } from "@/lib/app/environment";
import { createApiToken } from "@/lib/api/auth";
import { apiError, apiOk, zodError } from "@/lib/api/responses";
import { findUserByEmailCaseInsensitive, syncFarmMembershipsForEmail } from "@/lib/repositories/user-access";

export const runtime = "nodejs";

const googleLoginSchema = z.object({
  idToken: z.string().min(1),
  tokenName: z.string().trim().max(80).optional(),
});

const googleClient = new OAuth2Client();

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return apiError(503, "database_not_configured", "DATABASE_URL nao configurada.");
  }

  const parsed = googleLoginSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return zodError(parsed.error.flatten().fieldErrors);
  }

  const audience = [process.env.AUTH_GOOGLE_ID, process.env.GOOGLE_ANDROID_CLIENT_ID].filter(
    (value): value is string => Boolean(value),
  );

  if (audience.length === 0) {
    return apiError(500, "google_audience_not_configured", "Configure AUTH_GOOGLE_ID ou GOOGLE_ANDROID_CLIENT_ID.");
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      audience,
      idToken: parsed.data.idToken,
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      return apiError(401, "invalid_google_token", "ID token Google invalido.");
    }

    const db = getDb();
    const user = await findOrCreateGoogleUser(db, {
      email: payload.email,
      emailVerified: new Date(),
      image: payload.picture ?? null,
      name: payload.name ?? payload.email,
      providerAccountId: payload.sub,
    });

    await syncFarmMembershipsForEmail(db, {
      email: user.email,
      userId: user.id,
    });

    const apiToken = await createApiToken(db, {
      name: parsed.data.tokenName ?? "Android",
      userId: user.id,
    });

    return apiOk(
      {
        expiresAt: apiToken.expiresAt,
        token: apiToken.token,
        tokenPrefix: apiToken.tokenPrefix,
        tokenType: apiToken.tokenType,
        user,
      },
      201,
    );
  } catch {
    return apiError(401, "invalid_google_token", "ID token Google invalido ou audience incorreta.");
  }
}

async function findOrCreateGoogleUser(
  db: ReturnType<typeof getDb>,
  input: {
    email: string;
    emailVerified: Date;
    image: string | null;
    name: string;
    providerAccountId: string;
  },
) {
  const [accountUser] = await db
    .select({
      email: users.email,
      id: users.id,
      image: users.image,
      name: users.name,
    })
    .from(accounts)
    .innerJoin(users, eq(accounts.userId, users.id))
    .where(and(eq(accounts.provider, "google"), eq(accounts.providerAccountId, input.providerAccountId)))
    .limit(1);

  if (accountUser) {
    return accountUser;
  }

  const emailUser = await findUserByEmailCaseInsensitive(db, input.email);

  const user =
    emailUser ??
    (
      await db
        .insert(users)
        .values({
          email: input.email,
          emailVerified: input.emailVerified,
          id: randomUUID(),
          image: input.image,
          name: input.name,
        })
        .returning({
          email: users.email,
          id: users.id,
          image: users.image,
          name: users.name,
        })
    )[0];

  await db
    .insert(accounts)
    .values({
      provider: "google",
      providerAccountId: input.providerAccountId,
      type: "oidc",
      userId: user.id,
    })
    .onConflictDoNothing({
      target: [accounts.provider, accounts.providerAccountId],
    });

  return user;
}
