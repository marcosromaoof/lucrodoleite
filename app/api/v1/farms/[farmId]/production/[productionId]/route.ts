import { getDb } from "@/db/client";
import { requireApiFarmAccess } from "@/lib/api/farm-access";
import { apiError, apiOk, zodError } from "@/lib/api/responses";
import {
  deleteProduction,
  getProductionById,
  updateProduction,
} from "@/lib/repositories/production";
import {
  assertProductionChangeKeepsClosedPeriods,
  MonthlyClosingError,
  recalculateClosingsForDates,
} from "@/lib/services/monthly-closing";
import { productionSchema } from "@/lib/validations/production";

export const runtime = "nodejs";

type ProductionItemRouteContext = {
  params: Promise<{
    farmId: string;
    productionId: string;
  }>;
};

export async function PATCH(request: Request, context: ProductionItemRouteContext) {
  const { farmId, productionId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const parsed = productionSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return zodError(parsed.error.flatten().fieldErrors);
  }

  try {
    const db = getDb();
    const existing = await getProductionById(db, farmId, productionId);

    if (!existing) {
      return apiError(404, "not_found", "Producao nao encontrada.");
    }

    await assertProductionChangeKeepsClosedPeriods(db, {
      farmId,
      newDate: parsed.data.date,
      newLiters: parsed.data.liters,
      oldDate: existing.date,
      oldLiters: existing.liters,
    });

    const updated = await updateProduction(db, farmId, productionId, parsed.data);

    if (updated.conflict) {
      return apiError(409, "date_conflict", "Ja existe producao cadastrada para esta data.");
    }

    await recalculateClosingsForDates(db, farmId, [existing.date, parsed.data.date]);

    return apiOk({ id: updated.record?.id ?? productionId });
  } catch (error) {
    if (error instanceof MonthlyClosingError) {
      return apiError(400, error.code, error.message);
    }

    return apiError(500, "production_error", "Nao foi possivel atualizar a producao.");
  }
}

export async function DELETE(request: Request, context: ProductionItemRouteContext) {
  const { farmId, productionId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  try {
    const db = getDb();
    const existing = await getProductionById(db, farmId, productionId);

    if (!existing) {
      return apiError(404, "not_found", "Producao nao encontrada.");
    }

    await assertProductionChangeKeepsClosedPeriods(db, {
      farmId,
      oldDate: existing.date,
      oldLiters: existing.liters,
    });

    await deleteProduction(db, farmId, productionId);
    await recalculateClosingsForDates(db, farmId, [existing.date]);

    return apiOk({ id: productionId });
  } catch (error) {
    if (error instanceof MonthlyClosingError) {
      return apiError(400, error.code, error.message);
    }

    return apiError(500, "production_error", "Nao foi possivel excluir a producao.");
  }
}
