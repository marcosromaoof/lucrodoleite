import type { AppDatabase } from "@/lib/repositories/types";
import { calculateMonthlyClosing } from "@/lib/calculations/financial";
import { getCycleDateRange, getTodayDateKey, type DateRange } from "@/lib/dates/month";
import { getMonthlyExpenseSummary } from "@/lib/repositories/expenses";
import { type FarmOption } from "@/lib/repositories/farms";
import {
  findMonthlyClosingsContainingDate,
  getMonthlyClosing,
  getMonthlyClosingById,
  hasOverlappingMonthlyClosing,
  type MonthlyClosingRecord,
  upsertMonthlyClosing,
} from "@/lib/repositories/monthly-closings";
import { getMonthlyProductionSummary } from "@/lib/repositories/production";

export class MonthlyClosingError extends Error {
  constructor(
    readonly code: "invalid_period" | "overlapping_period" | "production_required",
    message: string,
  ) {
    super(message);
  }
}

export function resolveClosingPeriod(
  farm: Pick<FarmOption, "closingCycleEndDay" | "closingCycleStartDay">,
  referenceMonth: string,
  periodStart?: string,
  periodEnd?: string,
): DateRange {
  if (periodStart && periodEnd) {
    return { startDate: periodStart, endDate: periodEnd };
  }

  return getCycleDateRange(referenceMonth, farm.closingCycleStartDay, farm.closingCycleEndDay);
}

export async function calculateAndSaveMonthlyClosing(
  db: AppDatabase,
  input: {
    closedBy?: string;
    farm: Pick<FarmOption, "closingCycleEndDay" | "closingCycleStartDay" | "id">;
    milkInvoiceAmount: number;
    periodEnd?: string;
    periodStart?: string;
    referenceMonth: string;
  },
) {
  const period = resolveClosingPeriod(input.farm, input.referenceMonth, input.periodStart, input.periodEnd);

  if (period.endDate < period.startDate) {
    throw new MonthlyClosingError("invalid_period", "Periodo do fechamento invalido.");
  }

  const existing = await getMonthlyClosing(db, input.farm.id, input.referenceMonth);
  const overlaps = await hasOverlappingMonthlyClosing(
    db,
    input.farm.id,
    period.startDate,
    period.endDate,
    existing?.id,
  );

  if (overlaps) {
    throw new MonthlyClosingError("overlapping_period", "Ja existe fechamento sobrepondo este periodo.");
  }

  const [productionSummary, expenseSummary] = await Promise.all([
    getMonthlyProductionSummary(db, input.farm.id, period.startDate, period.endDate, getTodayDateKey()),
    getMonthlyExpenseSummary(db, input.farm.id, period.startDate, period.endDate),
  ]);

  if (productionSummary.totalLiters <= 0) {
    throw new MonthlyClosingError("production_required", "Registre producao no periodo antes de fechar.");
  }

  const result = calculateMonthlyClosing({
    milkInvoiceAmount: input.milkInvoiceAmount,
    totalExpenses: expenseSummary.totalAmount,
    totalFeedAmount: expenseSummary.feedAmount,
    totalLiters: productionSummary.totalLiters,
  });
  const saved = await upsertMonthlyClosing(db, {
    ...result,
    closedBy: input.closedBy,
    farmId: input.farm.id,
    milkInvoiceAmount: input.milkInvoiceAmount,
    periodEnd: period.endDate,
    periodStart: period.startDate,
    referenceMonth: input.referenceMonth,
    totalExpenses: expenseSummary.totalAmount,
    totalFeedAmount: expenseSummary.feedAmount,
    totalLiters: productionSummary.totalLiters,
  });

  return {
    id: saved?.id,
    period,
    result,
    summaries: {
      expenses: expenseSummary,
      production: productionSummary,
    },
  };
}

export async function recalculateClosingsForDates(db: AppDatabase, farmId: string, dates: Array<string | undefined>) {
  const uniqueDates = [...new Set(dates.filter(Boolean) as string[])];
  const closingRows = await Promise.all(
    uniqueDates.map((date) => findMonthlyClosingsContainingDate(db, farmId, date)),
  );
  const closings = new Map<string, MonthlyClosingRecord>();

  for (const row of closingRows.flat()) {
    closings.set(row.id, row);
  }

  for (const closing of closings.values()) {
    await recalculateExistingMonthlyClosing(db, closing);
  }
}

export async function assertProductionChangeKeepsClosedPeriods(
  db: AppDatabase,
  input: {
    farmId: string;
    newDate?: string;
    newLiters?: number;
    oldDate: string;
    oldLiters: number;
  },
) {
  const closings = await findMonthlyClosingsContainingDate(db, input.farmId, input.oldDate);

  for (const closing of closings) {
    const newProductionIsInside =
      input.newDate !== undefined && input.newDate >= closing.periodStart && input.newDate <= closing.periodEnd;
    const projectedLiters = closing.totalLiters - input.oldLiters + (newProductionIsInside ? input.newLiters ?? 0 : 0);

    if (projectedLiters <= 0) {
      throw new MonthlyClosingError(
        "production_required",
        "A alteracao deixaria um fechamento sem litros produzidos. Exclua o fechamento antes.",
      );
    }
  }
}

export async function recalculateExistingMonthlyClosingById(db: AppDatabase, farmId: string, closingId: string) {
  const closing = await getMonthlyClosingById(db, farmId, closingId);

  if (!closing) {
    return null;
  }

  return recalculateExistingMonthlyClosing(db, closing);
}

async function recalculateExistingMonthlyClosing(db: AppDatabase, closing: MonthlyClosingRecord) {
  const [productionSummary, expenseSummary] = await Promise.all([
    getMonthlyProductionSummary(db, closing.farmId, closing.periodStart, closing.periodEnd, getTodayDateKey()),
    getMonthlyExpenseSummary(db, closing.farmId, closing.periodStart, closing.periodEnd),
  ]);

  if (productionSummary.totalLiters <= 0) {
    throw new MonthlyClosingError(
      "production_required",
      "A alteracao deixaria um fechamento sem litros produzidos. Exclua o fechamento antes.",
    );
  }

  const result = calculateMonthlyClosing({
    milkInvoiceAmount: closing.milkInvoiceAmount,
    totalExpenses: expenseSummary.totalAmount,
    totalFeedAmount: expenseSummary.feedAmount,
    totalLiters: productionSummary.totalLiters,
  });

  await upsertMonthlyClosing(db, {
    ...result,
    farmId: closing.farmId,
    milkInvoiceAmount: closing.milkInvoiceAmount,
    periodEnd: closing.periodEnd,
    periodStart: closing.periodStart,
    referenceMonth: closing.referenceMonth,
    totalExpenses: expenseSummary.totalAmount,
    totalFeedAmount: expenseSummary.feedAmount,
    totalLiters: productionSummary.totalLiters,
  });

  return result;
}
