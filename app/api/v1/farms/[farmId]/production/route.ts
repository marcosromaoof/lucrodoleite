import { getDb } from "@/db/client";
import { requireApiFarmAccess } from "@/lib/api/farm-access";
import { apiOk, zodError } from "@/lib/api/responses";
import { getMonthDateRange, getTodayDateKey, normalizeMonthKey } from "@/lib/dates/month";
import {
  createDailyProduction,
  getMonthlyProductionSummary,
  listProductionsByMonth,
} from "@/lib/repositories/production";
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
  const range = getMonthDateRange(referenceMonth);
  const db = getDb();
  const [records, summary] = await Promise.all([
    listProductionsByMonth(db, farmId, range.startDate, range.endDate),
    getMonthlyProductionSummary(db, farmId, range.startDate, range.endDate, getTodayDateKey()),
  ]);

  return apiOk({ records, referenceMonth, summary });
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

  const created = await createDailyProduction(getDb(), {
    ...parsed.data,
    createdBy: access.user.id,
    farmId,
  });

  return apiOk({ id: created?.id }, 201);
}
