export type MonthlyClosingInput = {
  totalLiters: number;
  milkInvoiceAmount: number;
  totalFeedAmount: number;
  totalSilageAmount?: number;
  totalMineralAmount?: number;
  totalExpenses: number;
};

export type MonthlyClosingResult = {
  realPricePerLiter: number;
  grossResultPerLiter: number;
  feedCostPerLiter: number;
  resultAfterFeedPerLiter: number;
  totalNutritionAmount: number;
  nutritionCostPerLiter: number;
  resultAfterNutritionPerLiter: number;
  freeProfitAfterNutrition: number;
  totalCostPerLiter: number;
  netResultPerLiter: number;
  netProfit: number;
};

export type MonthlyEstimateInput = {
  totalLiters: number;
  estimatedPricePerLiter: number;
  totalNutritionAmount?: number;
  totalExpenses: number;
};

export type MonthlyEstimateResult = {
  estimatedRevenue: number;
  estimatedFreeProfitAfterNutrition: number;
  estimatedFreeResultAfterNutritionPerLiter: number;
  estimatedProfit: number;
  estimatedResultPerLiter: number;
};

export function safeDivide(value: number, divisor: number, fallback = 0) {
  if (!Number.isFinite(value) || !Number.isFinite(divisor) || divisor === 0) {
    return fallback;
  }

  return value / divisor;
}

export function calculateMonthlyClosing(input: MonthlyClosingInput): MonthlyClosingResult {
  const { totalLiters, milkInvoiceAmount, totalFeedAmount, totalExpenses } = input;
  const totalSilageAmount = input.totalSilageAmount ?? 0;
  const totalMineralAmount = input.totalMineralAmount ?? 0;
  const totalNutritionAmount = totalFeedAmount + totalSilageAmount + totalMineralAmount;
  const freeProfitAfterNutrition = milkInvoiceAmount - totalNutritionAmount;
  const netProfit = milkInvoiceAmount - totalExpenses;

  return {
    realPricePerLiter: safeDivide(milkInvoiceAmount, totalLiters),
    grossResultPerLiter: safeDivide(milkInvoiceAmount, totalLiters),
    feedCostPerLiter: safeDivide(totalFeedAmount, totalLiters),
    resultAfterFeedPerLiter: safeDivide(milkInvoiceAmount - totalFeedAmount, totalLiters),
    totalNutritionAmount,
    nutritionCostPerLiter: safeDivide(totalNutritionAmount, totalLiters),
    resultAfterNutritionPerLiter: safeDivide(freeProfitAfterNutrition, totalLiters),
    freeProfitAfterNutrition,
    totalCostPerLiter: safeDivide(totalExpenses, totalLiters),
    netResultPerLiter: safeDivide(netProfit, totalLiters),
    netProfit,
  };
}

export function calculateMonthlyEstimate(input: MonthlyEstimateInput): MonthlyEstimateResult {
  const estimatedRevenue = input.totalLiters * input.estimatedPricePerLiter;
  const estimatedFreeProfitAfterNutrition = estimatedRevenue - (input.totalNutritionAmount ?? 0);
  const estimatedProfit = estimatedRevenue - input.totalExpenses;

  return {
    estimatedRevenue,
    estimatedFreeProfitAfterNutrition,
    estimatedFreeResultAfterNutritionPerLiter: safeDivide(estimatedFreeProfitAfterNutrition, input.totalLiters),
    estimatedProfit,
    estimatedResultPerLiter: safeDivide(estimatedProfit, input.totalLiters),
  };
}
