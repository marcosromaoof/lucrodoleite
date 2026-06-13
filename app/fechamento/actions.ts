"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { requireDatabaseConfigured } from "@/lib/actions/guards";
import { success, validationError, type ActionState } from "@/lib/actions/action-state";
import { calculateMonthlyClosing } from "@/lib/calculations/financial";
import { getMonthDateRange, getTodayDateKey } from "@/lib/dates/month";
import { readNumber, readRequiredString } from "@/lib/forms/form-data";
import { getMonthlyExpenseSummaryByReferenceMonth } from "@/lib/repositories/expenses";
import { upsertMonthlyClosing } from "@/lib/repositories/monthly-closings";
import { getMonthlyProductionSummary } from "@/lib/repositories/production";
import { farmScopedSchema } from "@/lib/validations/scoped";
import { monthlyClosingSchema } from "@/lib/validations/monthly-closing";

export async function createMonthlyClosingAction(formData: FormData): Promise<ActionState> {
  const parsed = monthlyClosingSchema
    .merge(farmScopedSchema)
    .safeParse({
      farmId: readRequiredString(formData, "farmId"),
      milkInvoiceAmount: readNumber(formData, "milkInvoiceAmount"),
      referenceMonth: readRequiredString(formData, "referenceMonth"),
    });

  if (!parsed.success) {
    return validationError("Confira os dados do fechamento.", parsed.error.flatten().fieldErrors);
  }

  const databaseGuard = requireDatabaseConfigured();

  if (databaseGuard) {
    return databaseGuard;
  }

  try {
    const db = getDb();
    const range = getMonthDateRange(parsed.data.referenceMonth);
    const [productionSummary, expenseSummary] = await Promise.all([
      getMonthlyProductionSummary(db, parsed.data.farmId, range.startDate, range.endDate, getTodayDateKey()),
      getMonthlyExpenseSummaryByReferenceMonth(db, parsed.data.farmId, parsed.data.referenceMonth),
    ]);

    if (productionSummary.totalLiters <= 0) {
      return validationError("Registre a produção do mês antes de fechar.");
    }

    const result = calculateMonthlyClosing({
      milkInvoiceAmount: parsed.data.milkInvoiceAmount,
      totalExpenses: expenseSummary.totalAmount,
      totalFeedAmount: expenseSummary.feedAmount,
      totalLiters: productionSummary.totalLiters,
    });

    const created = await upsertMonthlyClosing(db, {
      ...result,
      farmId: parsed.data.farmId,
      milkInvoiceAmount: parsed.data.milkInvoiceAmount,
      referenceMonth: parsed.data.referenceMonth,
      totalExpenses: expenseSummary.totalAmount,
      totalFeedAmount: expenseSummary.feedAmount,
      totalLiters: productionSummary.totalLiters,
    });

    revalidatePath("/", "layout");
    return success("Fechamento salvo com sucesso.", created?.id);
  } catch {
    return validationError("Não foi possível salvar o fechamento agora.");
  }
}

export async function submitMonthlyClosingForm(formData: FormData): Promise<void> {
  await createMonthlyClosingAction(formData);
}
