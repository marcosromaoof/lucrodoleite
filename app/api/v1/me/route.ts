import { getDb } from "@/db/client";
import { requireApiUser } from "@/lib/api/farm-access";
import { apiOk } from "@/lib/api/responses";
import { listFarmsForUser } from "@/lib/repositories/farms";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authResult = await requireApiUser(request);

  if (authResult.error) {
    return authResult.error;
  }

  const farms = await listFarmsForUser(getDb(), authResult.user.id);

  return apiOk({
    farms,
    user: authResult.user,
  });
}
