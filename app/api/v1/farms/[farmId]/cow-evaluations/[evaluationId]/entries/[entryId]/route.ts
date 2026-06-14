import { getDb } from "@/db/client";
import { requireApiFarmAccess } from "@/lib/api/farm-access";
import { apiError, apiOk, zodError } from "@/lib/api/responses";
import {
  deleteCowEvaluationEntry,
  getCowEvaluationEntryById,
  updateCowEvaluationEntry,
} from "@/lib/repositories/cows";
import { cowEvaluationEntrySchema } from "@/lib/validations/cow";

export const runtime = "nodejs";

type CowEvaluationEntryRouteContext = {
  params: Promise<{
    entryId: string;
    evaluationId: string;
    farmId: string;
  }>;
};

export async function PATCH(request: Request, context: CowEvaluationEntryRouteContext) {
  const { entryId, evaluationId, farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const parsed = cowEvaluationEntrySchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return zodError(parsed.error.flatten().fieldErrors);
  }

  const existing = await getCowEvaluationEntryById(getDb(), farmId, evaluationId, entryId);

  if (!existing) {
    return apiError(404, "not_found", "Lancamento nao encontrado.");
  }

  const updated = await updateCowEvaluationEntry(getDb(), farmId, evaluationId, entryId, parsed.data);

  if (updated.conflict) {
    return apiError(409, "entry_conflict", "Ja existe lancamento para esta data e fase.");
  }

  return apiOk({ id: updated.record?.id ?? entryId });
}

export async function DELETE(request: Request, context: CowEvaluationEntryRouteContext) {
  const { entryId, evaluationId, farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const deleted = await deleteCowEvaluationEntry(getDb(), farmId, evaluationId, entryId);

  if (!deleted) {
    return apiError(404, "not_found", "Lancamento nao encontrado.");
  }

  return apiOk({ id: entryId });
}
