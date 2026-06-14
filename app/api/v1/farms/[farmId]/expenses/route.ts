import { getDb } from "@/db/client";
import { requireApiFarmAccess } from "@/lib/api/farm-access";
import { apiError, apiOk, zodError } from "@/lib/api/responses";
import { getCycleDateRange, normalizeMonthKey } from "@/lib/dates/month";
import {
  createExpense,
  getMonthlyExpenseSummary,
  listExpensesByMonth,
  summarizeExpensesByCategory,
} from "@/lib/repositories/expenses";
import { getFarmForUser } from "@/lib/repositories/farms";
import { MonthlyClosingError, recalculateClosingsForDates } from "@/lib/services/monthly-closing";
import { expenseSchema, normalizeExpenseInput } from "@/lib/validations/expense";

export const runtime = "nodejs";

type ExpensesRouteContext = {
  params: Promise<{
    farmId: string;
  }>;
};

export async function GET(request: Request, context: ExpensesRouteContext) {
  const { farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const url = new URL(request.url);
  const referenceMonth = normalizeMonthKey(url.searchParams.get("referenceMonth") ?? undefined);
  const db = getDb();
  const farm = await getFarmForUser(db, farmId, access.user.id);

  if (!farm) {
    return apiError(403, "forbidden", "Voce nao tem acesso a esta fazenda.");
  }

  const range = getCycleDateRange(referenceMonth, farm.closingCycleStartDay, farm.closingCycleEndDay);
  const [records, summary, byCategory] = await Promise.all([
    listExpensesByMonth(db, farmId, range.startDate, range.endDate),
    getMonthlyExpenseSummary(db, farmId, range.startDate, range.endDate),
    summarizeExpensesByCategory(db, farmId, range.startDate, range.endDate),
  ]);

  return apiOk({ byCategory, periodEnd: range.endDate, periodStart: range.startDate, records, referenceMonth, summary });
}

export async function POST(request: Request, context: ExpensesRouteContext) {
  const { farmId } = await context.params;
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
    const created = await createExpense(db, {
      ...normalizeExpenseInput(parsed.data),
      createdBy: access.user.id,
      farmId,
    });
    await recalculateClosingsForDates(db, farmId, [parsed.data.date]);

    return apiOk({ id: created?.id }, 201);
  } catch (error) {
    if (error instanceof MonthlyClosingError) {
      return apiError(400, error.code, error.message);
    }

    return apiError(500, "expense_error", "Nao foi possivel salvar a despesa.");
  }
}
