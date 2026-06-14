import { monthlyClosings } from "@/db/schema";
import type { MonthlyClosingResult } from "@/lib/calculations/financial";
import type { AppDatabase } from "./types";
import { and, desc, eq, gte, lte, ne } from "drizzle-orm";

export type SaveMonthlyClosingInput = MonthlyClosingResult & {
  closedBy?: string;
  farmId: string;
  milkInvoiceAmount: number;
  periodEnd: string;
  periodStart: string;
  referenceMonth: string;
  totalExpenses: number;
  totalFeedAmount: number;
  totalLiters: number;
  totalMineralAmount: number;
  totalSilageAmount: number;
};

export type MonthlyClosingRecord = SaveMonthlyClosingInput & {
  closedAt: Date | null;
  id: string;
  month: number;
  periodEnd: string;
  periodStart: string;
  year: number;
};

const monthlyClosingSelect = {
  closedAt: monthlyClosings.closedAt,
  farmId: monthlyClosings.farmId,
  feedCostPerLiter: monthlyClosings.feedCostPerLiter,
  freeProfitAfterNutrition: monthlyClosings.freeProfitAfterNutrition,
  grossResultPerLiter: monthlyClosings.grossResultPerLiter,
  id: monthlyClosings.id,
  milkInvoiceAmount: monthlyClosings.milkInvoiceAmount,
  month: monthlyClosings.month,
  netProfit: monthlyClosings.netProfit,
  netResultPerLiter: monthlyClosings.netResultPerLiter,
  periodEnd: monthlyClosings.periodEnd,
  periodStart: monthlyClosings.periodStart,
  realPricePerLiter: monthlyClosings.realPricePerLiter,
  referenceMonth: monthlyClosings.referenceMonth,
  resultAfterFeedPerLiter: monthlyClosings.resultAfterFeedPerLiter,
  resultAfterNutritionPerLiter: monthlyClosings.resultAfterNutritionPerLiter,
  nutritionCostPerLiter: monthlyClosings.nutritionCostPerLiter,
  totalCostPerLiter: monthlyClosings.totalCostPerLiter,
  totalExpenses: monthlyClosings.totalExpenses,
  totalFeedAmount: monthlyClosings.totalFeedAmount,
  totalLiters: monthlyClosings.totalLiters,
  totalMineralAmount: monthlyClosings.totalMineralAmount,
  totalNutritionAmount: monthlyClosings.totalNutritionAmount,
  totalSilageAmount: monthlyClosings.totalSilageAmount,
  year: monthlyClosings.year,
};

type MonthlyClosingRow = {
  closedAt: Date | null;
  farmId: string;
  feedCostPerLiter: string;
  freeProfitAfterNutrition: string;
  grossResultPerLiter: string;
  id: string;
  milkInvoiceAmount: string;
  month: number;
  netProfit: string;
  netResultPerLiter: string;
  periodEnd: string;
  periodStart: string;
  realPricePerLiter: string;
  referenceMonth: string;
  resultAfterFeedPerLiter: string;
  resultAfterNutritionPerLiter: string;
  nutritionCostPerLiter: string;
  totalCostPerLiter: string;
  totalExpenses: string;
  totalFeedAmount: string;
  totalLiters: string;
  totalMineralAmount: string;
  totalNutritionAmount: string;
  totalSilageAmount: string;
  year: number;
};

export async function upsertMonthlyClosing(db: AppDatabase, input: SaveMonthlyClosingInput) {
  const [year, month] = input.referenceMonth.split("-").map(Number);
  const now = new Date();
  const values = {
    farmId: input.farmId,
    feedCostPerLiter: input.feedCostPerLiter.toString(),
    freeProfitAfterNutrition: input.freeProfitAfterNutrition.toString(),
    grossResultPerLiter: input.grossResultPerLiter.toString(),
    milkInvoiceAmount: input.milkInvoiceAmount.toString(),
    month,
    netProfit: input.netProfit.toString(),
    netResultPerLiter: input.netResultPerLiter.toString(),
    periodEnd: input.periodEnd,
    periodStart: input.periodStart,
    realPricePerLiter: input.realPricePerLiter.toString(),
    referenceMonth: input.referenceMonth,
    resultAfterFeedPerLiter: input.resultAfterFeedPerLiter.toString(),
    resultAfterNutritionPerLiter: input.resultAfterNutritionPerLiter.toString(),
    nutritionCostPerLiter: input.nutritionCostPerLiter.toString(),
    totalCostPerLiter: input.totalCostPerLiter.toString(),
    totalExpenses: input.totalExpenses.toString(),
    totalFeedAmount: input.totalFeedAmount.toString(),
    totalLiters: input.totalLiters.toString(),
    totalMineralAmount: input.totalMineralAmount.toString(),
    totalNutritionAmount: input.totalNutritionAmount.toString(),
    totalSilageAmount: input.totalSilageAmount.toString(),
    year,
  };

  const [created] = await db
    .insert(monthlyClosings)
    .values({
      ...values,
      closedAt: now,
      closedBy: input.closedBy,
    })
    .onConflictDoUpdate({
      target: [monthlyClosings.farmId, monthlyClosings.referenceMonth],
      set: {
        ...values,
        closedAt: now,
        closedBy: input.closedBy,
        updatedAt: now,
      },
    })
    .returning({ id: monthlyClosings.id });

  return created;
}

export async function getMonthlyClosing(db: AppDatabase, farmId: string, referenceMonth: string) {
  const [row] = await db
    .select(monthlyClosingSelect)
    .from(monthlyClosings)
    .where(and(eq(monthlyClosings.farmId, farmId), eq(monthlyClosings.referenceMonth, referenceMonth)))
    .limit(1);

  return row ? mapMonthlyClosing(row) : null;
}

export async function getMonthlyClosingById(db: AppDatabase, farmId: string, closingId: string) {
  const [row] = await db
    .select(monthlyClosingSelect)
    .from(monthlyClosings)
    .where(and(eq(monthlyClosings.farmId, farmId), eq(monthlyClosings.id, closingId)))
    .limit(1);

  return row ? mapMonthlyClosing(row) : null;
}

export async function findMonthlyClosingsContainingDate(db: AppDatabase, farmId: string, date: string) {
  const rows = await db
    .select(monthlyClosingSelect)
    .from(monthlyClosings)
    .where(and(eq(monthlyClosings.farmId, farmId), lte(monthlyClosings.periodStart, date), gte(monthlyClosings.periodEnd, date)));

  return rows.map(mapMonthlyClosing);
}

export async function hasOverlappingMonthlyClosing(
  db: AppDatabase,
  farmId: string,
  periodStart: string,
  periodEnd: string,
  exceptClosingId?: string,
) {
  const conditions = [
    eq(monthlyClosings.farmId, farmId),
    lte(monthlyClosings.periodStart, periodEnd),
    gte(monthlyClosings.periodEnd, periodStart),
  ];

  if (exceptClosingId) {
    conditions.push(ne(monthlyClosings.id, exceptClosingId));
  }

  const [row] = await db
    .select({ id: monthlyClosings.id })
    .from(monthlyClosings)
    .where(and(...conditions))
    .limit(1);

  return Boolean(row);
}

export async function listMonthlyClosings(db: AppDatabase, farmId: string, limit = 12) {
  const rows = await db
    .select(monthlyClosingSelect)
    .from(monthlyClosings)
    .where(eq(monthlyClosings.farmId, farmId))
    .orderBy(desc(monthlyClosings.referenceMonth))
    .limit(limit);

  return rows.map(mapMonthlyClosing);
}

export async function deleteMonthlyClosing(db: AppDatabase, farmId: string, closingId: string) {
  const [deleted] = await db
    .delete(monthlyClosings)
    .where(and(eq(monthlyClosings.farmId, farmId), eq(monthlyClosings.id, closingId)))
    .returning({ id: monthlyClosings.id });

  return deleted;
}

function mapMonthlyClosing(row: MonthlyClosingRow): MonthlyClosingRecord {
  return {
    closedAt: row.closedAt,
    farmId: row.farmId,
    feedCostPerLiter: Number(row.feedCostPerLiter),
    freeProfitAfterNutrition: Number(row.freeProfitAfterNutrition),
    grossResultPerLiter: Number(row.grossResultPerLiter),
    id: row.id,
    milkInvoiceAmount: Number(row.milkInvoiceAmount),
    month: row.month,
    netProfit: Number(row.netProfit),
    netResultPerLiter: Number(row.netResultPerLiter),
    periodEnd: row.periodEnd,
    periodStart: row.periodStart,
    realPricePerLiter: Number(row.realPricePerLiter),
    referenceMonth: row.referenceMonth,
    resultAfterFeedPerLiter: Number(row.resultAfterFeedPerLiter),
    resultAfterNutritionPerLiter: Number(row.resultAfterNutritionPerLiter),
    nutritionCostPerLiter: Number(row.nutritionCostPerLiter),
    totalCostPerLiter: Number(row.totalCostPerLiter),
    totalExpenses: Number(row.totalExpenses),
    totalFeedAmount: Number(row.totalFeedAmount),
    totalLiters: Number(row.totalLiters),
    totalMineralAmount: Number(row.totalMineralAmount),
    totalNutritionAmount: Number(row.totalNutritionAmount),
    totalSilageAmount: Number(row.totalSilageAmount),
    year: row.year,
  };
}
