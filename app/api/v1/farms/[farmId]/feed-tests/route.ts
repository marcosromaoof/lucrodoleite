import { getDb } from "@/db/client";
import { requireApiFarmAccess } from "@/lib/api/farm-access";
import { apiError, apiOk, zodError } from "@/lib/api/responses";
import { calculateFeedVariant } from "@/lib/calculations/feed";
import { countInclusiveDays } from "@/lib/dates/days";
import { createFeedTestResult, listFeedTestResults } from "@/lib/repositories/feed-tests";
import { feedTestSchema } from "@/lib/validations/feed-test";

export const runtime = "nodejs";

type FeedTestsRouteContext = {
  params: Promise<{
    farmId: string;
  }>;
};

export async function GET(request: Request, context: FeedTestsRouteContext) {
  const { farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? 20);
  const records = await listFeedTestResults(getDb(), farmId, Number.isFinite(limit) ? limit : 20);

  return apiOk({ records });
}

export async function POST(request: Request, context: FeedTestsRouteContext) {
  const { farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const parsed = feedTestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return zodError(parsed.error.flatten().fieldErrors);
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
  const created = await createFeedTestResult(getDb(), {
    ...parsed.data,
    createdBy: access.user.id,
    days,
    farmId,
    result,
  });

  return apiOk({ id: created?.id, result }, 201);
}
