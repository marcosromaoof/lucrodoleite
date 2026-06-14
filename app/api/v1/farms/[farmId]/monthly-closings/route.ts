import { getDb } from "@/db/client";
import { requireApiFarmAccess } from "@/lib/api/farm-access";
import { apiError, apiOk, zodError } from "@/lib/api/responses";
import { calculateMonthlyClosing } from "@/lib/calculations/financial";
import { getMonthDateRange, getTodayDateKey, normalizeMonthKey } from "@/lib/dates/month";
import { getMonthlyExpenseSummaryByReferenceMonth } from "@/lib/repositories/expenses";
import { getMonthlyClosing, listMonthlyClosings, upsertMonthlyClosing } from "@/lib/repositories/monthly-closings";
import { getMonthlyProductionSummary } from "@/lib/repositories/production";
import { monthlyClosingSchema } from "@/lib/validations/monthly-closing";

export const runtime = "nodejs";

type MonthlyClosingsRouteContext = {
  params: Promise<{
    farmId: string;
  }>;
};

export async function GET(request: Request, context: MonthlyClosingsRouteContext) {
  const { farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const url = new URL(request.url);
  const referenceMonth = url.searchParams.get("referenceMonth");

  if (referenceMonth) {
    const closing = await getMonthlyClosing(getDb(), farmId, normalizeMonthKey(referenceMonth));

    return apiOk({ closing });
  }

  const records = await listMonthlyClosings(getDb(), farmId);

  return apiOk({ records });
}

export async function POST(request: Request, context: MonthlyClosingsRouteContext) {
  const { farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const parsed = monthlyClosingSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return zodError(parsed.error.flatten().fieldErrors);
  }

  const db = getDb();
  const range = getMonthDateRange(parsed.data.referenceMonth);
  const [productionSummary, expenseSummary] = await Promise.all([
    getMonthlyProductionSummary(db, farmId, range.startDate, range.endDate, getTodayDateKey()),
    getMonthlyExpenseSummaryByReferenceMonth(db, farmId, parsed.data.referenceMonth),
  ]);

  if (productionSummary.totalLiters <= 0) {
    return apiError(400, "production_required", "Registre a producao do mes antes de fechar.");
  }

  const result = calculateMonthlyClosing({
    milkInvoiceAmount: parsed.data.milkInvoiceAmount,
    totalExpenses: expenseSummary.totalAmount,
    totalFeedAmount: expenseSummary.feedAmount,
    totalLiters: productionSummary.totalLiters,
  });
  const created = await upsertMonthlyClosing(db, {
    ...result,
    closedBy: access.user.id,
    farmId,
    milkInvoiceAmount: parsed.data.milkInvoiceAmount,
    referenceMonth: parsed.data.referenceMonth,
    totalExpenses: expenseSummary.totalAmount,
    totalFeedAmount: expenseSummary.feedAmount,
    totalLiters: productionSummary.totalLiters,
  });

  return apiOk({ id: created?.id, result }, 201);
}
