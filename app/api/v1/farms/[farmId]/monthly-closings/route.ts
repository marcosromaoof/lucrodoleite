import { getDb } from "@/db/client";
import { requireApiFarmAccess } from "@/lib/api/farm-access";
import { apiError, apiOk, zodError } from "@/lib/api/responses";
import { normalizeMonthKey } from "@/lib/dates/month";
import { getFarmForUser } from "@/lib/repositories/farms";
import { getMonthlyClosing, listMonthlyClosings } from "@/lib/repositories/monthly-closings";
import { calculateAndSaveMonthlyClosing, MonthlyClosingError } from "@/lib/services/monthly-closing";
import { monthlyClosingSchema } from "@/lib/validations/monthly-closing";

export const runtime = "nodejs";

type MonthlyClosingsRouteContext = {
  params: Promise<{
    farmId: string;
  }>;
};

export async function GET(request: Request, context: MonthlyClosingsRouteContext) {
  const { farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const url = new URL(request.url);
  const referenceMonth = url.searchParams.get("referenceMonth");

  if (referenceMonth) {
    const closing = await getMonthlyClosing(getDb(), farmId, normalizeMonthKey(referenceMonth));

    return apiOk({ closing });
  }

  const records = await listMonthlyClosings(getDb(), farmId);

  return apiOk({ records });
}

export async function POST(request: Request, context: MonthlyClosingsRouteContext) {
  const { farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const parsed = monthlyClosingSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return zodError(parsed.error.flatten().fieldErrors);
  }

  const db = getDb();
  const farm = await getFarmForUser(db, farmId, access.user.id);

  if (!farm) {
    return apiError(403, "forbidden", "Voce nao tem acesso a esta fazenda.");
  }

  try {
    const saved = await calculateAndSaveMonthlyClosing(db, {
      closedBy: access.user.id,
      farm,
      milkInvoiceAmount: parsed.data.milkInvoiceAmount,
      periodEnd: parsed.data.periodEnd,
      periodStart: parsed.data.periodStart,
      referenceMonth: parsed.data.referenceMonth,
    });

    return apiOk({ id: saved.id, periodEnd: saved.period.endDate, periodStart: saved.period.startDate, result: saved.result }, 201);
  } catch (error) {
    if (error instanceof MonthlyClosingError) {
      return apiError(error.code === "overlapping_period" ? 409 : 400, error.code, error.message);
    }

    return apiError(500, "closing_error", "Nao foi possivel salvar o fechamento.");
  }
}
