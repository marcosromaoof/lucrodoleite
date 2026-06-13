import { dailyProductions } from "@/db/schema";
import type { productionSchema } from "@/lib/validations/production";
import type { AppDatabase } from "./types";
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
    .returning({ id: dailyProductions.id });

  return created;
}
