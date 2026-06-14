import { getDb } from "@/db/client";
import { requireApiFarmAccess } from "@/lib/api/farm-access";
import { apiError, apiOk, zodError } from "@/lib/api/responses";
import { deleteExpense, getExpenseById, updateExpense } from "@/lib/repositories/expenses";
import { MonthlyClosingError, recalculateClosingsForDates } from "@/lib/services/monthly-closing";
import { expenseSchema, normalizeExpenseInput } from "@/lib/validations/expense";

export const runtime = "nodejs";

type ExpenseItemRouteContext = {
  params: Promise<{
    expenseId: string;
    farmId: string;
  }>;
};

export async function PATCH(request: Request, context: ExpenseItemRouteContext) {
  const { expenseId, farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const parsed = expenseSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return zodError(parsed.error.flatten().fieldErrors);
  }

  try {
    const db = getDb();
    const existing = await getExpenseById(db, farmId, expenseId);

    if (!existing) {
      return apiError(404, "not_found", "Despesa nao encontrada.");
    }

    const updated = await updateExpense(db, farmId, expenseId, normalizeExpenseInput(parsed.data));

    await recalculateClosingsForDates(db, farmId, [existing.date, parsed.data.date]);

    return apiOk({ id: updated?.id ?? expenseId });
  } catch (error) {
    if (error instanceof MonthlyClosingError) {
      return apiError(400, error.code, error.message);
    }

    return apiError(500, "expense_error", "Nao foi possivel atualizar a despesa.");
  }
}

export async function DELETE(request: Request, context: ExpenseItemRouteContext) {
  const { expenseId, farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  try {
    const db = getDb();
    const existing = await getExpenseById(db, farmId, expenseId);

    if (!existing) {
      return apiError(404, "not_found", "Despesa nao encontrada.");
    }

    await deleteExpense(db, farmId, expenseId);
    await recalculateClosingsForDates(db, farmId, [existing.date]);

    return apiOk({ id: expenseId });
  } catch (error) {
    if (error instanceof MonthlyClosingError) {
      return apiError(400, error.code, error.message);
    }

    return apiError(500, "expense_error", "Nao foi possivel excluir a despesa.");
  }
}
