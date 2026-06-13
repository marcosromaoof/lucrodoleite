"use server";

import { getDb } from "@/db/client";
import { createDailyProduction } from "@/lib/repositories/production";
import { readInteger, readNumber, readRequiredString, readString } from "@/lib/forms/form-data";
import { productionSchema } from "@/lib/validations/production";
import { farmScopedSchema } from "@/lib/validations/scoped";
import { requireDatabaseConfigured } from "@/lib/actions/guards";
import { success, validationError, type ActionState } from "@/lib/actions/action-state";
import { revalidatePath } from "next/cache";

export async function createProductionAction(formData: FormData): Promise<ActionState> {
  const parsed = productionSchema
    .merge(farmScopedSchema)
    .safeParse({
      farmId: readRequiredString(formData, "farmId"),
      date: readRequiredString(formData, "date"),
      liters: readNumber(formData, "liters"),
      lactatingCows: readInteger(formData, "lactatingCows"),
      batchName: readString(formData, "batchName"),
      notes: readString(formData, "notes"),
    });

  if (!parsed.success) {
    return validationError("Confira os dados da produção.", parsed.error.flatten().fieldErrors);
  }

  const databaseGuard = requireDatabaseConfigured();

  if (databaseGuard) {
    return databaseGuard;
  }

  try {
    const created = await createDailyProduction(getDb(), parsed.data);
    revalidatePath("/", "layout");
    return success("Produção salva com sucesso.", created?.id);
  } catch {
    return validationError("Não foi possível salvar a produção agora.");
  }
}

export async function submitProductionForm(formData: FormData): Promise<void> {
  await createProductionAction(formData);
}
