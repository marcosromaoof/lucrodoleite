"use server";

import { getDb } from "@/db/client";
import { createFeedBrand } from "@/lib/repositories/feed-brands";
import { readNumber, readRequiredString, readString } from "@/lib/forms/form-data";
import { feedBrandSchema } from "@/lib/validations/feed-brand";
import { farmScopedSchema } from "@/lib/validations/scoped";
import { requireDatabaseConfigured } from "@/lib/actions/guards";
import { success, validationError, type ActionState } from "@/lib/actions/action-state";

export async function createFeedBrandAction(formData: FormData): Promise<ActionState> {
  const parsed = feedBrandSchema
    .merge(farmScopedSchema)
    .safeParse({
      farmId: readRequiredString(formData, "farmId"),
      name: readRequiredString(formData, "name"),
      manufacturer: readString(formData, "manufacturer"),
      proteinPercent: readNumber(formData, "proteinPercent"),
      bagWeightKg: readNumber(formData, "bagWeightKg"),
      pricePerBag: readNumber(formData, "pricePerBag"),
      notes: readString(formData, "notes"),
    });

  if (!parsed.success) {
    return validationError("Confira os dados da marca de ração.", parsed.error.flatten().fieldErrors);
  }

  const databaseGuard = requireDatabaseConfigured();

  if (databaseGuard) {
    return databaseGuard;
  }

  try {
    const created = await createFeedBrand(getDb(), parsed.data);
    return success("Marca de ração salva com sucesso.", created?.id);
  } catch {
    return validationError("Não foi possível salvar a marca de ração agora.");
  }
}
