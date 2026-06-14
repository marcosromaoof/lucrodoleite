import { getDb } from "@/db/client";
import { requireApiFarmAccess } from "@/lib/api/farm-access";
import { apiOk, zodError } from "@/lib/api/responses";
import { createFeedBrand, listFeedBrands } from "@/lib/repositories/feed-brands";
import { feedBrandSchema } from "@/lib/validations/feed-brand";

export const runtime = "nodejs";

type FeedBrandsRouteContext = {
  params: Promise<{
    farmId: string;
  }>;
};

export async function GET(request: Request, context: FeedBrandsRouteContext) {
  const { farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const records = await listFeedBrands(getDb(), farmId);

  return apiOk({ records });
}

export async function POST(request: Request, context: FeedBrandsRouteContext) {
  const { farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const parsed = feedBrandSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return zodError(parsed.error.flatten().fieldErrors);
  }

  const created = await createFeedBrand(getDb(), {
    ...parsed.data,
    farmId,
  });

  return apiOk({ id: created?.id }, 201);
}
