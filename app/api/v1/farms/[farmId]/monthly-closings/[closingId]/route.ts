import { getDb } from "@/db/client";
import { requireApiFarmAccess } from "@/lib/api/farm-access";
import { apiError, apiOk, zodError } from "@/lib/api/responses";
import { getFarmForUser } from "@/lib/repositories/farms";
import { deleteMonthlyClosing, getMonthlyClosingById } from "@/lib/repositories/monthly-closings";
import { calculateAndSaveMonthlyClosing, MonthlyClosingError } from "@/lib/services/monthly-closing";
import { monthlyClosingSchema } from "@/lib/validations/monthly-closing";

export const runtime = "nodejs";

type MonthlyClosingItemRouteContext = {
  params: Promise<{
    closingId: string;
    farmId: string;
  }>;
};

export async function PATCH(request: Request, context: MonthlyClosingItemRouteContext) {
  const { closingId, farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const parsed = monthlyClosingSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return zodError(parsed.error.flatten().fieldErrors);
  }

  const db = getDb();
  const [existing, farm] = await Promise.all([
    getMonthlyClosingById(db, farmId, closingId),
    getFarmForUser(db, farmId, access.user.id),
  ]);

  if (!existing) {
    return apiError(404, "not_found", "Fechamento nao encontrado.");
  }

  if (!farm) {
    return apiError(403, "forbidden", "Voce nao tem acesso a esta fazenda.");
  }

  if (parsed.data.referenceMonth !== existing.referenceMonth) {
    return apiError(400, "reference_month_locked", "Use a mesma competencia do fechamento.");
  }

  try {
    const saved = await calculateAndSaveMonthlyClosing(db, {
      closedBy: access.user.id,
      farm,
      milkInvoiceAmount: parsed.data.milkInvoiceAmount,
      periodEnd: parsed.data.periodEnd ?? existing.periodEnd,
      periodStart: parsed.data.periodStart ?? existing.periodStart,
      referenceMonth: parsed.data.referenceMonth,
    });

    return apiOk({ id: saved.id ?? closingId, periodEnd: saved.period.endDate, periodStart: saved.period.startDate });
  } catch (error) {
    if (error instanceof MonthlyClosingError) {
      return apiError(error.code === "overlapping_period" ? 409 : 400, error.code, error.message);
    }

    return apiError(500, "closing_error", "Nao foi possivel atualizar o fechamento.");
  }
}

export async function DELETE(request: Request, context: MonthlyClosingItemRouteContext) {
  const { closingId, farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const deleted = await deleteMonthlyClosing(getDb(), farmId, closingId);

  if (!deleted) {
    return apiError(404, "not_found", "Fechamento nao encontrado.");
  }

  return apiOk({ id: closingId });
}
