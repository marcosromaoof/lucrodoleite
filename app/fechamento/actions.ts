"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db/client";
import { requireAuthenticatedFarmAccess } from "@/lib/actions/guards";
import { success, validationError, type ActionState } from "@/lib/actions/action-state";
import { readInteger, readNumber, readRequiredString, readString } from "@/lib/forms/form-data";
import { getFarmById, updateFarmClosingCycle } from "@/lib/repositories/farms";
import { deleteMonthlyClosing } from "@/lib/repositories/monthly-closings";
import {
  calculateAndSaveMonthlyClosing,
  MonthlyClosingError,
  recalculateExistingMonthlyClosingById,
} from "@/lib/services/monthly-closing";
import { farmScopedSchema } from "@/lib/validations/scoped";
import { monthlyClosingSchema } from "@/lib/validations/monthly-closing";

const closingCycleSchema = z.object({
  closingCycleEndDay: z.number().int().min(1).max(31),
  closingCycleStartDay: z.number().int().min(1).max(31),
});

export async function updateClosingCycleAction(formData: FormData): Promise<ActionState> {
  const farmId = readRequiredString(formData, "farmId");
  const parsed = closingCycleSchema.safeParse({
    closingCycleEndDay: readInteger(formData, "closingCycleEndDay"),
    closingCycleStartDay: readInteger(formData, "closingCycleStartDay"),
  });

  if (!farmId) {
    return validationError("Fazenda inválida.");
  }

  if (!parsed.success) {
    return validationError("Informe dias entre 1 e 31 para o ciclo do laticínio.", parsed.error.flatten().fieldErrors);
  }

  const accessGuard = await requireAuthenticatedFarmAccess(farmId);

  if (accessGuard.error) {
    return accessGuard.error;
  }

  await updateFarmClosingCycle(getDb(), farmId, parsed.data);
  revalidatePath("/", "layout");

  return success("Regra do ciclo atualizada com sucesso.", farmId);
}

export async function createMonthlyClosingAction(formData: FormData): Promise<ActionState> {
  const parsed = monthlyClosingSchema
    .merge(farmScopedSchema)
    .safeParse({
      farmId: readRequiredString(formData, "farmId"),
      milkInvoiceAmount: readNumber(formData, "milkInvoiceAmount"),
      periodEnd: readString(formData, "periodEnd"),
      periodStart: readString(formData, "periodStart"),
      referenceMonth: readRequiredString(formData, "referenceMonth"),
    });

  if (!parsed.success) {
    return validationError("Confira os dados do fechamento.", parsed.error.flatten().fieldErrors);
  }

  const accessGuard = await requireAuthenticatedFarmAccess(parsed.data.farmId);

  if (accessGuard.error) {
    return accessGuard.error;
  }

  try {
    const db = getDb();
    const farm = await getFarmById(db, parsed.data.farmId);

    if (!farm) {
      return validationError("Fazenda não encontrada.");
    }

    const saved = await calculateAndSaveMonthlyClosing(db, {
      closedBy: accessGuard.user.id,
      farm,
      milkInvoiceAmount: parsed.data.milkInvoiceAmount,
      periodEnd: parsed.data.periodEnd,
      periodStart: parsed.data.periodStart,
      referenceMonth: parsed.data.referenceMonth,
    });

    revalidatePath("/", "layout");

    return success("Fechamento salvo com sucesso.", saved.id);
  } catch (error) {
    if (error instanceof MonthlyClosingError) {
      return validationError(error.message);
    }

    return validationError("Não foi possível salvar o fechamento agora.");
  }
}

export async function recalculateMonthlyClosingAction(formData: FormData): Promise<ActionState> {
  const farmId = readRequiredString(formData, "farmId");
  const closingId = readRequiredString(formData, "closingId");

  if (!farmId || !closingId) {
    return validationError("Fechamento inválido.");
  }

  const accessGuard = await requireAuthenticatedFarmAccess(farmId);

  if (accessGuard.error) {
    return accessGuard.error;
  }

  try {
    await recalculateExistingMonthlyClosingById(getDb(), farmId, closingId);
    revalidatePath("/", "layout");

    return success("Fechamento recalculado com sucesso.", closingId);
  } catch (error) {
    if (error instanceof MonthlyClosingError) {
      return validationError(error.message);
    }

    return validationError("Não foi possível recalcular o fechamento agora.");
  }
}

export async function deleteMonthlyClosingAction(formData: FormData): Promise<ActionState> {
  const farmId = readRequiredString(formData, "farmId");
  const closingId = readRequiredString(formData, "closingId");

  if (!farmId || !closingId) {
    return validationError("Fechamento inválido.");
  }

  const accessGuard = await requireAuthenticatedFarmAccess(farmId);

  if (accessGuard.error) {
    return accessGuard.error;
  }

  await deleteMonthlyClosing(getDb(), farmId, closingId);
  revalidatePath("/", "layout");

  return success("Fechamento excluído com sucesso.", closingId);
}

export async function submitMonthlyClosingForm(formData: FormData): Promise<void> {
  await createMonthlyClosingAction(formData);
}

export async function submitClosingCycleForm(formData: FormData): Promise<void> {
  await updateClosingCycleAction(formData);
}

export async function submitRecalculateMonthlyClosingForm(formData: FormData): Promise<void> {
  await recalculateMonthlyClosingAction(formData);
}

export async function submitDeleteMonthlyClosingForm(formData: FormData): Promise<void> {
  await deleteMonthlyClosingAction(formData);
}
