import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { getMissingApplicationTables, requiredApplicationTables } from "@/lib/database/schema-health";

export async function checkDatabaseHealth() {
  const startedAt = Date.now();
  const db = getDb();
  await db.execute(sql`select 1 as ok`);
  const tablesResult = await db.execute<{ table_name: string }>(sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
  `);
  const existingTables = tablesResult.rows.map((row) => row.table_name);
  const missingTables = getMissingApplicationTables(existingTables);

  return {
    ok: true,
    schemaReady: missingTables.length === 0,
    latencyMs: Date.now() - startedAt,
    requiredTables: requiredApplicationTables.length,
    missingTables,
  };
}
