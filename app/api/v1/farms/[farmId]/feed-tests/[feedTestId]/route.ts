import { getDb } from "@/db/client";
import { requireApiFarmAccess } from "@/lib/api/farm-access";
import { apiError, apiOk, zodError } from "@/lib/api/responses";
import { calculateFeedVariant } from "@/lib/calculations/feed";
import { countInclusiveDays } from "@/lib/dates/days";
import { deleteFeedTest, getFeedTestResultById, updateFeedTestResult } from "@/lib/repositories/feed-tests";
import { feedTestSchema } from "@/lib/validations/feed-test";

export const runtime = "nodejs";

type FeedTestItemRouteContext = {
  params: Promise<{
    farmId: string;
    feedTestId: string;
  }>;
};

export async function PATCH(request: Request, context: FeedTestItemRouteContext) {
  const { farmId, feedTestId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const parsed = feedTestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return zodError(parsed.error.flatten().fieldErrors);
  }

  const existing = await getFeedTestResultById(getDb(), farmId, feedTestId);

  if (!existing) {
    return apiError(404, "not_found", "Teste de racao nao encontrado.");
  }

  const days = countInclusiveDays(parsed.data.periodStart, parsed.data.periodEnd);

  if (days <= 0) {
    return apiError(400, "invalid_period", "Periodo do teste invalido.");
  }

  const result = calculateFeedVariant({
    baselineDailyLiters: parsed.data.baselineDailyLiters,
    days,
    feedCostTotal: parsed.data.feedCostTotal,
    label: parsed.data.label,
    milkPricePerLiter: parsed.data.milkPricePerLiter,
    testDailyLiters: parsed.data.testDailyLiters,
  });
  const updated = await updateFeedTestResult(getDb(), {
    ...parsed.data,
    createdBy: access.user.id,
    days,
    farmId,
    id: feedTestId,
    result,
  });

  return apiOk({ id: updated?.id ?? feedTestId, result });
}

export async function DELETE(request: Request, context: FeedTestItemRouteContext) {
  const { farmId, feedTestId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const result = await deleteFeedTest(getDb(), farmId, feedTestId);

  if (!result.deleted) {
    return apiError(409, "linked_records", result.reason ?? "Teste de racao possui vinculos.");
  }

  return apiOk({ id: feedTestId });
}
