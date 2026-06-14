import { getDb } from "@/db/client";
import { requireApiFarmAccess } from "@/lib/api/farm-access";
import { apiOk, zodError } from "@/lib/api/responses";
import { summarizeCowEvaluation } from "@/lib/calculations/cow-evaluation";
import {
  createCowEvaluation,
  listCowEvaluationEntriesByFarm,
  listCowEvaluations,
} from "@/lib/repositories/cows";
import { cowEvaluationSchema } from "@/lib/validations/cow";

export const runtime = "nodejs";

type CowEvaluationsRouteContext = {
  params: Promise<{
    farmId: string;
  }>;
};

export async function GET(request: Request, context: CowEvaluationsRouteContext) {
  const { farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const [records, entries] = await Promise.all([
    listCowEvaluations(getDb(), farmId),
    listCowEvaluationEntriesByFarm(getDb(), farmId),
  ]);
  const entriesByEvaluation = new Map<string, typeof entries>();

  for (const entry of entries) {
    entriesByEvaluation.set(entry.evaluationId, [...(entriesByEvaluation.get(entry.evaluationId) ?? []), entry]);
  }

  return apiOk({
    records: records.map((record) => ({
      ...record,
      summary: summarizeCowEvaluation(entriesByEvaluation.get(record.id) ?? [], record.milkPricePerLiter),
    })),
  });
}

export async function POST(request: Request, context: CowEvaluationsRouteContext) {
  const { farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const parsed = cowEvaluationSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return zodError(parsed.error.flatten().fieldErrors);
  }

  const created = await createCowEvaluation(getDb(), {
    ...parsed.data,
    createdBy: access.user.id,
    farmId,
  });

  if (!created) {
    return zodError({ cowId: ["Vaca nao encontrada para esta fazenda."] });
  }

  return apiOk({ id: created.id }, 201);
}
