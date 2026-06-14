"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { requireAuthenticatedFarmAccess } from "@/lib/actions/guards";
import { success, validationError, type ActionState } from "@/lib/actions/action-state";
import { calculateFeedVariant } from "@/lib/calculations/feed";
import { countInclusiveDays } from "@/lib/dates/days";
import { readNumber, readRequiredString, readString } from "@/lib/forms/form-data";
import { createFeedBrand, deleteFeedBrand, updateFeedBrand } from "@/lib/repositories/feed-brands";
import { createFeedTestResult, deleteFeedTest, updateFeedTestResult } from "@/lib/repositories/feed-tests";
import { feedBrandSchema } from "@/lib/validations/feed-brand";
import { feedTestSchema } from "@/lib/validations/feed-test";
import { farmScopedSchema } from "@/lib/validations/scoped";

function parseFeedBrandForm(formData: FormData) {
  return feedBrandSchema
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
}

export async function createFeedBrandAction(formData: FormData): Promise<ActionState> {
  const parsed = parseFeedBrandForm(formData);

  if (!parsed.success) {
    return validationError("Confira os dados da marca de ração.", parsed.error.flatten().fieldErrors);
  }

  const accessGuard = await requireAuthenticatedFarmAccess(parsed.data.farmId);

  if (accessGuard.error) {
    return accessGuard.error;
  }

  try {
    const created = await createFeedBrand(getDb(), parsed.data);
    revalidatePath("/", "layout");

    return success("Marca de ração salva com sucesso.", created?.id);
  } catch {
    return validationError("Não foi possível salvar a marca de ração agora.");
  }
}

export async function updateFeedBrandAction(formData: FormData): Promise<ActionState> {
  const feedBrandId = readRequiredString(formData, "feedBrandId");
  const parsed = parseFeedBrandForm(formData);

  if (!feedBrandId) {
    return validationError("Marca de ração inválida.");
  }

  if (!parsed.success) {
    return validationError("Confira os dados da marca de ração.", parsed.error.flatten().fieldErrors);
  }

  const accessGuard = await requireAuthenticatedFarmAccess(parsed.data.farmId);

  if (accessGuard.error) {
    return accessGuard.error;
  }

  try {
    const updated = await updateFeedBrand(getDb(), parsed.data.farmId, feedBrandId, parsed.data);
    revalidatePath("/", "layout");

    return success("Marca de ração atualizada com sucesso.", updated?.id);
  } catch {
    return validationError("Não foi possível atualizar a marca de ração agora.");
  }
}

export async function deleteFeedBrandAction(formData: FormData): Promise<ActionState> {
  const farmId = readRequiredString(formData, "farmId");
  const feedBrandId = readRequiredString(formData, "feedBrandId");

  if (!farmId || !feedBrandId) {
    return validationError("Marca de ração inválida.");
  }

  const accessGuard = await requireAuthenticatedFarmAccess(farmId);

  if (accessGuard.error) {
    return accessGuard.error;
  }

  const result = await deleteFeedBrand(getDb(), farmId, feedBrandId);

  if (!result.deleted) {
    return validationError(result.reason ?? "Não foi possível excluir a marca de ração.");
  }

  revalidatePath("/", "layout");

  return success("Marca de ração excluída com sucesso.", feedBrandId);
}

export async function submitFeedBrandForm(formData: FormData): Promise<void> {
  const feedBrandId = readString(formData, "feedBrandId");

  if (feedBrandId) {
    await updateFeedBrandAction(formData);
    return;
  }

  await createFeedBrandAction(formData);
}

export async function submitDeleteFeedBrandForm(formData: FormData): Promise<void> {
  await deleteFeedBrandAction(formData);
}

function parseFeedTestForm(formData: FormData) {
  return feedTestSchema
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
}

function buildFeedTestResult(parsed: ReturnType<typeof parseFeedTestForm>) {
  if (!parsed.success) {
    return null;
  }

  const days = countInclusiveDays(parsed.data.periodStart, parsed.data.periodEnd);

  if (days <= 0) {
    return null;
  }

  return {
    days,
    result: calculateFeedVariant({
      baselineDailyLiters: parsed.data.baselineDailyLiters,
      days,
      feedCostTotal: parsed.data.feedCostTotal,
      label: parsed.data.label,
      milkPricePerLiter: parsed.data.milkPricePerLiter,
      testDailyLiters: parsed.data.testDailyLiters,
    }),
  };
}

export async function createFeedTestAction(formData: FormData): Promise<ActionState> {
  const parsed = parseFeedTestForm(formData);

  if (!parsed.success) {
    return validationError("Confira os dados do teste de ração.", parsed.error.flatten().fieldErrors);
  }

  const accessGuard = await requireAuthenticatedFarmAccess(parsed.data.farmId);

  if (accessGuard.error) {
    return accessGuard.error;
  }

  const built = buildFeedTestResult(parsed);

  if (!built) {
    return validationError("Período do teste inválido.");
  }

  try {
    const created = await createFeedTestResult(getDb(), {
      ...parsed.data,
      createdBy: accessGuard.user.id,
      days: built.days,
      result: built.result,
    });

    revalidatePath("/", "layout");

    return success("Teste de ração salvo com sucesso.", created?.id);
  } catch {
    return validationError("Não foi possível salvar o teste de ração agora.");
  }
}

export async function updateFeedTestAction(formData: FormData): Promise<ActionState> {
  const feedTestId = readRequiredString(formData, "feedTestId");
  const parsed = parseFeedTestForm(formData);

  if (!feedTestId) {
    return validationError("Teste de ração inválido.");
  }

  if (!parsed.success) {
    return validationError("Confira os dados do teste de ração.", parsed.error.flatten().fieldErrors);
  }

  const accessGuard = await requireAuthenticatedFarmAccess(parsed.data.farmId);

  if (accessGuard.error) {
    return accessGuard.error;
  }

  const built = buildFeedTestResult(parsed);

  if (!built) {
    return validationError("Período do teste inválido.");
  }

  try {
    const updated = await updateFeedTestResult(getDb(), {
      ...parsed.data,
      createdBy: accessGuard.user.id,
      days: built.days,
      id: feedTestId,
      result: built.result,
    });

    revalidatePath("/", "layout");

    return success("Teste de ração atualizado com sucesso.", updated?.id);
  } catch {
    return validationError("Não foi possível atualizar o teste de ração agora.");
  }
}

export async function deleteFeedTestAction(formData: FormData): Promise<ActionState> {
  const farmId = readRequiredString(formData, "farmId");
  const feedTestId = readRequiredString(formData, "feedTestId");

  if (!farmId || !feedTestId) {
    return validationError("Teste de ração inválido.");
  }

  const accessGuard = await requireAuthenticatedFarmAccess(farmId);

  if (accessGuard.error) {
    return accessGuard.error;
  }

  const result = await deleteFeedTest(getDb(), farmId, feedTestId);

  if (!result.deleted) {
    return validationError(result.reason ?? "Não foi possível excluir o teste de ração.");
  }

  revalidatePath("/", "layout");

  return success("Teste de ração excluído com sucesso.", feedTestId);
}

export async function submitFeedTestForm(formData: FormData): Promise<void> {
  const feedTestId = readString(formData, "feedTestId");

  if (feedTestId) {
    await updateFeedTestAction(formData);
    return;
  }

  await createFeedTestAction(formData);
}

export async function submitDeleteFeedTestForm(formData: FormData): Promise<void> {
  await deleteFeedTestAction(formData);
}
