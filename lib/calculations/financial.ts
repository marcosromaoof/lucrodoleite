export type MonthlyClosingInput = {
  totalLiters: number;
  milkInvoiceAmount: number;
  totalFeedAmount: number;
  totalExpenses: number;
};

export type MonthlyClosingResult = {
  realPricePerLiter: number;
  grossResultPerLiter: number;
  feedCostPerLiter: number;
  resultAfterFeedPerLiter: number;
  totalCostPerLiter: number;
  netResultPerLiter: number;
  netProfit: number;
};

export type MonthlyEstimateInput = {
  totalLiters: number;
  estimatedPricePerLiter: number;
  totalExpenses: number;
};

export type MonthlyEstimateResult = {
  estimatedRevenue: number;
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
  const netProfit = milkInvoiceAmount - totalExpenses;

  return {
    realPricePerLiter: safeDivide(milkInvoiceAmount, totalLiters),
    grossResultPerLiter: safeDivide(milkInvoiceAmount, totalLiters),
    feedCostPerLiter: safeDivide(totalFeedAmount, totalLiters),
    resultAfterFeedPerLiter: safeDivide(milkInvoiceAmount - totalFeedAmount, totalLiters),
    totalCostPerLiter: safeDivide(totalExpenses, totalLiters),
    netResultPerLiter: safeDivide(netProfit, totalLiters),
    netProfit,
  };
}

export function calculateMonthlyEstimate(input: MonthlyEstimateInput): MonthlyEstimateResult {
  const estimatedRevenue = input.totalLiters * input.estimatedPricePerLiter;
  const estimatedProfit = estimatedRevenue - input.totalExpenses;

  return {
    estimatedRevenue,
    estimatedProfit,
    estimatedResultPerLiter: safeDivide(estimatedProfit, input.totalLiters),
  };
}
