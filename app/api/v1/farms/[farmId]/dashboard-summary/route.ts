import { getDb } from "@/db/client";
import { requireApiFarmAccess } from "@/lib/api/farm-access";
import { apiOk } from "@/lib/api/responses";
import { calculateMonthlyEstimate, safeDivide } from "@/lib/calculations/financial";
import { getMonthDateRange, getTodayDateKey, normalizeMonthKey } from "@/lib/dates/month";
import { getMonthlyExpenseSummaryByReferenceMonth, listExpensesByReferenceMonth } from "@/lib/repositories/expenses";
import { getFarmForUser } from "@/lib/repositories/farms";
import { listFeedBrands } from "@/lib/repositories/feed-brands";
import { listFeedTestResults } from "@/lib/repositories/feed-tests";
import { getMonthlyProductionSummary, listProductionsByMonth } from "@/lib/repositories/production";

export const runtime = "nodejs";

type DashboardSummaryRouteContext = {
  params: Promise<{
    farmId: string;
  }>;
};

export async function GET(request: Request, context: DashboardSummaryRouteContext) {
  const { farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const url = new URL(request.url);
  const referenceMonth = normalizeMonthKey(url.searchParams.get("referenceMonth") ?? undefined);
  const range = getMonthDateRange(referenceMonth);
  const todayDate = getTodayDateKey();
  const db = getDb();
  const [farm, productionSummary, expenseSummary, productions, expenses, feedBrands, feedTests] = await Promise.all([
    getFarmForUser(db, farmId, access.user.id),
    getMonthlyProductionSummary(db, farmId, range.startDate, range.endDate, todayDate),
    getMonthlyExpenseSummaryByReferenceMonth(db, farmId, referenceMonth),
    listProductionsByMonth(db, farmId, range.startDate, range.endDate),
    listExpensesByReferenceMonth(db, farmId, referenceMonth),
    listFeedBrands(db, farmId),
    listFeedTestResults(db, farmId),
  ]);
  const pricePerLiter = farm?.defaultPricePerLiter ?? 0;
  const estimate = calculateMonthlyEstimate({
    estimatedPricePerLiter: pricePerLiter,
    totalExpenses: expenseSummary.totalAmount,
    totalLiters: productionSummary.totalLiters,
  });
  const feedCostPerLiter = safeDivide(expenseSummary.feedAmount, productionSummary.totalLiters);

  return apiOk({
    expenseSummary,
    feedBrands,
    feedCostPerLiter,
    feedTests,
    farm,
    pricePerLiter,
    productionSummary,
    recentExpenses: expenses.slice(0, 12),
    recentProductions: productions.slice(0, 12),
    referenceMonth,
    resultAfterFeedPerLiter: pricePerLiter - feedCostPerLiter,
    resultEstimate: estimate,
  });
}
