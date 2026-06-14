import { getDb } from "@/db/client";
import { requireApiFarmAccess } from "@/lib/api/farm-access";
import { apiOk, zodError } from "@/lib/api/responses";
import { normalizeMonthKey } from "@/lib/dates/month";
import {
  createExpense,
  getMonthlyExpenseSummaryByReferenceMonth,
  listExpensesByReferenceMonth,
  summarizeExpensesByCategoryByReferenceMonth,
} from "@/lib/repositories/expenses";
import { expenseSchema } from "@/lib/validations/expense";

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
  const [records, summary, byCategory] = await Promise.all([
    listExpensesByReferenceMonth(db, farmId, referenceMonth),
    getMonthlyExpenseSummaryByReferenceMonth(db, farmId, referenceMonth),
    summarizeExpensesByCategoryByReferenceMonth(db, farmId, referenceMonth),
  ]);

  return apiOk({ byCategory, records, referenceMonth, summary });
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

  const created = await createExpense(getDb(), {
    ...parsed.data,
    createdBy: access.user.id,
    farmId,
  });

  return apiOk({ id: created?.id }, 201);
}
