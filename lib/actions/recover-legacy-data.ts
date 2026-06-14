"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { requireAuthenticatedUser, requireDatabaseConfigured } from "@/lib/actions/guards";
import { claimAllExistingFarmsForUser, claimLegacyOrphanFarmsForUser } from "@/lib/repositories/farms";
import { canClaimAllLegacyFarmsForUser } from "@/lib/repositories/user-access";

export async function recoverLegacyFarmDataAction(): Promise<void> {
  const databaseGuard = requireDatabaseConfigured();

  if (databaseGuard) {
    return;
  }

  const authGuard = await requireAuthenticatedUser();

  if (authGuard.error) {
    return;
  }

  const db = getDb();

  await claimLegacyOrphanFarmsForUser(db, authGuard.user.id);

  const completeRecovery = await canClaimAllLegacyFarmsForUser(db, {
    email: authGuard.user.email,
  });

  if (completeRecovery.allowed) {
    await claimAllExistingFarmsForUser(db, authGuard.user.id);
  }

  revalidatePath("/", "layout");
}
