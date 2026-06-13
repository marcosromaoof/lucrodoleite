import { isDatabaseConfigured } from "@/lib/app/environment";
import type { ActionState } from "./action-state";

export function requireDatabaseConfigured(): ActionState | null {
  if (isDatabaseConfigured()) {
    return null;
  }

  return {
    ok: false,
    message: "DATABASE_URL não configurada. Conecte o Neon Postgres antes de gravar dados.",
  };
}
