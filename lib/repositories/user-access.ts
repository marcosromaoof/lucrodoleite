import type { AdapterUser } from "@auth/core/adapters";
import { and, eq, ne, sql } from "drizzle-orm";
import { farmMembers, users } from "@/db/schema";
import type { AppDatabase } from "@/lib/repositories/types";

export function normalizeUserEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

export async function findUserByEmailCaseInsensitive(
  db: AppDatabase,
  email: string | null | undefined,
): Promise<AdapterUser | null> {
  const normalizedEmail = normalizeUserEmail(email);

  if (!normalizedEmail) {
    return null;
  }

  const [user] = await db
    .select({
      email: users.email,
      emailVerified: users.emailVerified,
      id: users.id,
      image: users.image,
      name: users.name,
    })
    .from(users)
    .where(sql`lower(${users.email}) = ${normalizedEmail}`)
    .limit(1);

  if (!user) {
    return null;
  }

  return {
    ...user,
    email: user.email ?? normalizedEmail,
  };
}

export async function syncFarmMembershipsForEmail(
  db: AppDatabase,
  input: {
    email: string | null | undefined;
    userId: string;
  },
) {
  const normalizedEmail = normalizeUserEmail(input.email);

  if (!normalizedEmail) {
    return { linked: 0 };
  }

  const sourceMemberships = await db
    .selectDistinct({
      farmId: farmMembers.farmId,
      role: farmMembers.role,
    })
    .from(users)
    .innerJoin(farmMembers, eq(farmMembers.userId, users.id))
    .where(and(sql`lower(${users.email}) = ${normalizedEmail}`, ne(users.id, input.userId)));

  if (sourceMemberships.length === 0) {
    return { linked: 0 };
  }

  const roleByFarm = new Map<string, string>();

  for (const membership of sourceMemberships) {
    const currentRole = roleByFarm.get(membership.farmId);

    if (!currentRole || membership.role === "owner") {
      roleByFarm.set(membership.farmId, membership.role);
    }
  }

  const rows = [...roleByFarm.entries()].map(([farmId, role]) => ({
    farmId,
    role,
    userId: input.userId,
  }));

  if (rows.length === 0) {
    return { linked: 0 };
  }

  const inserted = await db
    .insert(farmMembers)
    .values(rows)
    .onConflictDoNothing({
      target: [farmMembers.farmId, farmMembers.userId],
    })
    .returning({ id: farmMembers.id });

  return { linked: inserted.length };
}
