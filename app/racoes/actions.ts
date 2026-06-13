"use server";

import { getDb } from "@/db/client";
import { calculateFeedVariant } from "@/lib/calculations/feed";
import { countInclusiveDays } from "@/lib/dates/days";
import { createFeedTestResult } from "@/lib/repositories/feed-tests";
import { createFeedBrand } from "@/lib/repositories/feed-brands";
import { readNumber, readRequiredString, readString } from "@/lib/forms/form-data";
import { feedBrandSchema } from "@/lib/validations/feed-brand";
import { feedTestSchema } from "@/lib/validations/feed-test";
import { farmScopedSchema } from "@/lib/validations/scoped";
import { requireDatabaseConfigured } from "@/lib/actions/guards";
import { success, validationError, type ActionState } from "@/lib/actions/action-state";
import { revalidatePath } from "next/cache";

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
    revalidatePath("/", "layout");
    return success("Marca de ração salva com sucesso.", created?.id);
  } catch {
    return validationError("Não foi possível salvar a marca de ração agora.");
  }
}

export async function submitFeedBrandForm(formData: FormData): Promise<void> {
  await createFeedBrandAction(formData);
}

export async function createFeedTestAction(formData: FormData): Promise<ActionState> {
  const parsed = feedTestSchema
    .merge(farmScopedSchema)
    .safeParse({
      baselineDailyLiters: readNumber(formData, "baselineDailyLiters"),
      dailyFeedKg: readNumber(formData, "dailyFeedKg"),
      farmId: readRequiredString(formData, "farmId"),
      feedBrandId: readString(formData, "feedBrandId"),
      feedCostTotal: readNumber(formData, "feedCostTotal"),
      label: readRequiredString(formData, "label"),
      milkPricePerLiter: readNumber(formData, "milkPricePerLiter"),
      name: readRequiredString(formData, "name"),
      notes: readString(formData, "notes"),
      periodEnd: readRequiredString(formData, "periodEnd"),
      periodStart: readRequiredString(formData, "periodStart"),
      testDailyLiters: readNumber(formData, "testDailyLiters"),
    });

  if (!parsed.success) {
    return validationError("Confira os dados do teste de ração.", parsed.error.flatten().fieldErrors);
  }

  const databaseGuard = requireDatabaseConfigured();

  if (databaseGuard) {
    return databaseGuard;
  }

  const days = countInclusiveDays(parsed.data.periodStart, parsed.data.periodEnd);

  if (days <= 0) {
    return validationError("Período do teste inválido.");
  }

  try {
    const result = calculateFeedVariant({
      baselineDailyLiters: parsed.data.baselineDailyLiters,
      days,
      feedCostTotal: parsed.data.feedCostTotal,
      label: parsed.data.label,
      milkPricePerLiter: parsed.data.milkPricePerLiter,
      testDailyLiters: parsed.data.testDailyLiters,
    });
    const created = await createFeedTestResult(getDb(), {
      ...parsed.data,
      days,
      result,
    });

    revalidatePath("/", "layout");
    return success("Teste de ração salvo com sucesso.", created?.id);
  } catch {
    return validationError("Não foi possível salvar o teste de ração agora.");
  }
}

export async function submitFeedTestForm(formData: FormData): Promise<void> {
  await createFeedTestAction(formData);
}
