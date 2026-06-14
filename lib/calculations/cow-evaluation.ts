export const cowEvaluationPhases = ["baseline", "test"] as const;

export type CowEvaluationPhase = (typeof cowEvaluationPhases)[number];

export type CowEvaluationEntryInput = {
  date?: string;
  feedKg?: number | null;
  feedPricePerKg?: number | null;
  liters: number;
  otherCosts?: number | null;
  phase: CowEvaluationPhase;
  silageKg?: number | null;
  silagePricePerKg?: number | null;
};

export type CowEntryResult = CowEvaluationEntryInput & {
  feedCost: number;
  freeProfitAfterNutrition: number;
  netProfit: number;
  nutritionCost: number;
  otherCostsValue: number;
  revenue: number;
  silageCost: number;
  totalCost: number;
};

export type CowPhaseSummary = {
  averageDailyLiters: number;
  averageDailyNetProfit: number;
  averageDailyNutritionCost: number;
  dayCount: number;
  feedCost: number;
  freeProfitAfterNutrition: number;
  liters: number;
  netProfit: number;
  nutritionCost: number;
  otherCosts: number;
  projectedMonthlyLiters: number;
  projectedMonthlyNetProfit: number;
  revenue: number;
  silageCost: number;
  totalCost: number;
};

export type CowEvaluationSummary = {
  baseline: CowPhaseSummary;
  comparison: {
    additionalDailyCost: number;
    additionalDailyProfit: number;
    extraDailyLiters: number;
    extraMonthlyLiters: number;
    extraRevenue: number;
    profitCompensated: boolean;
  };
  entries: CowEntryResult[];
  test: CowPhaseSummary;
  total: CowPhaseSummary;
};

const emptyPhaseSummary: CowPhaseSummary = {
  averageDailyLiters: 0,
  averageDailyNetProfit: 0,
  averageDailyNutritionCost: 0,
  dayCount: 0,
  feedCost: 0,
  freeProfitAfterNutrition: 0,
  liters: 0,
  netProfit: 0,
  nutritionCost: 0,
  otherCosts: 0,
  projectedMonthlyLiters: 0,
  projectedMonthlyNetProfit: 0,
  revenue: 0,
  silageCost: 0,
  totalCost: 0,
};

export function calculateCowEntry(input: CowEvaluationEntryInput, milkPricePerLiter: number): CowEntryResult {
  const feedCost = (input.feedKg ?? 0) * (input.feedPricePerKg ?? 0);
  const silageCost = (input.silageKg ?? 0) * (input.silagePricePerKg ?? 0);
  const nutritionCost = feedCost + silageCost;
  const otherCostsValue = input.otherCosts ?? 0;
  const totalCost = nutritionCost + otherCostsValue;
  const revenue = input.liters * milkPricePerLiter;

  return {
    ...input,
    feedCost,
    freeProfitAfterNutrition: revenue - nutritionCost,
    netProfit: revenue - totalCost,
    nutritionCost,
    otherCostsValue,
    revenue,
    silageCost,
    totalCost,
  };
}

export function summarizeCowEvaluation(
  entries: CowEvaluationEntryInput[],
  milkPricePerLiter: number,
): CowEvaluationSummary {
  const entryResults = entries.map((entry) => calculateCowEntry(entry, milkPricePerLiter));
  const baseline = summarizePhase(entryResults.filter((entry) => entry.phase === "baseline"));
  const test = summarizePhase(entryResults.filter((entry) => entry.phase === "test"));
  const total = summarizePhase(entryResults);
  const extraDailyLiters = test.averageDailyLiters - baseline.averageDailyLiters;
  const additionalDailyCost = test.averageDailyNutritionCost - baseline.averageDailyNutritionCost;
  const extraRevenue = extraDailyLiters * milkPricePerLiter;
  const additionalDailyProfit = test.averageDailyNetProfit - baseline.averageDailyNetProfit;

  return {
    baseline,
    comparison: {
      additionalDailyCost,
      additionalDailyProfit,
      extraDailyLiters,
      extraMonthlyLiters: extraDailyLiters * 30,
      extraRevenue,
      profitCompensated: additionalDailyProfit >= 0,
    },
    entries: entryResults,
    test,
    total,
  };
}

function summarizePhase(entries: CowEntryResult[]): CowPhaseSummary {
  if (entries.length === 0) {
    return { ...emptyPhaseSummary };
  }

  const total = entries.reduce(
    (summary, entry) => ({
      feedCost: summary.feedCost + entry.feedCost,
      freeProfitAfterNutrition: summary.freeProfitAfterNutrition + entry.freeProfitAfterNutrition,
      liters: summary.liters + entry.liters,
      netProfit: summary.netProfit + entry.netProfit,
      nutritionCost: summary.nutritionCost + entry.nutritionCost,
      otherCosts: summary.otherCosts + entry.otherCostsValue,
      revenue: summary.revenue + entry.revenue,
      silageCost: summary.silageCost + entry.silageCost,
      totalCost: summary.totalCost + entry.totalCost,
    }),
    {
      feedCost: 0,
      freeProfitAfterNutrition: 0,
      liters: 0,
      netProfit: 0,
      nutritionCost: 0,
      otherCosts: 0,
      revenue: 0,
      silageCost: 0,
      totalCost: 0,
    },
  );
  const dayCount = entries.length;

  return {
    ...total,
    averageDailyLiters: total.liters / dayCount,
    averageDailyNetProfit: total.netProfit / dayCount,
    averageDailyNutritionCost: total.nutritionCost / dayCount,
    dayCount,
    projectedMonthlyLiters: (total.liters / dayCount) * 30,
    projectedMonthlyNetProfit: (total.netProfit / dayCount) * 30,
  };
}
