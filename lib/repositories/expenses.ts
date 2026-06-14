import { expenses } from "@/db/schema";
import { expenseCategories, type NormalizedExpenseInput } from "@/lib/validations/expense";
import type { AppDatabase } from "./types";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

const feedExpenseCategory = expenseCategories[0];

export type CreateExpenseInput = NormalizedExpenseInput & {
  farmId: string;
  createdBy?: string;
};

export async function createExpense(db: AppDatabase, input: CreateExpenseInput) {
  const [created] = await db
    .insert(expenses)
    .values({
      farmId: input.farmId,
      date: input.date,
      referenceMonth: input.referenceMonth,
      category: input.category,
      supplier: input.supplier,
      description: input.description,
      quantity: input.quantity?.toString(),
      unit: input.unit,
      unitPrice: input.unitPrice?.toString(),
      amount: input.amount.toString(),
      feedBrandId: input.feedBrandId,
      feedTestId: input.feedTestId,
      createdBy: input.createdBy,
    })
    .returning({ id: expenses.id });

  return created;
}

export type ExpenseRecord = {
  amount: number;
  category: string;
  date: string;
  description: string;
  feedBrandId: string | null;
  feedTestId: string | null;
  id: string;
  quantity: number | null;
  referenceMonth: string;
  supplier: string | null;
  unit: string | null;
  unitPrice: number | null;
};

const expenseSelect = {
  amount: expenses.amount,
  category: expenses.category,
  date: expenses.date,
  description: expenses.description,
  feedBrandId: expenses.feedBrandId,
  feedTestId: expenses.feedTestId,
  id: expenses.id,
  quantity: expenses.quantity,
  referenceMonth: expenses.referenceMonth,
  supplier: expenses.supplier,
  unit: expenses.unit,
  unitPrice: expenses.unitPrice,
};

export async function listExpensesByMonth(
  db: AppDatabase,
  farmId: string,
  startDate: string,
  endDate: string,
): Promise<ExpenseRecord[]> {
  const rows = await db
    .select(expenseSelect)
    .from(expenses)
    .where(and(eq(expenses.farmId, farmId), gte(expenses.date, startDate), lte(expenses.date, endDate)))
    .orderBy(desc(expenses.date));

  return rows.map((row) => ({
    ...row,
    amount: Number(row.amount),
    quantity: toNullableNumber(row.quantity),
    unitPrice: toNullableNumber(row.unitPrice),
  }));
}

export async function getMonthlyExpenseSummary(
  db: AppDatabase,
  farmId: string,
  startDate: string,
  endDate: string,
) {
  const [summary] = await db
    .select({
      feedAmount: sql<string>`coalesce(sum(${expenses.amount}) filter (where ${expenses.category} = ${feedExpenseCategory}), 0)`,
      totalAmount: sql<string>`coalesce(sum(${expenses.amount}), 0)`,
    })
    .from(expenses)
    .where(and(eq(expenses.farmId, farmId), gte(expenses.date, startDate), lte(expenses.date, endDate)));

  return {
    feedAmount: Number(summary?.feedAmount ?? 0),
    totalAmount: Number(summary?.totalAmount ?? 0),
  };
}

export async function listExpensesByReferenceMonth(
  db: AppDatabase,
  farmId: string,
  referenceMonth: string,
): Promise<ExpenseRecord[]> {
  const rows = await db
    .select(expenseSelect)
    .from(expenses)
    .where(and(eq(expenses.farmId, farmId), eq(expenses.referenceMonth, referenceMonth)))
    .orderBy(desc(expenses.date));

  return rows.map((row) => ({
    ...row,
    amount: Number(row.amount),
    quantity: toNullableNumber(row.quantity),
    unitPrice: toNullableNumber(row.unitPrice),
  }));
}

export async function getMonthlyExpenseSummaryByReferenceMonth(
  db: AppDatabase,
  farmId: string,
  referenceMonth: string,
) {
  const [summary] = await db
    .select({
      feedAmount: sql<string>`coalesce(sum(${expenses.amount}) filter (where ${expenses.category} = ${feedExpenseCategory}), 0)`,
      totalAmount: sql<string>`coalesce(sum(${expenses.amount}), 0)`,
    })
    .from(expenses)
    .where(and(eq(expenses.farmId, farmId), eq(expenses.referenceMonth, referenceMonth)));

  return {
    feedAmount: Number(summary?.feedAmount ?? 0),
    totalAmount: Number(summary?.totalAmount ?? 0),
  };
}

export async function summarizeExpensesByCategoryByReferenceMonth(
  db: AppDatabase,
  farmId: string,
  referenceMonth: string,
) {
  const rows = await db
    .select({
      category: expenses.category,
      totalAmount: sql<string>`coalesce(sum(${expenses.amount}), 0)`,
    })
    .from(expenses)
    .where(and(eq(expenses.farmId, farmId), eq(expenses.referenceMonth, referenceMonth)))
    .groupBy(expenses.category)
    .orderBy(expenses.category);

  return rows.map((row) => ({
    category: row.category,
    totalAmount: Number(row.totalAmount),
  }));
}

export async function summarizeExpensesByCategory(
  db: AppDatabase,
  farmId: string,
  startDate: string,
  endDate: string,
) {
  const rows = await db
    .select({
      category: expenses.category,
      totalAmount: sql<string>`coalesce(sum(${expenses.amount}), 0)`,
    })
    .from(expenses)
    .where(and(eq(expenses.farmId, farmId), gte(expenses.date, startDate), lte(expenses.date, endDate)))
    .groupBy(expenses.category)
    .orderBy(expenses.category);

  return rows.map((row) => ({
    category: row.category,
    totalAmount: Number(row.totalAmount),
  }));
}

export async function getExpenseById(
  db: AppDatabase,
  farmId: string,
  expenseId: string,
): Promise<ExpenseRecord | null> {
  const [row] = await db
    .select(expenseSelect)
    .from(expenses)
    .where(and(eq(expenses.farmId, farmId), eq(expenses.id, expenseId)))
    .limit(1);

  return row
    ? {
        ...row,
        amount: Number(row.amount),
        quantity: toNullableNumber(row.quantity),
        unitPrice: toNullableNumber(row.unitPrice),
      }
    : null;
}

export async function updateExpense(
  db: AppDatabase,
  farmId: string,
  expenseId: string,
  input: NormalizedExpenseInput,
) {
  const [updated] = await db
    .update(expenses)
    .set({
      amount: input.amount.toString(),
      category: input.category,
      date: input.date,
      description: input.description,
      feedBrandId: input.feedBrandId,
      feedTestId: input.feedTestId,
      quantity: input.quantity?.toString(),
      referenceMonth: input.referenceMonth,
      supplier: input.supplier,
      unit: input.unit,
      unitPrice: input.unitPrice?.toString(),
      updatedAt: new Date(),
    })
    .where(and(eq(expenses.farmId, farmId), eq(expenses.id, expenseId)))
    .returning({ id: expenses.id });

  return updated;
}

export async function deleteExpense(db: AppDatabase, farmId: string, expenseId: string) {
  const [deleted] = await db
    .delete(expenses)
    .where(and(eq(expenses.farmId, farmId), eq(expenses.id, expenseId)))
    .returning({ id: expenses.id });

  return deleted;
}

function toNullableNumber(value: string | null | undefined) {
  return value === null || value === undefined ? null : Number(value);
}
