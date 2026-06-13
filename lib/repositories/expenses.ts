import { expenses } from "@/db/schema";
import { expenseCategories, type expenseSchema } from "@/lib/validations/expense";
import type { AppDatabase } from "./types";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import type { z } from "zod";

const feedExpenseCategory = expenseCategories[0];

export type CreateExpenseInput = z.infer<typeof expenseSchema> & {
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
  id: string;
  referenceMonth: string;
  supplier: string | null;
};

export async function listExpensesByMonth(
  db: AppDatabase,
  farmId: string,
  startDate: string,
  endDate: string,
): Promise<ExpenseRecord[]> {
  const rows = await db
    .select({
      amount: expenses.amount,
      category: expenses.category,
      date: expenses.date,
      description: expenses.description,
      id: expenses.id,
      referenceMonth: expenses.referenceMonth,
      supplier: expenses.supplier,
    })
    .from(expenses)
    .where(and(eq(expenses.farmId, farmId), gte(expenses.date, startDate), lte(expenses.date, endDate)))
    .orderBy(desc(expenses.date));

  return rows.map((row) => ({
    ...row,
    amount: Number(row.amount),
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
    .select({
      amount: expenses.amount,
      category: expenses.category,
      date: expenses.date,
      description: expenses.description,
      id: expenses.id,
      referenceMonth: expenses.referenceMonth,
      supplier: expenses.supplier,
    })
    .from(expenses)
    .where(and(eq(expenses.farmId, farmId), eq(expenses.referenceMonth, referenceMonth)))
    .orderBy(desc(expenses.date));

  return rows.map((row) => ({
    ...row,
    amount: Number(row.amount),
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
