"use server";

import { getDb } from "@/db/client";
import { createExpense } from "@/lib/repositories/expenses";
import { readNumber, readRequiredString, readString } from "@/lib/forms/form-data";
import { expenseSchema } from "@/lib/validations/expense";
import { farmScopedSchema } from "@/lib/validations/scoped";
import { requireDatabaseConfigured } from "@/lib/actions/guards";
import { success, validationError, type ActionState } from "@/lib/actions/action-state";
import { revalidatePath } from "next/cache";

export async function createExpenseAction(formData: FormData): Promise<ActionState> {
  const parsed = expenseSchema
    .merge(farmScopedSchema)
    .safeParse({
      farmId: readRequiredString(formData, "farmId"),
      date: readRequiredString(formData, "date"),
      referenceMonth: readRequiredString(formData, "referenceMonth"),
      category: readRequiredString(formData, "category"),
      supplier: readString(formData, "supplier"),
      description: readRequiredString(formData, "description"),
      amount: readNumber(formData, "amount"),
      feedBrandId: readString(formData, "feedBrandId"),
      feedTestId: readString(formData, "feedTestId"),
    });

  if (!parsed.success) {
    return validationError("Confira os dados da despesa.", parsed.error.flatten().fieldErrors);
  }

  const databaseGuard = requireDatabaseConfigured();

  if (databaseGuard) {
    return databaseGuard;
  }

  try {
    const created = await createExpense(getDb(), parsed.data);
    revalidatePath("/", "layout");
    return success("Despesa salva com sucesso.", created?.id);
  } catch {
    return validationError("Não foi possível salvar a despesa agora.");
  }
}

export async function submitExpenseForm(formData: FormData): Promise<void> {
  await createExpenseAction(formData);
}
