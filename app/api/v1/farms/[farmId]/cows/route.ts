import { getDb } from "@/db/client";
import { requireApiFarmAccess } from "@/lib/api/farm-access";
import { apiError, apiOk, zodError } from "@/lib/api/responses";
import { createCow, listCows } from "@/lib/repositories/cows";
import { cowSchema } from "@/lib/validations/cow";

export const runtime = "nodejs";

type CowsRouteContext = {
  params: Promise<{
    farmId: string;
  }>;
};

export async function GET(request: Request, context: CowsRouteContext) {
  const { farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const records = await listCows(getDb(), farmId);

  return apiOk({ records });
}

export async function POST(request: Request, context: CowsRouteContext) {
  const { farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const parsed = cowSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return zodError(parsed.error.flatten().fieldErrors);
  }

  try {
    const created = await createCow(getDb(), {
      ...parsed.data,
      createdBy: access.user.id,
      farmId,
    });

    return apiOk({ id: created?.id }, 201);
  } catch {
    return apiError(409, "cow_conflict", "Nao foi possivel salvar a vaca. Confira se a identificacao ja existe.");
  }
}
