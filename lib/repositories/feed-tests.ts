import { feedBrands, feedTests, feedTestVariants } from "@/db/schema";
import type { FeedVariantResult } from "@/lib/calculations/feed";
import { safeDivide } from "@/lib/calculations/financial";
import type { feedTestSchema } from "@/lib/validations/feed-test";
import type { AppDatabase } from "./types";
import { desc, eq } from "drizzle-orm";
import type { z } from "zod";

export type CreateFeedTestInput = z.infer<typeof feedTestSchema> & {
  createdBy?: string;
  days: number;
  farmId: string;
  result: FeedVariantResult;
};

export type FeedTestResultRecord = {
  additionalProfit: number;
  averageDailyLiters: number | null;
  baselineDailyLiters: number | null;
  breakEvenLiters: number | null;
  breakEvenLitersPerDay: number | null;
  compensated: "yes" | "no" | "break_even";
  conclusion: string | null;
  dailyFeedKg: number | null;
  endDate: string;
  extraDailyLiters: number | null;
  extraRevenue: number | null;
  extraTotalLiters: number | null;
  feedBrandName: string | null;
  feedCostTotal: number | null;
  id: string;
  label: string;
  milkPricePerLiter: number | null;
  resultPerLiter: number | null;
  startDate: string;
  testName: string;
};

export async function createFeedTestResult(db: AppDatabase, input: CreateFeedTestInput) {
  const [test] = await db
    .insert(feedTests)
    .values({
      comparisonMode: "manual",
      endDate: input.periodEnd,
      farmId: input.farmId,
      milkPricePerLiter: input.milkPricePerLiter.toString(),
      name: input.name,
      notes: input.notes,
      startDate: input.periodStart,
      status: "completed",
      createdBy: input.createdBy,
    })
    .returning({ id: feedTests.id });

  const totalFeedKg = input.dailyFeedKg === undefined ? undefined : input.dailyFeedKg * input.days;
  const resultPerLiter = safeDivide(input.result.additionalProfit, input.result.extraTotalLiters);

  const [variant] = await db
    .insert(feedTestVariants)
    .values({
      additionalProfit: input.result.additionalProfit.toString(),
      averageDailyLiters: input.testDailyLiters.toString(),
      baselineDailyLiters: input.baselineDailyLiters.toString(),
      breakEvenLiters: input.result.breakEvenLiters.toString(),
      breakEvenLitersPerDay: input.result.breakEvenLitersPerDay.toString(),
      conclusion: input.result.conclusion,
      dailyFeedKg: input.dailyFeedKg?.toString(),
      extraDailyLiters: input.result.extraDailyLiters.toString(),
      extraRevenue: input.result.extraRevenue.toString(),
      extraTotalLiters: input.result.extraTotalLiters.toString(),
      feedBrandId: input.feedBrandId,
      feedCostTotal: input.feedCostTotal.toString(),
      feedTestId: test.id,
      label: input.label,
      periodEnd: input.periodEnd,
      periodStart: input.periodStart,
      resultPerLiter: resultPerLiter.toString(),
      totalFeedKg: totalFeedKg?.toString(),
    })
    .returning({ id: feedTestVariants.id });

  return variant;
}

export async function listFeedTestResults(
  db: AppDatabase,
  farmId: string,
  limit = 20,
): Promise<FeedTestResultRecord[]> {
  const rows = await db
    .select({
      additionalProfit: feedTestVariants.additionalProfit,
      averageDailyLiters: feedTestVariants.averageDailyLiters,
      baselineDailyLiters: feedTestVariants.baselineDailyLiters,
      breakEvenLiters: feedTestVariants.breakEvenLiters,
      breakEvenLitersPerDay: feedTestVariants.breakEvenLitersPerDay,
      conclusion: feedTestVariants.conclusion,
      dailyFeedKg: feedTestVariants.dailyFeedKg,
      endDate: feedTestVariants.periodEnd,
      extraDailyLiters: feedTestVariants.extraDailyLiters,
      extraRevenue: feedTestVariants.extraRevenue,
      extraTotalLiters: feedTestVariants.extraTotalLiters,
      feedBrandName: feedBrands.name,
      feedCostTotal: feedTestVariants.feedCostTotal,
      id: feedTestVariants.id,
      label: feedTestVariants.label,
      milkPricePerLiter: feedTests.milkPricePerLiter,
      resultPerLiter: feedTestVariants.resultPerLiter,
      startDate: feedTestVariants.periodStart,
      testName: feedTests.name,
    })
    .from(feedTestVariants)
    .innerJoin(feedTests, eq(feedTestVariants.feedTestId, feedTests.id))
    .leftJoin(feedBrands, eq(feedTestVariants.feedBrandId, feedBrands.id))
    .where(eq(feedTests.farmId, farmId))
    .orderBy(desc(feedTests.createdAt))
    .limit(limit);

  return rows.map((row) => {
    const additionalProfit = Number(row.additionalProfit ?? 0);

    return {
      additionalProfit,
      averageDailyLiters: toNullableNumber(row.averageDailyLiters),
      baselineDailyLiters: toNullableNumber(row.baselineDailyLiters),
      breakEvenLiters: toNullableNumber(row.breakEvenLiters),
      breakEvenLitersPerDay: toNullableNumber(row.breakEvenLitersPerDay),
      compensated: additionalProfit > 0 ? "yes" : additionalProfit < 0 ? "no" : "break_even",
      conclusion: row.conclusion,
      dailyFeedKg: toNullableNumber(row.dailyFeedKg),
      endDate: row.endDate,
      extraDailyLiters: toNullableNumber(row.extraDailyLiters),
      extraRevenue: toNullableNumber(row.extraRevenue),
      extraTotalLiters: toNullableNumber(row.extraTotalLiters),
      feedBrandName: row.feedBrandName,
      feedCostTotal: toNullableNumber(row.feedCostTotal),
      id: row.id,
      label: row.label,
      milkPricePerLiter: toNullableNumber(row.milkPricePerLiter),
      resultPerLiter: toNullableNumber(row.resultPerLiter),
      startDate: row.startDate,
      testName: row.testName,
    };
  });
}

function toNullableNumber(value: string | null | undefined) {
  return value === null || value === undefined ? null : Number(value);
}
