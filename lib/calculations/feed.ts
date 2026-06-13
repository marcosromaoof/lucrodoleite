import { safeDivide } from "./financial";

export type FeedVariantInput = {
  label: string;
  baselineDailyLiters: number;
  testDailyLiters: number;
  days: number;
  milkPricePerLiter: number;
  feedCostTotal: number;
};

export type FeedVariantResult = {
  label: string;
  extraDailyLiters: number;
  extraTotalLiters: number;
  extraRevenue: number;
  additionalProfit: number;
  breakEvenLiters: number;
  breakEvenLitersPerDay: number;
  compensated: "yes" | "no" | "break_even";
  conclusion: string;
};

export type FeedComparisonResult = {
  bestFinancialResult: FeedVariantResult | null;
  bestProductionResult: FeedVariantResult | null;
  variants: FeedVariantResult[];
};

export function calculateFeedVariant(input: FeedVariantInput): FeedVariantResult {
  const extraDailyLiters = input.testDailyLiters - input.baselineDailyLiters;
  const extraTotalLiters = extraDailyLiters * input.days;
  const extraRevenue = extraTotalLiters * input.milkPricePerLiter;
  const additionalProfit = extraRevenue - input.feedCostTotal;
  const breakEvenLiters = safeDivide(input.feedCostTotal, input.milkPricePerLiter);
  const breakEvenLitersPerDay = safeDivide(breakEvenLiters, input.days);
  const compensated =
    additionalProfit > 0 ? "yes" : additionalProfit < 0 ? "no" : "break_even";

  return {
    label: input.label,
    extraDailyLiters,
    extraTotalLiters,
    extraRevenue,
    additionalProfit,
    breakEvenLiters,
    breakEvenLitersPerDay,
    compensated,
    conclusion: buildFeedConclusion(input.label, extraDailyLiters, additionalProfit, compensated),
  };
}

export function compareFeedVariants(inputs: FeedVariantInput[]): FeedComparisonResult {
  const variants = inputs.map(calculateFeedVariant);
  const bestFinancialResult = maxBy(variants, (variant) => variant.additionalProfit);
  const bestProductionResult = maxBy(variants, (variant) => variant.extraTotalLiters);

  return {
    bestFinancialResult,
    bestProductionResult,
    variants,
  };
}

function buildFeedConclusion(
  label: string,
  extraDailyLiters: number,
  additionalProfit: number,
  compensated: FeedVariantResult["compensated"],
) {
  if (compensated === "yes") {
    return `${label} compensou financeiramente e gerou lucro adicional.`;
  }

  if (compensated === "break_even") {
    return `${label} apenas se pagou no periodo avaliado.`;
  }

  if (extraDailyLiters > 0) {
    return `${label} aumentou a producao, mas nao compensou financeiramente.`;
  }

  if (additionalProfit < 0) {
    return `${label} nao aumentou a producao e reduziu o resultado financeiro.`;
  }

  return `${label} ainda nao tem dados suficientes para conclusao confiavel.`;
}

function maxBy<T>(items: T[], selector: (item: T) => number) {
  if (items.length === 0) {
    return null;
  }

  return items.reduce((best, current) => (selector(current) > selector(best) ? current : best));
}
