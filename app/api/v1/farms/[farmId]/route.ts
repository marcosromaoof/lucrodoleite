import { getDb } from "@/db/client";
import { requireApiFarmAccess } from "@/lib/api/farm-access";
import { apiOk, zodError } from "@/lib/api/responses";
import { farmSchema } from "@/lib/validations/farm";
import { getFarmForUser, updateFarm } from "@/lib/repositories/farms";

export const runtime = "nodejs";

type FarmRouteContext = {
  params: Promise<{
    farmId: string;
  }>;
};

export async function GET(request: Request, context: FarmRouteContext) {
  const { farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const farm = await getFarmForUser(getDb(), farmId, access.user.id);

  return apiOk({ farm });
}

export async function PATCH(request: Request, context: FarmRouteContext) {
  const { farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const parsed = farmSchema.partial().safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return zodError(parsed.error.flatten().fieldErrors);
  }

  const updated = await updateFarm(getDb(), farmId, parsed.data);

  return apiOk({ id: updated?.id ?? farmId });
}
