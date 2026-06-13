import { feedBrands } from "@/db/schema";
import { safeDivide } from "@/lib/calculations/financial";
import type { feedBrandSchema } from "@/lib/validations/feed-brand";
import type { AppDatabase } from "./types";
import { desc, eq } from "drizzle-orm";
import type { z } from "zod";

export type CreateFeedBrandInput = z.infer<typeof feedBrandSchema> & {
  farmId: string;
};

export async function createFeedBrand(db: AppDatabase, input: CreateFeedBrandInput) {
  const pricePerKg =
    input.pricePerBag !== undefined && input.bagWeightKg !== undefined
      ? safeDivide(input.pricePerBag, input.bagWeightKg)
      : undefined;

  const [created] = await db
    .insert(feedBrands)
    .values({
      farmId: input.farmId,
      name: input.name,
      manufacturer: input.manufacturer,
      proteinPercent: input.proteinPercent?.toString(),
      bagWeightKg: input.bagWeightKg?.toString(),
      pricePerBag: input.pricePerBag?.toString(),
      pricePerKg: pricePerKg?.toString(),
      notes: input.notes,
    })
    .returning({ id: feedBrands.id });

  return created;
}

export type FeedBrandRecord = {
  bagWeightKg: number | null;
  id: string;
  manufacturer: string | null;
  name: string;
  notes: string | null;
  pricePerBag: number | null;
  pricePerKg: number | null;
  proteinPercent: number | null;
};

export async function listFeedBrands(db: AppDatabase, farmId: string): Promise<FeedBrandRecord[]> {
  const rows = await db
    .select({
      bagWeightKg: feedBrands.bagWeightKg,
      id: feedBrands.id,
      manufacturer: feedBrands.manufacturer,
      name: feedBrands.name,
      notes: feedBrands.notes,
      pricePerBag: feedBrands.pricePerBag,
      pricePerKg: feedBrands.pricePerKg,
      proteinPercent: feedBrands.proteinPercent,
    })
    .from(feedBrands)
    .where(eq(feedBrands.farmId, farmId))
    .orderBy(desc(feedBrands.createdAt));

  return rows.map((row) => ({
    ...row,
    bagWeightKg: row.bagWeightKg === null || row.bagWeightKg === undefined ? null : Number(row.bagWeightKg),
    pricePerBag: row.pricePerBag === null || row.pricePerBag === undefined ? null : Number(row.pricePerBag),
    pricePerKg: row.pricePerKg === null || row.pricePerKg === undefined ? null : Number(row.pricePerKg),
    proteinPercent:
      row.proteinPercent === null || row.proteinPercent === undefined ? null : Number(row.proteinPercent),
  }));
}
