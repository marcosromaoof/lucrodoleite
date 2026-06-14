import { and, desc, eq, ne } from "drizzle-orm";
import { cowEvaluationEntries, cowEvaluations, cows } from "@/db/schema";
import type { CowEvaluationPhase } from "@/lib/calculations/cow-evaluation";
import type { cowEvaluationEntrySchema, cowEvaluationSchema, cowSchema } from "@/lib/validations/cow";
import type { z } from "zod";
import type { AppDatabase } from "./types";

export type CowRecord = {
  birthDate: string | null;
  breed: string | null;
  id: string;
  identification: string;
  name: string | null;
  notes: string | null;
  status: string;
};

export type CowEvaluationRecord = {
  baselineEndDate: string;
  baselineStartDate: string;
  cowId: string;
  cowIdentification: string;
  cowName: string | null;
  id: string;
  milkPricePerLiter: number;
  name: string;
  notes: string | null;
  testEndDate: string;
  testStartDate: string;
};

export type CowEvaluationEntryRecord = {
  date: string;
  evaluationId: string;
  feedKg: number | null;
  feedPricePerKg: number | null;
  id: string;
  liters: number;
  notes: string | null;
  otherCosts: number | null;
  phase: CowEvaluationPhase;
  silageKg: number | null;
  silagePricePerKg: number | null;
};

export type CreateCowInput = z.infer<typeof cowSchema> & {
  createdBy?: string;
  farmId: string;
};

export type CreateCowEvaluationInput = z.infer<typeof cowEvaluationSchema> & {
  createdBy?: string;
  farmId: string;
};

export type CreateCowEvaluationEntryInput = z.infer<typeof cowEvaluationEntrySchema> & {
  createdBy?: string;
  evaluationId: string;
  farmId: string;
};

type CowEvaluationRow = Omit<CowEvaluationRecord, "milkPricePerLiter"> & {
  milkPricePerLiter: string;
};

type CowEvaluationEntryRow = Omit<
  CowEvaluationEntryRecord,
  "feedKg" | "feedPricePerKg" | "liters" | "otherCosts" | "phase" | "silageKg" | "silagePricePerKg"
> & {
  feedKg: string | null;
  feedPricePerKg: string | null;
  liters: string;
  otherCosts: string | null;
  phase: string;
  silageKg: string | null;
  silagePricePerKg: string | null;
};

const cowSelect = {
  birthDate: cows.birthDate,
  breed: cows.breed,
  id: cows.id,
  identification: cows.identification,
  name: cows.name,
  notes: cows.notes,
  status: cows.status,
};

const evaluationSelect = {
  baselineEndDate: cowEvaluations.baselineEndDate,
  baselineStartDate: cowEvaluations.baselineStartDate,
  cowId: cowEvaluations.cowId,
  cowIdentification: cows.identification,
  cowName: cows.name,
  id: cowEvaluations.id,
  milkPricePerLiter: cowEvaluations.milkPricePerLiter,
  name: cowEvaluations.name,
  notes: cowEvaluations.notes,
  testEndDate: cowEvaluations.testEndDate,
  testStartDate: cowEvaluations.testStartDate,
};

const entrySelect = {
  date: cowEvaluationEntries.date,
  evaluationId: cowEvaluationEntries.evaluationId,
  feedKg: cowEvaluationEntries.feedKg,
  feedPricePerKg: cowEvaluationEntries.feedPricePerKg,
  id: cowEvaluationEntries.id,
  liters: cowEvaluationEntries.liters,
  notes: cowEvaluationEntries.notes,
  otherCosts: cowEvaluationEntries.otherCosts,
  phase: cowEvaluationEntries.phase,
  silageKg: cowEvaluationEntries.silageKg,
  silagePricePerKg: cowEvaluationEntries.silagePricePerKg,
};

export async function createCow(db: AppDatabase, input: CreateCowInput) {
  const [created] = await db
    .insert(cows)
    .values({
      birthDate: input.birthDate,
      breed: input.breed,
      createdBy: input.createdBy,
      farmId: input.farmId,
      identification: input.identification,
      name: input.name,
      notes: input.notes,
      status: input.status,
    })
    .returning({ id: cows.id });

  return created;
}

export async function listCows(db: AppDatabase, farmId: string): Promise<CowRecord[]> {
  return db
    .select(cowSelect)
    .from(cows)
    .where(eq(cows.farmId, farmId))
    .orderBy(cows.identification);
}

export async function getCowById(db: AppDatabase, farmId: string, cowId: string): Promise<CowRecord | null> {
  const [row] = await db
    .select(cowSelect)
    .from(cows)
    .where(and(eq(cows.farmId, farmId), eq(cows.id, cowId)))
    .limit(1);

  return row ?? null;
}

export async function updateCow(db: AppDatabase, farmId: string, cowId: string, input: z.infer<typeof cowSchema>) {
  const [conflict] = await db
    .select({ id: cows.id })
    .from(cows)
    .where(and(eq(cows.farmId, farmId), eq(cows.identification, input.identification), ne(cows.id, cowId)))
    .limit(1);

  if (conflict) {
    return { conflict: true, record: null };
  }

  const [updated] = await db
    .update(cows)
    .set({
      birthDate: input.birthDate,
      breed: input.breed,
      identification: input.identification,
      name: input.name,
      notes: input.notes,
      status: input.status,
      updatedAt: new Date(),
    })
    .where(and(eq(cows.farmId, farmId), eq(cows.id, cowId)))
    .returning({ id: cows.id });

  return { conflict: false, record: updated };
}

export async function deleteCow(db: AppDatabase, farmId: string, cowId: string) {
  const [linkedEvaluation] = await db
    .select({ id: cowEvaluations.id })
    .from(cowEvaluations)
    .where(and(eq(cowEvaluations.farmId, farmId), eq(cowEvaluations.cowId, cowId)))
    .limit(1);

  if (linkedEvaluation) {
    return { deleted: false, reason: "Exclua as avaliações da vaca antes de remover o cadastro." };
  }

  const [deleted] = await db
    .delete(cows)
    .where(and(eq(cows.farmId, farmId), eq(cows.id, cowId)))
    .returning({ id: cows.id });

  return { deleted: Boolean(deleted), reason: deleted ? undefined : "Vaca não encontrada." };
}

export async function createCowEvaluation(db: AppDatabase, input: CreateCowEvaluationInput) {
  const cow = await getCowById(db, input.farmId, input.cowId);

  if (!cow) {
    return null;
  }

  const [created] = await db
    .insert(cowEvaluations)
    .values({
      baselineEndDate: input.baselineEndDate,
      baselineStartDate: input.baselineStartDate,
      cowId: input.cowId,
      createdBy: input.createdBy,
      farmId: input.farmId,
      milkPricePerLiter: input.milkPricePerLiter.toString(),
      name: input.name,
      notes: input.notes,
      testEndDate: input.testEndDate,
      testStartDate: input.testStartDate,
    })
    .returning({ id: cowEvaluations.id });

  return created;
}

export async function listCowEvaluations(db: AppDatabase, farmId: string): Promise<CowEvaluationRecord[]> {
  const rows = await db
    .select(evaluationSelect)
    .from(cowEvaluations)
    .innerJoin(cows, eq(cowEvaluations.cowId, cows.id))
    .where(eq(cowEvaluations.farmId, farmId))
    .orderBy(desc(cowEvaluations.createdAt));

  return rows.map(mapEvaluation);
}

export async function getCowEvaluationById(
  db: AppDatabase,
  farmId: string,
  evaluationId: string,
): Promise<CowEvaluationRecord | null> {
  const [row] = await db
    .select(evaluationSelect)
    .from(cowEvaluations)
    .innerJoin(cows, eq(cowEvaluations.cowId, cows.id))
    .where(and(eq(cowEvaluations.farmId, farmId), eq(cowEvaluations.id, evaluationId)))
    .limit(1);

  return row ? mapEvaluation(row) : null;
}

export async function updateCowEvaluation(
  db: AppDatabase,
  farmId: string,
  evaluationId: string,
  input: z.infer<typeof cowEvaluationSchema>,
) {
  const cow = await getCowById(db, farmId, input.cowId);

  if (!cow) {
    return null;
  }

  const [updated] = await db
    .update(cowEvaluations)
    .set({
      baselineEndDate: input.baselineEndDate,
      baselineStartDate: input.baselineStartDate,
      cowId: input.cowId,
      milkPricePerLiter: input.milkPricePerLiter.toString(),
      name: input.name,
      notes: input.notes,
      testEndDate: input.testEndDate,
      testStartDate: input.testStartDate,
      updatedAt: new Date(),
    })
    .where(and(eq(cowEvaluations.farmId, farmId), eq(cowEvaluations.id, evaluationId)))
    .returning({ id: cowEvaluations.id });

  return updated;
}

export async function deleteCowEvaluation(db: AppDatabase, farmId: string, evaluationId: string) {
  const [deleted] = await db
    .delete(cowEvaluations)
    .where(and(eq(cowEvaluations.farmId, farmId), eq(cowEvaluations.id, evaluationId)))
    .returning({ id: cowEvaluations.id });

  return deleted;
}

export async function createCowEvaluationEntry(db: AppDatabase, input: CreateCowEvaluationEntryInput) {
  const evaluation = await getCowEvaluationById(db, input.farmId, input.evaluationId);

  if (!evaluation) {
    return { conflict: false, record: null };
  }

  const [conflict] = await db
    .select({ id: cowEvaluationEntries.id })
    .from(cowEvaluationEntries)
    .where(
      and(
        eq(cowEvaluationEntries.evaluationId, input.evaluationId),
        eq(cowEvaluationEntries.date, input.date),
        eq(cowEvaluationEntries.phase, input.phase),
      ),
    )
    .limit(1);

  if (conflict) {
    return { conflict: true, record: null };
  }

  const [created] = await db
    .insert(cowEvaluationEntries)
    .values({
      createdBy: input.createdBy,
      date: input.date,
      evaluationId: input.evaluationId,
      farmId: input.farmId,
      feedKg: input.feedKg?.toString(),
      feedPricePerKg: input.feedPricePerKg?.toString(),
      liters: input.liters.toString(),
      notes: input.notes,
      otherCosts: input.otherCosts?.toString(),
      phase: input.phase,
      silageKg: input.silageKg?.toString(),
      silagePricePerKg: input.silagePricePerKg?.toString(),
    })
    .returning({ id: cowEvaluationEntries.id });

  return { conflict: false, record: created };
}

export async function listCowEvaluationEntries(
  db: AppDatabase,
  farmId: string,
  evaluationId: string,
): Promise<CowEvaluationEntryRecord[]> {
  const rows = await db
    .select(entrySelect)
    .from(cowEvaluationEntries)
    .where(and(eq(cowEvaluationEntries.farmId, farmId), eq(cowEvaluationEntries.evaluationId, evaluationId)))
    .orderBy(cowEvaluationEntries.date);

  return rows.map(mapEntry);
}

export async function listCowEvaluationEntriesByFarm(
  db: AppDatabase,
  farmId: string,
): Promise<CowEvaluationEntryRecord[]> {
  const rows = await db
    .select(entrySelect)
    .from(cowEvaluationEntries)
    .where(eq(cowEvaluationEntries.farmId, farmId))
    .orderBy(desc(cowEvaluationEntries.date));

  return rows.map(mapEntry);
}

export async function getCowEvaluationEntryById(
  db: AppDatabase,
  farmId: string,
  evaluationId: string,
  entryId: string,
): Promise<CowEvaluationEntryRecord | null> {
  const [row] = await db
    .select(entrySelect)
    .from(cowEvaluationEntries)
    .where(
      and(
        eq(cowEvaluationEntries.farmId, farmId),
        eq(cowEvaluationEntries.evaluationId, evaluationId),
        eq(cowEvaluationEntries.id, entryId),
      ),
    )
    .limit(1);

  return row ? mapEntry(row) : null;
}

export async function updateCowEvaluationEntry(
  db: AppDatabase,
  farmId: string,
  evaluationId: string,
  entryId: string,
  input: z.infer<typeof cowEvaluationEntrySchema>,
) {
  const [conflict] = await db
    .select({ id: cowEvaluationEntries.id })
    .from(cowEvaluationEntries)
    .where(
      and(
        eq(cowEvaluationEntries.evaluationId, evaluationId),
        eq(cowEvaluationEntries.date, input.date),
        eq(cowEvaluationEntries.phase, input.phase),
        ne(cowEvaluationEntries.id, entryId),
      ),
    )
    .limit(1);

  if (conflict) {
    return { conflict: true, record: null };
  }

  const [updated] = await db
    .update(cowEvaluationEntries)
    .set({
      date: input.date,
      feedKg: input.feedKg?.toString(),
      feedPricePerKg: input.feedPricePerKg?.toString(),
      liters: input.liters.toString(),
      notes: input.notes,
      otherCosts: input.otherCosts?.toString(),
      phase: input.phase,
      silageKg: input.silageKg?.toString(),
      silagePricePerKg: input.silagePricePerKg?.toString(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(cowEvaluationEntries.farmId, farmId),
        eq(cowEvaluationEntries.evaluationId, evaluationId),
        eq(cowEvaluationEntries.id, entryId),
      ),
    )
    .returning({ id: cowEvaluationEntries.id });

  return { conflict: false, record: updated };
}

export async function deleteCowEvaluationEntry(
  db: AppDatabase,
  farmId: string,
  evaluationId: string,
  entryId: string,
) {
  const [deleted] = await db
    .delete(cowEvaluationEntries)
    .where(
      and(
        eq(cowEvaluationEntries.farmId, farmId),
        eq(cowEvaluationEntries.evaluationId, evaluationId),
        eq(cowEvaluationEntries.id, entryId),
      ),
    )
    .returning({ id: cowEvaluationEntries.id });

  return deleted;
}

function mapEvaluation(row: CowEvaluationRow): CowEvaluationRecord {
  return {
    ...row,
    milkPricePerLiter: Number(row.milkPricePerLiter),
  };
}

function mapEntry(row: CowEvaluationEntryRow): CowEvaluationEntryRecord {
  return {
    ...row,
    feedKg: toNullableNumber(row.feedKg),
    feedPricePerKg: toNullableNumber(row.feedPricePerKg),
    liters: Number(row.liters),
    otherCosts: toNullableNumber(row.otherCosts),
    phase: row.phase as CowEvaluationPhase,
    silageKg: toNullableNumber(row.silageKg),
    silagePricePerKg: toNullableNumber(row.silagePricePerKg),
  };
}

function toNullableNumber(value: string | null | undefined) {
  return value === null || value === undefined ? null : Number(value);
}
