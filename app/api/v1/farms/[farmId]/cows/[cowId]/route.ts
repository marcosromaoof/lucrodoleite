import { getDb } from "@/db/client";
import { requireApiFarmAccess } from "@/lib/api/farm-access";
import { apiError, apiOk, zodError } from "@/lib/api/responses";
import { deleteCow, getCowById, updateCow } from "@/lib/repositories/cows";
import { cowSchema } from "@/lib/validations/cow";

export const runtime = "nodejs";

type CowRouteContext = {
  params: Promise<{
    cowId: string;
    farmId: string;
  }>;
};

export async function GET(request: Request, context: CowRouteContext) {
  const { cowId, farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const cow = await getCowById(getDb(), farmId, cowId);

  if (!cow) {
    return apiError(404, "not_found", "Vaca nao encontrada.");
  }

  return apiOk({ cow });
}

export async function PATCH(request: Request, context: CowRouteContext) {
  const { cowId, farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const parsed = cowSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return zodError(parsed.error.flatten().fieldErrors);
  }

  const updated = await updateCow(getDb(), farmId, cowId, parsed.data);

  if (updated.conflict) {
    return apiError(409, "cow_conflict", "Ja existe uma vaca com esta identificacao.");
  }

  if (!updated.record) {
    return apiError(404, "not_found", "Vaca nao encontrada.");
  }

  return apiOk({ id: updated.record.id });
}

export async function DELETE(request: Request, context: CowRouteContext) {
  const { cowId, farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const result = await deleteCow(getDb(), farmId, cowId);

  if (!result.deleted) {
    return apiError(result.reason?.includes("avalia") ? 409 : 404, "delete_blocked", result.reason ?? "Vaca nao encontrada.");
  }

  return apiOk({ id: cowId });
}
