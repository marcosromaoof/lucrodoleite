"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { requireAuthenticatedFarmAccess } from "@/lib/actions/guards";
import { success, validationError, type ActionState } from "@/lib/actions/action-state";
import { readNumber, readRequiredString, readString } from "@/lib/forms/form-data";
import {
  createCow,
  createCowEvaluation,
  createCowEvaluationEntry,
  deleteCow,
  deleteCowEvaluation,
  deleteCowEvaluationEntry,
  getCowEvaluationEntryById,
  updateCow,
  updateCowEvaluation,
  updateCowEvaluationEntry,
} from "@/lib/repositories/cows";
import { cowEvaluationEntrySchema, cowEvaluationSchema, cowSchema } from "@/lib/validations/cow";
import { farmScopedSchema } from "@/lib/validations/scoped";

function parseCowForm(formData: FormData) {
  return cowSchema
    .merge(farmScopedSchema)
    .safeParse({
      birthDate: readString(formData, "birthDate"),
      breed: readString(formData, "breed"),
      farmId: readRequiredString(formData, "farmId"),
      identification: readRequiredString(formData, "identification"),
      name: readString(formData, "name"),
      notes: readString(formData, "notes"),
      status: readRequiredString(formData, "status") || "active",
    });
}

function parseEvaluationForm(formData: FormData) {
  return cowEvaluationSchema
    .merge(farmScopedSchema)
    .safeParse({
      baselineEndDate: readRequiredString(formData, "baselineEndDate"),
      baselineStartDate: readRequiredString(formData, "baselineStartDate"),
      cowId: readRequiredString(formData, "cowId"),
      farmId: readRequiredString(formData, "farmId"),
      milkPricePerLiter: readNumber(formData, "milkPricePerLiter"),
      name: readRequiredString(formData, "name"),
      notes: readString(formData, "notes"),
      testEndDate: readRequiredString(formData, "testEndDate"),
      testStartDate: readRequiredString(formData, "testStartDate"),
    });
}

function parseEntryForm(formData: FormData) {
  return cowEvaluationEntrySchema
    .merge(farmScopedSchema)
    .safeParse({
      date: readRequiredString(formData, "date"),
      farmId: readRequiredString(formData, "farmId"),
      feedKg: readNumber(formData, "feedKg"),
      feedPricePerKg: readNumber(formData, "feedPricePerKg"),
      liters: readNumber(formData, "liters"),
      notes: readString(formData, "notes"),
      otherCosts: readNumber(formData, "otherCosts"),
      phase: readRequiredString(formData, "phase"),
      silageKg: readNumber(formData, "silageKg"),
      silagePricePerKg: readNumber(formData, "silagePricePerKg"),
    });
}

export async function createCowAction(formData: FormData): Promise<ActionState> {
  const parsed = parseCowForm(formData);

  if (!parsed.success) {
    return validationError("Confira os dados da vaca.", parsed.error.flatten().fieldErrors);
  }

  const accessGuard = await requireAuthenticatedFarmAccess(parsed.data.farmId);

  if (accessGuard.error) {
    return accessGuard.error;
  }

  try {
    const created = await createCow(getDb(), {
      ...parsed.data,
      createdBy: accessGuard.user.id,
    });
    revalidatePath("/", "layout");

    return success("Vaca salva com sucesso.", created?.id);
  } catch {
    return validationError("Não foi possível salvar a vaca. Confira se a identificação já existe.");
  }
}

export async function updateCowAction(formData: FormData): Promise<ActionState> {
  const cowId = readRequiredString(formData, "cowId");
  const parsed = parseCowForm(formData);

  if (!cowId) {
    return validationError("Vaca inválida.");
  }

  if (!parsed.success) {
    return validationError("Confira os dados da vaca.", parsed.error.flatten().fieldErrors);
  }

  const accessGuard = await requireAuthenticatedFarmAccess(parsed.data.farmId);

  if (accessGuard.error) {
    return accessGuard.error;
  }

  const updated = await updateCow(getDb(), parsed.data.farmId, cowId, parsed.data);

  if (updated.conflict) {
    return validationError("Já existe uma vaca com esta identificação.");
  }

  revalidatePath("/", "layout");

  return success("Vaca atualizada com sucesso.", updated.record?.id);
}

export async function deleteCowAction(formData: FormData): Promise<ActionState> {
  const farmId = readRequiredString(formData, "farmId");
  const cowId = readRequiredString(formData, "cowId");

  if (!farmId || !cowId) {
    return validationError("Vaca inválida.");
  }

  const accessGuard = await requireAuthenticatedFarmAccess(farmId);

  if (accessGuard.error) {
    return accessGuard.error;
  }

  const result = await deleteCow(getDb(), farmId, cowId);

  if (!result.deleted) {
    return validationError(result.reason ?? "Não foi possível excluir a vaca.");
  }

  revalidatePath("/", "layout");

  return success("Vaca excluída com sucesso.", cowId);
}

export async function createCowEvaluationAction(formData: FormData): Promise<ActionState> {
  const parsed = parseEvaluationForm(formData);

  if (!parsed.success) {
    return validationError("Confira os dados da avaliação.", parsed.error.flatten().fieldErrors);
  }

  const accessGuard = await requireAuthenticatedFarmAccess(parsed.data.farmId);

  if (accessGuard.error) {
    return accessGuard.error;
  }

  const created = await createCowEvaluation(getDb(), {
    ...parsed.data,
    createdBy: accessGuard.user.id,
  });

  if (!created) {
    return validationError("Vaca não encontrada para esta fazenda.");
  }

  revalidatePath("/", "layout");

  return success("Avaliação salva com sucesso.", created.id);
}

export async function updateCowEvaluationAction(formData: FormData): Promise<ActionState> {
  const evaluationId = readRequiredString(formData, "evaluationId");
  const parsed = parseEvaluationForm(formData);

  if (!evaluationId) {
    return validationError("Avaliação inválida.");
  }

  if (!parsed.success) {
    return validationError("Confira os dados da avaliação.", parsed.error.flatten().fieldErrors);
  }

  const accessGuard = await requireAuthenticatedFarmAccess(parsed.data.farmId);

  if (accessGuard.error) {
    return accessGuard.error;
  }

  const updated = await updateCowEvaluation(getDb(), parsed.data.farmId, evaluationId, parsed.data);

  if (!updated) {
    return validationError("Avaliação ou vaca não encontrada.");
  }

  revalidatePath("/", "layout");

  return success("Avaliação atualizada com sucesso.", updated.id);
}

export async function deleteCowEvaluationAction(formData: FormData): Promise<ActionState> {
  const farmId = readRequiredString(formData, "farmId");
  const evaluationId = readRequiredString(formData, "evaluationId");

  if (!farmId || !evaluationId) {
    return validationError("Avaliação inválida.");
  }

  const accessGuard = await requireAuthenticatedFarmAccess(farmId);

  if (accessGuard.error) {
    return accessGuard.error;
  }

  await deleteCowEvaluation(getDb(), farmId, evaluationId);
  revalidatePath("/", "layout");

  return success("Avaliação excluída com sucesso.", evaluationId);
}

export async function createCowEvaluationEntryAction(formData: FormData): Promise<ActionState> {
  const evaluationId = readRequiredString(formData, "evaluationId");
  const parsed = parseEntryForm(formData);

  if (!evaluationId) {
    return validationError("Avaliação inválida.");
  }

  if (!parsed.success) {
    return validationError("Confira os dados do lançamento.", parsed.error.flatten().fieldErrors);
  }

  const accessGuard = await requireAuthenticatedFarmAccess(parsed.data.farmId);

  if (accessGuard.error) {
    return accessGuard.error;
  }

  const created = await createCowEvaluationEntry(getDb(), {
    ...parsed.data,
    createdBy: accessGuard.user.id,
    evaluationId,
  });

  if (created.conflict) {
    return validationError("Já existe lançamento para esta data e fase.");
  }

  if (!created.record) {
    return validationError("Avaliação não encontrada.");
  }

  revalidatePath("/", "layout");

  return success("Lançamento salvo com sucesso.", created.record.id);
}

export async function updateCowEvaluationEntryAction(formData: FormData): Promise<ActionState> {
  const entryId = readRequiredString(formData, "entryId");
  const evaluationId = readRequiredString(formData, "evaluationId");
  const parsed = parseEntryForm(formData);

  if (!entryId || !evaluationId) {
    return validationError("Lançamento inválido.");
  }

  if (!parsed.success) {
    return validationError("Confira os dados do lançamento.", parsed.error.flatten().fieldErrors);
  }

  const accessGuard = await requireAuthenticatedFarmAccess(parsed.data.farmId);

  if (accessGuard.error) {
    return accessGuard.error;
  }

  const existing = await getCowEvaluationEntryById(getDb(), parsed.data.farmId, evaluationId, entryId);

  if (!existing) {
    return validationError("Lançamento não encontrado.");
  }

  const updated = await updateCowEvaluationEntry(getDb(), parsed.data.farmId, evaluationId, entryId, parsed.data);

  if (updated.conflict) {
    return validationError("Já existe lançamento para esta data e fase.");
  }

  revalidatePath("/", "layout");

  return success("Lançamento atualizado com sucesso.", updated.record?.id);
}

export async function deleteCowEvaluationEntryAction(formData: FormData): Promise<ActionState> {
  const farmId = readRequiredString(formData, "farmId");
  const evaluationId = readRequiredString(formData, "evaluationId");
  const entryId = readRequiredString(formData, "entryId");

  if (!farmId || !evaluationId || !entryId) {
    return validationError("Lançamento inválido.");
  }

  const accessGuard = await requireAuthenticatedFarmAccess(farmId);

  if (accessGuard.error) {
    return accessGuard.error;
  }

  await deleteCowEvaluationEntry(getDb(), farmId, evaluationId, entryId);
  revalidatePath("/", "layout");

  return success("Lançamento excluído com sucesso.", entryId);
}

export async function submitCowForm(formData: FormData): Promise<void> {
  const cowId = readString(formData, "cowId");

  if (cowId) {
    await updateCowAction(formData);
    return;
  }

  await createCowAction(formData);
}

export async function submitDeleteCowForm(formData: FormData): Promise<void> {
  await deleteCowAction(formData);
}

export async function submitCowEvaluationForm(formData: FormData): Promise<void> {
  const evaluationId = readString(formData, "evaluationId");

  if (evaluationId) {
    await updateCowEvaluationAction(formData);
    return;
  }

  await createCowEvaluationAction(formData);
}

export async function submitDeleteCowEvaluationForm(formData: FormData): Promise<void> {
  await deleteCowEvaluationAction(formData);
}

export async function submitCowEvaluationEntryForm(formData: FormData): Promise<void> {
  const entryId = readString(formData, "entryId");

  if (entryId) {
    await updateCowEvaluationEntryAction(formData);
    return;
  }

  await createCowEvaluationEntryAction(formData);
}

export async function submitDeleteCowEvaluationEntryForm(formData: FormData): Promise<void> {
  await deleteCowEvaluationEntryAction(formData);
}
