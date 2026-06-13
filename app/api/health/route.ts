import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/database/health";
import { isDatabaseConfigured } from "@/lib/app/environment";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        status: "missing_database_url",
        message: "DATABASE_URL nao configurada.",
      },
      { status: 503 },
    );
  }

  try {
    const result = await checkDatabaseHealth();

    if (!result.schemaReady) {
      return NextResponse.json(
        {
          ok: false,
          status: "database_schema_pending",
          latencyMs: result.latencyMs,
          requiredTables: result.requiredTables,
          missingTables: result.missingTables,
          message: "Banco conectado, mas as migrations ainda nao foram aplicadas.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      status: "database_ready",
      latencyMs: result.latencyMs,
      requiredTables: result.requiredTables,
      missingTables: result.missingTables,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        status: "database_error",
        message: "Nao foi possivel conectar ao banco.",
      },
      { status: 503 },
    );
  }
}
