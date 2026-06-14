import { getDb } from "@/db/client";
import { requireApiFarmAccess } from "@/lib/api/farm-access";
import { apiError, apiOk, zodError } from "@/lib/api/responses";
import {
  createCowEvaluationEntry,
  getCowEvaluationById,
  listCowEvaluationEntries,
} from "@/lib/repositories/cows";
import { cowEvaluationEntrySchema } from "@/lib/validations/cow";

export const runtime = "nodejs";

type CowEvaluationEntriesRouteContext = {
  params: Promise<{
    evaluationId: string;
    farmId: string;
  }>;
};

export async function GET(request: Request, context: CowEvaluationEntriesRouteContext) {
  const { evaluationId, farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const evaluation = await getCowEvaluationById(getDb(), farmId, evaluationId);

  if (!evaluation) {
    return apiError(404, "not_found", "Avaliacao nao encontrada.");
  }

  const records = await listCowEvaluationEntries(getDb(), farmId, evaluationId);

  return apiOk({ records });
}

export async function POST(request: Request, context: CowEvaluationEntriesRouteContext) {
  const { evaluationId, farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const parsed = cowEvaluationEntrySchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return zodError(parsed.error.flatten().fieldErrors);
  }

  const created = await createCowEvaluationEntry(getDb(), {
    ...parsed.data,
    createdBy: access.user.id,
    evaluationId,
    farmId,
  });

  if (created.conflict) {
    return apiError(409, "entry_conflict", "Ja existe lancamento para esta data e fase.");
  }

  if (!created.record) {
    return apiError(404, "not_found", "Avaliacao nao encontrada.");
  }

  return apiOk({ id: created.record.id }, 201);
}
