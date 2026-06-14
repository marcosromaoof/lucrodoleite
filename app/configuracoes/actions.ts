"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { requireAuthenticatedFarmAccess, requireAuthenticatedUser, requireDatabaseConfigured } from "@/lib/actions/guards";
import { success, validationError, type ActionState } from "@/lib/actions/action-state";
import { readInteger, readNumber, readRequiredString, readString } from "@/lib/forms/form-data";
import {
  claimLegacyOrphanFarmsForUser,
  claimRecoverableLegacyFarmsForEmptyUser,
  createFarmForOwner,
  deleteFarm,
  updateFarm,
} from "@/lib/repositories/farms";
import { farmSchema } from "@/lib/validations/farm";

function parseFarmForm(formData: FormData) {
  return farmSchema.safeParse({
    name: readRequiredString(formData, "name"),
    ownerName: readString(formData, "ownerName"),
    city: readString(formData, "city"),
    state: readString(formData, "state"),
    milkCompany: readString(formData, "milkCompany"),
    defaultPricePerLiter: readNumber(formData, "defaultPricePerLiter"),
    closingCycleStartDay: readInteger(formData, "closingCycleStartDay"),
    closingCycleEndDay: readInteger(formData, "closingCycleEndDay"),
  });
}

export async function createFarmAction(formData: FormData): Promise<ActionState> {
  const parsed = parseFarmForm(formData);

  if (!parsed.success) {
    return validationError("Confira os dados da fazenda.", parsed.error.flatten().fieldErrors);
  }

  const databaseGuard = requireDatabaseConfigured();

  if (databaseGuard) {
    return databaseGuard;
  }

  const authGuard = await requireAuthenticatedUser();

  if (authGuard.error) {
    return authGuard.error;
  }

  try {
    const created = await createFarmForOwner(getDb(), parsed.data, authGuard.user.id);
    revalidatePath("/", "layout");

    return success("Fazenda salva com sucesso.", created?.id);
  } catch {
    return validationError("Não foi possível salvar a fazenda agora.");
  }
}

export async function updateFarmAction(formData: FormData): Promise<ActionState> {
  const farmId = readRequiredString(formData, "farmId");
  const parsed = parseFarmForm(formData);

  if (!farmId) {
    return validationError("Fazenda inválida.");
  }

  if (!parsed.success) {
    return validationError("Confira os dados da fazenda.", parsed.error.flatten().fieldErrors);
  }

  const accessGuard = await requireAuthenticatedFarmAccess(farmId);

  if (accessGuard.error) {
    return accessGuard.error;
  }

  try {
    const updated = await updateFarm(getDb(), farmId, parsed.data);
    revalidatePath("/", "layout");

    return success("Fazenda atualizada com sucesso.", updated?.id);
  } catch {
    return validationError("Não foi possível atualizar a fazenda agora.");
  }
}

export async function deleteFarmAction(formData: FormData): Promise<ActionState> {
  const farmId = readRequiredString(formData, "farmId");

  if (!farmId) {
    return validationError("Fazenda inválida.");
  }

  const accessGuard = await requireAuthenticatedFarmAccess(farmId);

  if (accessGuard.error) {
    return accessGuard.error;
  }

  const result = await deleteFarm(getDb(), farmId);

  if (!result.deleted) {
    return validationError(result.reason ?? "Não foi possível excluir a fazenda.");
  }

  revalidatePath("/", "layout");

  return success("Fazenda excluída com sucesso.", farmId);
}

export async function submitFarmForm(formData: FormData): Promise<void> {
  const farmId = readString(formData, "farmId");

  if (farmId) {
    await updateFarmAction(formData);
    return;
  }

  await createFarmAction(formData);
}

export async function submitDeleteFarmForm(formData: FormData): Promise<void> {
  await deleteFarmAction(formData);
}

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
