"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { requireAuthenticatedFarmAccess } from "@/lib/actions/guards";
import { success, validationError, type ActionState } from "@/lib/actions/action-state";
import { readNumber, readRequiredString, readString } from "@/lib/forms/form-data";
import { createExpense, deleteExpense, getExpenseById, updateExpense } from "@/lib/repositories/expenses";
import { MonthlyClosingError, recalculateClosingsForDates } from "@/lib/services/monthly-closing";
import { expenseSchema, normalizeExpenseInput } from "@/lib/validations/expense";
import { farmScopedSchema } from "@/lib/validations/scoped";

function parseExpenseForm(formData: FormData) {
  return expenseSchema
    .merge(farmScopedSchema)
    .safeParse({
      farmId: readRequiredString(formData, "farmId"),
      date: readRequiredString(formData, "date"),
      referenceMonth: readRequiredString(formData, "referenceMonth"),
      category: readRequiredString(formData, "category"),
      supplier: readString(formData, "supplier"),
      description: readRequiredString(formData, "description"),
      amount: readNumber(formData, "amount"),
      quantity: readNumber(formData, "quantity"),
      unit: readString(formData, "unit"),
      unitPrice: readNumber(formData, "unitPrice"),
      feedBrandId: readString(formData, "feedBrandId"),
      feedTestId: readString(formData, "feedTestId"),
    });
}

export async function createExpenseAction(formData: FormData): Promise<ActionState> {
  const parsed = parseExpenseForm(formData);

  if (!parsed.success) {
    return validationError("Confira os dados da despesa.", parsed.error.flatten().fieldErrors);
  }

  const accessGuard = await requireAuthenticatedFarmAccess(parsed.data.farmId);

  if (accessGuard.error) {
    return accessGuard.error;
  }

  try {
    const db = getDb();
    const created = await createExpense(db, {
      ...normalizeExpenseInput(parsed.data),
      createdBy: accessGuard.user.id,
      farmId: parsed.data.farmId,
    });

    await recalculateClosingsForDates(db, parsed.data.farmId, [parsed.data.date]);
    revalidatePath("/", "layout");

    return success("Despesa salva com sucesso.", created?.id);
  } catch (error) {
    if (error instanceof MonthlyClosingError) {
      return validationError(error.message);
    }

    return validationError("Não foi possível salvar a despesa agora.");
  }
}

export async function updateExpenseAction(formData: FormData): Promise<ActionState> {
  const expenseId = readRequiredString(formData, "expenseId");
  const parsed = parseExpenseForm(formData);

  if (!expenseId) {
    return validationError("Despesa inválida.");
  }

  if (!parsed.success) {
    return validationError("Confira os dados da despesa.", parsed.error.flatten().fieldErrors);
  }

  const accessGuard = await requireAuthenticatedFarmAccess(parsed.data.farmId);

  if (accessGuard.error) {
    return accessGuard.error;
  }

  try {
    const db = getDb();
    const existing = await getExpenseById(db, parsed.data.farmId, expenseId);

    if (!existing) {
      return validationError("Despesa não encontrada.");
    }

    const updated = await updateExpense(db, parsed.data.farmId, expenseId, normalizeExpenseInput(parsed.data));

    await recalculateClosingsForDates(db, parsed.data.farmId, [existing.date, parsed.data.date]);
    revalidatePath("/", "layout");

    return success("Despesa atualizada com sucesso.", updated?.id);
  } catch (error) {
    if (error instanceof MonthlyClosingError) {
      return validationError(error.message);
    }

    return validationError("Não foi possível atualizar a despesa agora.");
  }
}

export async function deleteExpenseAction(formData: FormData): Promise<ActionState> {
  const farmId = readRequiredString(formData, "farmId");
  const expenseId = readRequiredString(formData, "expenseId");

  if (!farmId || !expenseId) {
    return validationError("Despesa inválida.");
  }

  const accessGuard = await requireAuthenticatedFarmAccess(farmId);

  if (accessGuard.error) {
    return accessGuard.error;
  }

  try {
    const db = getDb();
    const existing = await getExpenseById(db, farmId, expenseId);

    if (!existing) {
      return validationError("Despesa não encontrada.");
    }

    await deleteExpense(db, farmId, expenseId);
    await recalculateClosingsForDates(db, farmId, [existing.date]);
    revalidatePath("/", "layout");

    return success("Despesa excluída com sucesso.", expenseId);
  } catch (error) {
    if (error instanceof MonthlyClosingError) {
      return validationError(error.message);
    }

    return validationError("Não foi possível excluir a despesa agora.");
  }
}

export async function submitExpenseForm(formData: FormData): Promise<void> {
  const expenseId = readString(formData, "expenseId");

  if (expenseId) {
    await updateExpenseAction(formData);
    return;
  }

  await createExpenseAction(formData);
}

export async function submitDeleteExpenseForm(formData: FormData): Promise<void> {
  await deleteExpenseAction(formData);
}
