import { monthlyClosings } from "@/db/schema";
import type { MonthlyClosingResult } from "@/lib/calculations/financial";
import type { AppDatabase } from "./types";
import { and, desc, eq } from "drizzle-orm";

export type SaveMonthlyClosingInput = MonthlyClosingResult & {
  closedBy?: string;
  farmId: string;
  milkInvoiceAmount: number;
  referenceMonth: string;
  totalExpenses: number;
  totalFeedAmount: number;
  totalLiters: number;
};

export type MonthlyClosingRecord = SaveMonthlyClosingInput & {
  closedAt: Date | null;
  id: string;
  month: number;
  year: number;
};

const monthlyClosingSelect = {
  closedAt: monthlyClosings.closedAt,
  farmId: monthlyClosings.farmId,
  feedCostPerLiter: monthlyClosings.feedCostPerLiter,
  grossResultPerLiter: monthlyClosings.grossResultPerLiter,
  id: monthlyClosings.id,
  milkInvoiceAmount: monthlyClosings.milkInvoiceAmount,
  month: monthlyClosings.month,
  netProfit: monthlyClosings.netProfit,
  netResultPerLiter: monthlyClosings.netResultPerLiter,
  realPricePerLiter: monthlyClosings.realPricePerLiter,
  referenceMonth: monthlyClosings.referenceMonth,
  resultAfterFeedPerLiter: monthlyClosings.resultAfterFeedPerLiter,
  totalCostPerLiter: monthlyClosings.totalCostPerLiter,
  totalExpenses: monthlyClosings.totalExpenses,
  totalFeedAmount: monthlyClosings.totalFeedAmount,
  totalLiters: monthlyClosings.totalLiters,
  year: monthlyClosings.year,
};

type MonthlyClosingRow = {
  closedAt: Date | null;
  farmId: string;
  feedCostPerLiter: string;
  grossResultPerLiter: string;
  id: string;
  milkInvoiceAmount: string;
  month: number;
  netProfit: string;
  netResultPerLiter: string;
  realPricePerLiter: string;
  referenceMonth: string;
  resultAfterFeedPerLiter: string;
  totalCostPerLiter: string;
  totalExpenses: string;
  totalFeedAmount: string;
  totalLiters: string;
  year: number;
};

export async function upsertMonthlyClosing(db: AppDatabase, input: SaveMonthlyClosingInput) {
  const [year, month] = input.referenceMonth.split("-").map(Number);
  const now = new Date();
  const values = {
    farmId: input.farmId,
    feedCostPerLiter: input.feedCostPerLiter.toString(),
    grossResultPerLiter: input.grossResultPerLiter.toString(),
    milkInvoiceAmount: input.milkInvoiceAmount.toString(),
    month,
    netProfit: input.netProfit.toString(),
    netResultPerLiter: input.netResultPerLiter.toString(),
    realPricePerLiter: input.realPricePerLiter.toString(),
    referenceMonth: input.referenceMonth,
    resultAfterFeedPerLiter: input.resultAfterFeedPerLiter.toString(),
    totalCostPerLiter: input.totalCostPerLiter.toString(),
    totalExpenses: input.totalExpenses.toString(),
    totalFeedAmount: input.totalFeedAmount.toString(),
    totalLiters: input.totalLiters.toString(),
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

export async function listMonthlyClosings(db: AppDatabase, farmId: string, limit = 12) {
  const rows = await db
    .select(monthlyClosingSelect)
    .from(monthlyClosings)
    .where(eq(monthlyClosings.farmId, farmId))
    .orderBy(desc(monthlyClosings.referenceMonth))
    .limit(limit);

  return rows.map(mapMonthlyClosing);
}

function mapMonthlyClosing(row: MonthlyClosingRow): MonthlyClosingRecord {
  return {
    closedAt: row.closedAt,
    farmId: row.farmId,
    feedCostPerLiter: Number(row.feedCostPerLiter),
    grossResultPerLiter: Number(row.grossResultPerLiter),
    id: row.id,
    milkInvoiceAmount: Number(row.milkInvoiceAmount),
    month: row.month,
    netProfit: Number(row.netProfit),
    netResultPerLiter: Number(row.netResultPerLiter),
    realPricePerLiter: Number(row.realPricePerLiter),
    referenceMonth: row.referenceMonth,
    resultAfterFeedPerLiter: Number(row.resultAfterFeedPerLiter),
    totalCostPerLiter: Number(row.totalCostPerLiter),
    totalExpenses: Number(row.totalExpenses),
    totalFeedAmount: Number(row.totalFeedAmount),
    totalLiters: Number(row.totalLiters),
    year: row.year,
  };
}
