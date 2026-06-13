import { feedBrands } from "@/db/schema";
import { safeDivide } from "@/lib/calculations/financial";
import type { feedBrandSchema } from "@/lib/validations/feed-brand";
import type { AppDatabase } from "./types";
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
