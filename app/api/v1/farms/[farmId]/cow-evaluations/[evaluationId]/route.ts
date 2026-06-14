import { getDb } from "@/db/client";
import { requireApiFarmAccess } from "@/lib/api/farm-access";
import { apiError, apiOk, zodError } from "@/lib/api/responses";
import { summarizeCowEvaluation } from "@/lib/calculations/cow-evaluation";
import {
  deleteCowEvaluation,
  getCowEvaluationById,
  listCowEvaluationEntries,
  updateCowEvaluation,
} from "@/lib/repositories/cows";
import { cowEvaluationSchema } from "@/lib/validations/cow";

export const runtime = "nodejs";

type CowEvaluationRouteContext = {
  params: Promise<{
    evaluationId: string;
    farmId: string;
  }>;
};

export async function GET(request: Request, context: CowEvaluationRouteContext) {
  const { evaluationId, farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const [evaluation, entries] = await Promise.all([
    getCowEvaluationById(getDb(), farmId, evaluationId),
    listCowEvaluationEntries(getDb(), farmId, evaluationId),
  ]);

  if (!evaluation) {
    return apiError(404, "not_found", "Avaliacao nao encontrada.");
  }

  return apiOk({
    entries,
    evaluation,
    summary: summarizeCowEvaluation(entries, evaluation.milkPricePerLiter),
  });
}

export async function PATCH(request: Request, context: CowEvaluationRouteContext) {
  const { evaluationId, farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const parsed = cowEvaluationSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return zodError(parsed.error.flatten().fieldErrors);
  }

  const updated = await updateCowEvaluation(getDb(), farmId, evaluationId, parsed.data);

  if (!updated) {
    return apiError(404, "not_found", "Avaliacao ou vaca nao encontrada.");
  }

  return apiOk({ id: updated.id });
}

export async function DELETE(request: Request, context: CowEvaluationRouteContext) {
  const { evaluationId, farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const deleted = await deleteCowEvaluation(getDb(), farmId, evaluationId);

  if (!deleted) {
    return apiError(404, "not_found", "Avaliacao nao encontrada.");
  }

  return apiOk({ id: evaluationId });
}
