import { getDb } from "@/db/client";
import { requireApiUser } from "@/lib/api/farm-access";
import { apiOk, zodError } from "@/lib/api/responses";
import { createFarmForOwner, listFarmsForUser } from "@/lib/repositories/farms";
import { farmSchema } from "@/lib/validations/farm";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authResult = await requireApiUser(request);

  if (authResult.error) {
    return authResult.error;
  }

  const farms = await listFarmsForUser(getDb(), authResult.user.id);

  return apiOk({ farms });
}

export async function POST(request: Request) {
  const authResult = await requireApiUser(request);

  if (authResult.error) {
    return authResult.error;
  }

  const parsed = farmSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return zodError(parsed.error.flatten().fieldErrors);
  }

  const created = await createFarmForOwner(getDb(), parsed.data, authResult.user.id);

  return apiOk({ id: created?.id }, 201);
}
