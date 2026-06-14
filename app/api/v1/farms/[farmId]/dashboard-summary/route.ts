import { getDb } from "@/db/client";
import { requireApiFarmAccess } from "@/lib/api/farm-access";
import { apiOk } from "@/lib/api/responses";
import { calculateMonthlyEstimate, safeDivide } from "@/lib/calculations/financial";
import { getCycleDateRange, getTodayDateKey, normalizeMonthKey } from "@/lib/dates/month";
import { getMonthlyExpenseSummary, listExpensesByMonth } from "@/lib/repositories/expenses";
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
  const todayDate = getTodayDateKey();
  const db = getDb();
  const farm = await getFarmForUser(db, farmId, access.user.id);

  if (!farm) {
    return apiOk({ farm: null, referenceMonth });
  }

  const range = getCycleDateRange(referenceMonth, farm.closingCycleStartDay, farm.closingCycleEndDay);
  const [productionSummary, expenseSummary, productions, expenses, feedBrands, feedTests] = await Promise.all([
    getMonthlyProductionSummary(db, farmId, range.startDate, range.endDate, todayDate),
    getMonthlyExpenseSummary(db, farmId, range.startDate, range.endDate),
    listProductionsByMonth(db, farmId, range.startDate, range.endDate),
    listExpensesByMonth(db, farmId, range.startDate, range.endDate),
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
    periodEnd: range.endDate,
    periodStart: range.startDate,
    referenceMonth,
    resultAfterFeedPerLiter: pricePerLiter - feedCostPerLiter,
    resultEstimate: estimate,
  });
}
