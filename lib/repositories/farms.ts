import {
  appSettings,
  dailyProductions,
  expenses,
  farmMembers,
  farms,
  feedBrands,
  feedTests,
  monthlyClosings,
  reportExports,
} from "@/db/schema";
import type { farmSchema } from "@/lib/validations/farm";
import type { AppDatabase } from "./types";
import { and, asc, eq } from "drizzle-orm";
import type { z } from "zod";

export type CreateFarmInput = z.infer<typeof farmSchema>;
export type FarmOption = {
  city: string | null;
  closingCycleEndDay: number;
  closingCycleStartDay: number;
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
      closingCycleStartDay: input.closingCycleStartDay,
      closingCycleEndDay: input.closingCycleEndDay,
      defaultPricePerLiter: input.defaultPricePerLiter?.toString(),
    })
    .returning({ id: farms.id });

  return created;
}

export async function createFarmForOwner(db: AppDatabase, input: CreateFarmInput, userId: string) {
  const created = await createFarm(db, input);

  if (!created?.id) {
    return created;
  }

  await db.insert(farmMembers).values({
    farmId: created.id,
    role: "owner",
    userId,
  });

  return created;
}

export async function listFarms(db: AppDatabase): Promise<FarmOption[]> {
  const rows = await db
    .select({
      city: farms.city,
      closingCycleEndDay: farms.closingCycleEndDay,
      closingCycleStartDay: farms.closingCycleStartDay,
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

export async function listFarmsForUser(db: AppDatabase, userId: string): Promise<FarmOption[]> {
  const rows = await db
    .select({
      city: farms.city,
      closingCycleEndDay: farms.closingCycleEndDay,
      closingCycleStartDay: farms.closingCycleStartDay,
      defaultPricePerLiter: farms.defaultPricePerLiter,
      id: farms.id,
      milkCompany: farms.milkCompany,
      name: farms.name,
      ownerName: farms.ownerName,
      state: farms.state,
    })
    .from(farmMembers)
    .innerJoin(farms, eq(farmMembers.farmId, farms.id))
    .where(eq(farmMembers.userId, userId))
    .orderBy(asc(farms.createdAt));

  return rows.map((farm) => ({
    ...farm,
    defaultPricePerLiter:
      farm.defaultPricePerLiter === null || farm.defaultPricePerLiter === undefined
        ? null
        : Number(farm.defaultPricePerLiter),
  }));
}

export async function getFarmForUser(db: AppDatabase, farmId: string, userId: string): Promise<FarmOption | null> {
  const [farm] = await db
    .select({
      city: farms.city,
      closingCycleEndDay: farms.closingCycleEndDay,
      closingCycleStartDay: farms.closingCycleStartDay,
      defaultPricePerLiter: farms.defaultPricePerLiter,
      id: farms.id,
      milkCompany: farms.milkCompany,
      name: farms.name,
      ownerName: farms.ownerName,
      state: farms.state,
    })
    .from(farmMembers)
    .innerJoin(farms, eq(farmMembers.farmId, farms.id))
    .where(and(eq(farmMembers.farmId, farmId), eq(farmMembers.userId, userId)))
    .limit(1);

  if (!farm) {
    return null;
  }

  return {
    ...farm,
    defaultPricePerLiter:
      farm.defaultPricePerLiter === null || farm.defaultPricePerLiter === undefined
        ? null
        : Number(farm.defaultPricePerLiter),
  };
}

export async function userCanAccessFarm(db: AppDatabase, farmId: string, userId: string) {
  const [member] = await db
    .select({ id: farmMembers.id })
    .from(farmMembers)
    .where(and(eq(farmMembers.farmId, farmId), eq(farmMembers.userId, userId)))
    .limit(1);

  return Boolean(member);
}

export async function updateFarm(
  db: AppDatabase,
  farmId: string,
  input: Partial<CreateFarmInput>,
): Promise<{ id: string } | undefined> {
  const [updated] = await db
    .update(farms)
    .set({
      city: input.city,
      closingCycleStartDay: input.closingCycleStartDay,
      closingCycleEndDay: input.closingCycleEndDay,
      defaultPricePerLiter:
        input.defaultPricePerLiter === undefined ? undefined : input.defaultPricePerLiter.toString(),
      milkCompany: input.milkCompany,
      name: input.name,
      ownerName: input.ownerName,
      state: input.state?.toUpperCase(),
      updatedAt: new Date(),
    })
    .where(eq(farms.id, farmId))
    .returning({ id: farms.id });

  return updated;
}

export async function getFarmById(db: AppDatabase, farmId: string): Promise<FarmOption | null> {
  const [farm] = await db
    .select({
      city: farms.city,
      closingCycleEndDay: farms.closingCycleEndDay,
      closingCycleStartDay: farms.closingCycleStartDay,
      defaultPricePerLiter: farms.defaultPricePerLiter,
      id: farms.id,
      milkCompany: farms.milkCompany,
      name: farms.name,
      ownerName: farms.ownerName,
      state: farms.state,
    })
    .from(farms)
    .where(eq(farms.id, farmId))
    .limit(1);

  return farm ? mapFarmOption(farm) : null;
}

export async function farmHasLinkedData(db: AppDatabase, farmId: string) {
  const checks = await Promise.all([
    db.select({ id: dailyProductions.id }).from(dailyProductions).where(eq(dailyProductions.farmId, farmId)).limit(1),
    db.select({ id: expenses.id }).from(expenses).where(eq(expenses.farmId, farmId)).limit(1),
    db.select({ id: feedBrands.id }).from(feedBrands).where(eq(feedBrands.farmId, farmId)).limit(1),
    db.select({ id: feedTests.id }).from(feedTests).where(eq(feedTests.farmId, farmId)).limit(1),
    db.select({ id: monthlyClosings.id }).from(monthlyClosings).where(eq(monthlyClosings.farmId, farmId)).limit(1),
    db.select({ id: reportExports.id }).from(reportExports).where(eq(reportExports.farmId, farmId)).limit(1),
    db.select({ id: appSettings.id }).from(appSettings).where(eq(appSettings.farmId, farmId)).limit(1),
  ]);

  return checks.some((rows) => rows.length > 0);
}

export async function deleteFarm(db: AppDatabase, farmId: string): Promise<{ deleted: boolean; reason?: string }> {
  if (await farmHasLinkedData(db, farmId)) {
    return {
      deleted: false,
      reason: "Exclua ou mantenha os registros vinculados antes de excluir a fazenda.",
    };
  }

  const [deleted] = await db.delete(farms).where(eq(farms.id, farmId)).returning({ id: farms.id });

  return { deleted: Boolean(deleted) };
}

type FarmRow = {
  city: string | null;
  closingCycleEndDay: number;
  closingCycleStartDay: number;
  defaultPricePerLiter: string | null;
  id: string;
  milkCompany: string | null;
  name: string;
  ownerName: string | null;
  state: string | null;
};

function mapFarmOption(farm: FarmRow): FarmOption {
  return {
    ...farm,
    defaultPricePerLiter:
      farm.defaultPricePerLiter === null || farm.defaultPricePerLiter === undefined
        ? null
        : Number(farm.defaultPricePerLiter),
  };
}
