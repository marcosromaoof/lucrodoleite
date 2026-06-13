import { farms } from "@/db/schema";
import type { farmSchema } from "@/lib/validations/farm";
import type { AppDatabase } from "./types";
import { asc } from "drizzle-orm";
import type { z } from "zod";

export type CreateFarmInput = z.infer<typeof farmSchema>;
export type FarmOption = {
  city: string | null;
  defaultPricePerLiter: number | null;
  id: string;
  milkCompany: string | null;
  name: string;
  ownerName: string | null;
  state: string | null;
};

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

export async function listFarms(db: AppDatabase): Promise<FarmOption[]> {
  const rows = await db
    .select({
      city: farms.city,
      defaultPricePerLiter: farms.defaultPricePerLiter,
      id: farms.id,
      milkCompany: farms.milkCompany,
      name: farms.name,
      ownerName: farms.ownerName,
      state: farms.state,
    })
    .from(farms)
    .orderBy(asc(farms.createdAt));

  return rows.map((farm) => ({
    ...farm,
    defaultPricePerLiter:
      farm.defaultPricePerLiter === null || farm.defaultPricePerLiter === undefined
        ? null
        : Number(farm.defaultPricePerLiter),
  }));
}
