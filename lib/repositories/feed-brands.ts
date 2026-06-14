import { expenses, feedBrands, feedTestVariants } from "@/db/schema";
import { safeDivide } from "@/lib/calculations/financial";
import type { feedBrandSchema } from "@/lib/validations/feed-brand";
import type { AppDatabase } from "./types";
import { and, desc, eq } from "drizzle-orm";
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

function buildFeedBrandValues(input: z.infer<typeof feedBrandSchema>) {
  const pricePerKg =
    input.pricePerBag !== undefined && input.bagWeightKg !== undefined
      ? safeDivide(input.pricePerBag, input.bagWeightKg)
      : undefined;

  return {
    bagWeightKg: input.bagWeightKg?.toString(),
    manufacturer: input.manufacturer,
    name: input.name,
    notes: input.notes,
    pricePerBag: input.pricePerBag?.toString(),
    pricePerKg: pricePerKg?.toString(),
    proteinPercent: input.proteinPercent?.toString(),
  };
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

const feedBrandSelect = {
  bagWeightKg: feedBrands.bagWeightKg,
  id: feedBrands.id,
  manufacturer: feedBrands.manufacturer,
  name: feedBrands.name,
  notes: feedBrands.notes,
  pricePerBag: feedBrands.pricePerBag,
  pricePerKg: feedBrands.pricePerKg,
  proteinPercent: feedBrands.proteinPercent,
};

export async function listFeedBrands(db: AppDatabase, farmId: string): Promise<FeedBrandRecord[]> {
  const rows = await db
    .select(feedBrandSelect)
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

export async function getFeedBrandById(
  db: AppDatabase,
  farmId: string,
  feedBrandId: string,
): Promise<FeedBrandRecord | null> {
  const [row] = await db
    .select(feedBrandSelect)
    .from(feedBrands)
    .where(and(eq(feedBrands.farmId, farmId), eq(feedBrands.id, feedBrandId)))
    .limit(1);

  return row ? mapFeedBrand(row) : null;
}

export async function updateFeedBrand(
  db: AppDatabase,
  farmId: string,
  feedBrandId: string,
  input: z.infer<typeof feedBrandSchema>,
) {
  const [updated] = await db
    .update(feedBrands)
    .set({
      ...buildFeedBrandValues(input),
      updatedAt: new Date(),
    })
    .where(and(eq(feedBrands.farmId, farmId), eq(feedBrands.id, feedBrandId)))
    .returning({ id: feedBrands.id });

  return updated;
}

export async function deleteFeedBrand(
  db: AppDatabase,
  farmId: string,
  feedBrandId: string,
): Promise<{ deleted: boolean; reason?: string }> {
  const [expenseLink, testLink] = await Promise.all([
    db
      .select({ id: expenses.id })
      .from(expenses)
      .where(and(eq(expenses.farmId, farmId), eq(expenses.feedBrandId, feedBrandId)))
      .limit(1),
    db
      .select({ id: feedTestVariants.id })
      .from(feedTestVariants)
      .innerJoin(feedBrands, eq(feedTestVariants.feedBrandId, feedBrands.id))
      .where(and(eq(feedBrands.farmId, farmId), eq(feedTestVariants.feedBrandId, feedBrandId)))
      .limit(1),
  ]);

  if (expenseLink.length > 0 || testLink.length > 0) {
    return {
      deleted: false,
      reason: "Esta marca esta vinculada a despesas ou testes de racao.",
    };
  }

  const [deleted] = await db
    .delete(feedBrands)
    .where(and(eq(feedBrands.farmId, farmId), eq(feedBrands.id, feedBrandId)))
    .returning({ id: feedBrands.id });

  return { deleted: Boolean(deleted) };
}

type FeedBrandRow = {
  bagWeightKg: string | null;
  id: string;
  manufacturer: string | null;
  name: string;
  notes: string | null;
  pricePerBag: string | null;
  pricePerKg: string | null;
  proteinPercent: string | null;
};

function mapFeedBrand(row: FeedBrandRow): FeedBrandRecord {
  return {
    ...row,
    bagWeightKg: row.bagWeightKg === null || row.bagWeightKg === undefined ? null : Number(row.bagWeightKg),
    pricePerBag: row.pricePerBag === null || row.pricePerBag === undefined ? null : Number(row.pricePerBag),
    pricePerKg: row.pricePerKg === null || row.pricePerKg === undefined ? null : Number(row.pricePerKg),
    proteinPercent:
      row.proteinPercent === null || row.proteinPercent === undefined ? null : Number(row.proteinPercent),
  };
}
