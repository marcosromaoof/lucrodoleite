import { getDb } from "@/db/client";
import { isDatabaseConfigured } from "@/lib/app/environment";
import { apiError } from "@/lib/api/responses";
import { authenticateApiRequest, type ApiAuthenticatedUser } from "@/lib/api/auth";
import { userCanAccessFarm } from "@/lib/repositories/farms";

export async function requireApiUser(request: Request): Promise<
  { error: Response; user: null } | { error: null; user: ApiAuthenticatedUser }
> {
  if (!isDatabaseConfigured()) {
    return {
      error: apiError(503, "database_not_configured", "DATABASE_URL nao configurada."),
      user: null,
    };
  }

  return authenticateApiRequest(request);
}

export async function requireApiFarmAccess(
  request: Request,
  farmId: string,
): Promise<{ error: Response; user: null } | { error: null; user: ApiAuthenticatedUser }> {
  const authResult = await requireApiUser(request);

  if (authResult.error) {
    return authResult;
  }

  const hasAccess = await userCanAccessFarm(getDb(), farmId, authResult.user.id);

  if (!hasAccess) {
    return {
      error: apiError(403, "forbidden", "Voce nao tem acesso a esta fazenda."),
      user: null,
    };
  }

  return authResult;
}
