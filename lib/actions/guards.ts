import { auth } from "@/auth";
import { getDb } from "@/db/client";
import { isAuthConfigured, isDatabaseConfigured } from "@/lib/app/environment";
import { userCanAccessFarm } from "@/lib/repositories/farms";
import { syncFarmMembershipsForEmail } from "@/lib/repositories/user-access";
import type { ActionState } from "./action-state";

export type AuthenticatedActionUser = {
  email?: string | null;
  id: string;
  name?: string | null;
};

export function requireDatabaseConfigured(): ActionState | null {
  if (isDatabaseConfigured()) {
    return null;
  }

  return {
    ok: false,
    message: "DATABASE_URL nao configurada. Conecte o Neon Postgres antes de gravar dados.",
  };
}

export async function requireAuthenticatedUser(): Promise<
  { error: ActionState; user: null } | { error: null; user: AuthenticatedActionUser }
> {
  if (!isAuthConfigured()) {
    return {
      error: {
        ok: false,
        message: "Autenticacao indisponivel. Configure AUTH_SECRET.",
      },
      user: null,
    };
  }

  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        error: {
          ok: false,
          message: "Faca login para continuar.",
        },
        user: null,
      };
    }

    if (isDatabaseConfigured()) {
      await syncFarmMembershipsForEmail(getDb(), {
        email: session.user.email,
        userId,
      });
    }

    return {
      error: null,
      user: {
        email: session.user.email,
        id: userId,
        name: session.user.name,
      },
    };
  } catch {
    return {
      error: {
        ok: false,
        message: "Autenticacao indisponivel. Confira as variaveis AUTH_*.",
      },
      user: null,
    };
  }
}

export async function requireAuthenticatedFarmAccess(farmId: string): Promise<
  { error: ActionState; user: null } | { error: null; user: AuthenticatedActionUser }
> {
  const databaseGuard = requireDatabaseConfigured();

  if (databaseGuard) {
    return { error: databaseGuard, user: null };
  }

  const authGuard = await requireAuthenticatedUser();

  if (authGuard.error) {
    return authGuard;
  }

  const hasAccess = await userCanAccessFarm(getDb(), farmId, authGuard.user.id);

  if (!hasAccess) {
    return {
      error: {
        ok: false,
        message: "Voce nao tem acesso a esta fazenda.",
      },
      user: null,
    };
  }

  return authGuard;
}
