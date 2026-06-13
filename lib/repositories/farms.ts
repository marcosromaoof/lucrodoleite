import { farms } from "@/db/schema";
import type { farmSchema } from "@/lib/validations/farm";
import type { AppDatabase } from "./types";
import type { z } from "zod";

export type CreateFarmInput = z.infer<typeof farmSchema>;

export async function createFarm(db: AppDatabase, input: CreateFarmInput) {
  const [created] = await db
    .insert(farms)
    .values({
      name: input.name,
      ownerName: input.ownerName,
      city: input.city,
      state: input.state?.toUpperCase(),
      milkCompany: input.milkCompany,
      defaultPricePerLiter: input.defaultPricePerLiter?.toString(),
    })
    .returning({ id: farms.id });

  return created;
}
