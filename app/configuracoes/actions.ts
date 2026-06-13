"use server";

import { getDb } from "@/db/client";
import { createFarm } from "@/lib/repositories/farms";
import { readNumber, readRequiredString, readString } from "@/lib/forms/form-data";
import { farmSchema } from "@/lib/validations/farm";
import { requireDatabaseConfigured } from "@/lib/actions/guards";
import { success, validationError, type ActionState } from "@/lib/actions/action-state";
import { revalidatePath } from "next/cache";

export async function createFarmAction(formData: FormData): Promise<ActionState> {
  const parsed = farmSchema.safeParse({
    name: readRequiredString(formData, "name"),
    ownerName: readString(formData, "ownerName"),
    city: readString(formData, "city"),
    state: readString(formData, "state"),
    milkCompany: readString(formData, "milkCompany"),
    defaultPricePerLiter: readNumber(formData, "defaultPricePerLiter"),
  });

  if (!parsed.success) {
    return validationError("Confira os dados da fazenda.", parsed.error.flatten().fieldErrors);
  }

  const databaseGuard = requireDatabaseConfigured();

  if (databaseGuard) {
    return databaseGuard;
  }

  try {
    const created = await createFarm(getDb(), parsed.data);
    revalidatePath("/", "layout");
    return success("Fazenda salva com sucesso.", created?.id);
  } catch {
    return validationError("Não foi possível salvar a fazenda agora.");
  }
}

export async function submitFarmForm(formData: FormData): Promise<void> {
  await createFarmAction(formData);
}
