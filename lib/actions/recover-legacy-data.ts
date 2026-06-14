"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { requireAuthenticatedUser, requireDatabaseConfigured } from "@/lib/actions/guards";
import { claimLegacyOrphanFarmsForUser, claimRecoverableLegacyFarmsForEmptyUser } from "@/lib/repositories/farms";

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
  await claimRecoverableLegacyFarmsForEmptyUser(db, authGuard.user.id);
  revalidatePath("/", "layout");
}
