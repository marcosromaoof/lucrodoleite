import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";

export async function checkDatabaseHealth() {
  const startedAt = Date.now();
  const db = getDb();
  await db.execute(sql`select 1 as ok`);

  return {
    ok: true,
    latencyMs: Date.now() - startedAt,
  };
}
