import { getDb } from "@/db/client";
import { requireApiFarmAccess } from "@/lib/api/farm-access";
import { apiError, apiOk, zodError } from "@/lib/api/responses";
import { deleteFeedBrand, getFeedBrandById, updateFeedBrand } from "@/lib/repositories/feed-brands";
import { feedBrandSchema } from "@/lib/validations/feed-brand";

export const runtime = "nodejs";

type FeedBrandItemRouteContext = {
  params: Promise<{
    farmId: string;
    feedBrandId: string;
  }>;
};

export async function PATCH(request: Request, context: FeedBrandItemRouteContext) {
  const { farmId, feedBrandId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const parsed = feedBrandSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return zodError(parsed.error.flatten().fieldErrors);
  }

  const existing = await getFeedBrandById(getDb(), farmId, feedBrandId);

  if (!existing) {
    return apiError(404, "not_found", "Marca de racao nao encontrada.");
  }

  const updated = await updateFeedBrand(getDb(), farmId, feedBrandId, parsed.data);

  return apiOk({ id: updated?.id ?? feedBrandId });
}

export async function DELETE(request: Request, context: FeedBrandItemRouteContext) {
  const { farmId, feedBrandId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const result = await deleteFeedBrand(getDb(), farmId, feedBrandId);

  if (!result.deleted) {
    return apiError(409, "linked_records", result.reason ?? "Marca de racao possui vinculos.");
  }

  return apiOk({ id: feedBrandId });
}
