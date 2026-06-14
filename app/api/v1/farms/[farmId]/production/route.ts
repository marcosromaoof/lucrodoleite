import { getDb } from "@/db/client";
import { requireApiFarmAccess } from "@/lib/api/farm-access";
import { apiError, apiOk, zodError } from "@/lib/api/responses";
import { getCycleDateRange, getTodayDateKey, normalizeMonthKey } from "@/lib/dates/month";
import { getFarmForUser } from "@/lib/repositories/farms";
import {
  createDailyProduction,
  getProductionByDate,
  getMonthlyProductionSummary,
  listProductionsByMonth,
} from "@/lib/repositories/production";
import {
  assertProductionChangeKeepsClosedPeriods,
  MonthlyClosingError,
  recalculateClosingsForDates,
} from "@/lib/services/monthly-closing";
import { productionSchema } from "@/lib/validations/production";

export const runtime = "nodejs";

type ProductionRouteContext = {
  params: Promise<{
    farmId: string;
  }>;
};

export async function GET(request: Request, context: ProductionRouteContext) {
  const { farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const url = new URL(request.url);
  const referenceMonth = normalizeMonthKey(url.searchParams.get("referenceMonth") ?? undefined);
  const db = getDb();
  const farm = await getFarmForUser(db, farmId, access.user.id);

  if (!farm) {
    return apiError(403, "forbidden", "Voce nao tem acesso a esta fazenda.");
  }

  const range = getCycleDateRange(referenceMonth, farm.closingCycleStartDay, farm.closingCycleEndDay);
  const [records, summary] = await Promise.all([
    listProductionsByMonth(db, farmId, range.startDate, range.endDate),
    getMonthlyProductionSummary(db, farmId, range.startDate, range.endDate, getTodayDateKey()),
  ]);

  return apiOk({ periodEnd: range.endDate, periodStart: range.startDate, records, referenceMonth, summary });
}

export async function POST(request: Request, context: ProductionRouteContext) {
  const { farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const parsed = productionSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return zodError(parsed.error.flatten().fieldErrors);
  }

  const db = getDb();
  const existing = await getProductionByDate(db, farmId, parsed.data.date);

  try {
    if (existing) {
      await assertProductionChangeKeepsClosedPeriods(db, {
        farmId,
        newDate: parsed.data.date,
        newLiters: parsed.data.liters,
        oldDate: existing.date,
        oldLiters: existing.liters,
      });
    }

    const created = await createDailyProduction(db, {
      ...parsed.data,
      createdBy: access.user.id,
      farmId,
    });
    await recalculateClosingsForDates(db, farmId, [parsed.data.date]);

    return apiOk({ id: created?.id }, 201);
  } catch (error) {
    if (error instanceof MonthlyClosingError) {
      return apiError(400, error.code, error.message);
    }

    return apiError(500, "production_error", "Nao foi possivel salvar a producao.");
  }
}
