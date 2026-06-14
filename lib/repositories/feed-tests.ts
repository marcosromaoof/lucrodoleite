import { dailyProductions, expenses, feedBrands, feedTests, feedTestVariants } from "@/db/schema";
import type { FeedVariantResult } from "@/lib/calculations/feed";
import { safeDivide } from "@/lib/calculations/financial";
import type { feedTestSchema } from "@/lib/validations/feed-test";
import type { AppDatabase } from "./types";
import { and, desc, eq } from "drizzle-orm";
import type { z } from "zod";

export type CreateFeedTestInput = z.infer<typeof feedTestSchema> & {
  createdBy?: string;
  days: number;
  farmId: string;
  result: FeedVariantResult;
};

export type UpdateFeedTestInput = CreateFeedTestInput & {
  id: string;
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
  feedBrandId: string | null;
  feedCostTotal: number | null;
  id: string;
  label: string;
  milkPricePerLiter: number | null;
  resultPerLiter: number | null;
  startDate: string;
  testName: string;
  testNotes: string | null;
  variantId: string;
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

  return { id: test.id, variantId: variant.id };
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
      feedBrandId: feedTestVariants.feedBrandId,
      feedBrandName: feedBrands.name,
      feedCostTotal: feedTestVariants.feedCostTotal,
      id: feedTests.id,
      label: feedTestVariants.label,
      milkPricePerLiter: feedTests.milkPricePerLiter,
      notes: feedTests.notes,
      resultPerLiter: feedTestVariants.resultPerLiter,
      startDate: feedTestVariants.periodStart,
      testName: feedTests.name,
      variantId: feedTestVariants.id,
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
      feedBrandId: row.feedBrandId,
      feedBrandName: row.feedBrandName,
      feedCostTotal: toNullableNumber(row.feedCostTotal),
      id: row.id,
      label: row.label,
      milkPricePerLiter: toNullableNumber(row.milkPricePerLiter),
      resultPerLiter: toNullableNumber(row.resultPerLiter),
      startDate: row.startDate,
      testName: row.testName,
      testNotes: row.notes,
      variantId: row.variantId,
    };
  });
}

export async function getFeedTestResultById(
  db: AppDatabase,
  farmId: string,
  feedTestId: string,
): Promise<FeedTestResultRecord | null> {
  const rows = await listFeedTestResults(db, farmId, 100);

  return rows.find((row) => row.id === feedTestId) ?? null;
}

export async function updateFeedTestResult(db: AppDatabase, input: UpdateFeedTestInput) {
  const [test] = await db
    .select({ id: feedTests.id })
    .from(feedTests)
    .where(and(eq(feedTests.farmId, input.farmId), eq(feedTests.id, input.id)))
    .limit(1);

  if (!test) {
    return undefined;
  }

  const totalFeedKg = input.dailyFeedKg === undefined ? undefined : input.dailyFeedKg * input.days;
  const resultPerLiter = safeDivide(input.result.additionalProfit, input.result.extraTotalLiters);

  await db
    .update(feedTests)
    .set({
      endDate: input.periodEnd,
      milkPricePerLiter: input.milkPricePerLiter.toString(),
      name: input.name,
      notes: input.notes,
      startDate: input.periodStart,
      updatedAt: new Date(),
    })
    .where(and(eq(feedTests.farmId, input.farmId), eq(feedTests.id, test.id)));

  const [variant] = await db
    .update(feedTestVariants)
    .set({
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
      label: input.label,
      periodEnd: input.periodEnd,
      periodStart: input.periodStart,
      resultPerLiter: resultPerLiter.toString(),
      totalFeedKg: totalFeedKg?.toString(),
      updatedAt: new Date(),
    })
    .where(eq(feedTestVariants.feedTestId, test.id))
    .returning({ id: feedTestVariants.id });

  return variant ? { id: test.id, variantId: variant.id } : undefined;
}

export async function deleteFeedTest(
  db: AppDatabase,
  farmId: string,
  feedTestId: string,
): Promise<{ deleted: boolean; reason?: string }> {
  const [productionLink, expenseLink] = await Promise.all([
    db
      .select({ id: dailyProductions.id })
      .from(dailyProductions)
      .where(and(eq(dailyProductions.farmId, farmId), eq(dailyProductions.feedTestId, feedTestId)))
      .limit(1),
    db
      .select({ id: expenses.id })
      .from(expenses)
      .where(and(eq(expenses.farmId, farmId), eq(expenses.feedTestId, feedTestId)))
      .limit(1),
  ]);

  if (productionLink.length > 0 || expenseLink.length > 0) {
    return {
      deleted: false,
      reason: "Este teste esta vinculado a producao ou despesas.",
    };
  }

  const [deleted] = await db
    .delete(feedTests)
    .where(and(eq(feedTests.farmId, farmId), eq(feedTests.id, feedTestId)))
    .returning({ id: feedTests.id });

  return { deleted: Boolean(deleted) };
}

function toNullableNumber(value: string | null | undefined) {
  return value === null || value === undefined ? null : Number(value);
}
