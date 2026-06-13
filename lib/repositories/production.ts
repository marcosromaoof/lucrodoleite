import { dailyProductions } from "@/db/schema";
import type { productionSchema } from "@/lib/validations/production";
import type { AppDatabase } from "./types";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import type { z } from "zod";

export type CreateProductionInput = z.infer<typeof productionSchema> & {
  farmId: string;
  createdBy?: string;
};

export async function createDailyProduction(db: AppDatabase, input: CreateProductionInput) {
  const [created] = await db
    .insert(dailyProductions)
    .values({
      farmId: input.farmId,
      date: input.date,
      liters: input.liters.toString(),
      lactatingCows: input.lactatingCows,
      batchName: input.batchName,
      notes: input.notes,
      createdBy: input.createdBy,
    })
    .onConflictDoUpdate({
      target: [dailyProductions.farmId, dailyProductions.date],
      set: {
        liters: input.liters.toString(),
        lactatingCows: input.lactatingCows,
        batchName: input.batchName,
        notes: input.notes,
        updatedAt: new Date(),
      },
    })
    .returning({ id: dailyProductions.id });

  return created;
}

export type ProductionRecord = {
  batchName: string | null;
  date: string;
  id: string;
  lactatingCows: number | null;
  liters: number;
  notes: string | null;
};

export async function listProductionsByMonth(
  db: AppDatabase,
  farmId: string,
  startDate: string,
  endDate: string,
): Promise<ProductionRecord[]> {
  const rows = await db
    .select({
      batchName: dailyProductions.batchName,
      date: dailyProductions.date,
      id: dailyProductions.id,
      lactatingCows: dailyProductions.lactatingCows,
      liters: dailyProductions.liters,
      notes: dailyProductions.notes,
    })
    .from(dailyProductions)
    .where(
      and(
        eq(dailyProductions.farmId, farmId),
        gte(dailyProductions.date, startDate),
        lte(dailyProductions.date, endDate),
      ),
    )
    .orderBy(desc(dailyProductions.date));

  return rows.map((row) => ({
    ...row,
    liters: Number(row.liters),
  }));
}

export async function getMonthlyProductionSummary(
  db: AppDatabase,
  farmId: string,
  startDate: string,
  endDate: string,
  todayDate: string,
) {
  const [summary] = await db
    .select({
      recordCount: sql<number>`count(*)::int`,
      todayLiters: sql<string>`coalesce(sum(${dailyProductions.liters}) filter (where ${dailyProductions.date} = ${todayDate}), 0)`,
      totalLiters: sql<string>`coalesce(sum(${dailyProductions.liters}), 0)`,
    })
    .from(dailyProductions)
    .where(
      and(
        eq(dailyProductions.farmId, farmId),
        gte(dailyProductions.date, startDate),
        lte(dailyProductions.date, endDate),
      ),
    );

  return {
    recordCount: Number(summary?.recordCount ?? 0),
    todayLiters: Number(summary?.todayLiters ?? 0),
    totalLiters: Number(summary?.totalLiters ?? 0),
  };
}
