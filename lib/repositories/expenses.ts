import { expenses } from "@/db/schema";
import type { expenseSchema } from "@/lib/validations/expense";
import type { AppDatabase } from "./types";
import type { z } from "zod";

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
