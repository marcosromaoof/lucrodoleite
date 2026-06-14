import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/db/client";
import { isDatabaseConfigured } from "@/lib/app/environment";
import { getCycleDateRange } from "@/lib/dates/month";
import { getFarmForUser } from "@/lib/repositories/farms";
import { createReportExport } from "@/lib/repositories/report-exports";
import {
  buildFileName,
  buildReportData,
  downloadHeaders,
  renderCsv,
  renderHtml,
  renderPdf,
  renderXlsx,
} from "@/lib/reports/export";
import { reportExportSchema } from "@/lib/validations/report-export";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, message: "DATABASE_URL não configurada." }, { status: 503 });
  }

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ ok: false, message: "Faca login para exportar relatorios." }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = reportExportSchema.safeParse({
    farmId: url.searchParams.get("farmId") ?? "",
    format: url.searchParams.get("format") ?? "",
    referenceMonth: url.searchParams.get("referenceMonth") ?? "",
    type: url.searchParams.get("type") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        fieldErrors: parsed.error.flatten().fieldErrors,
        message: "Parâmetros do relatório inválidos.",
      },
      { status: 400 },
    );
  }

  const db = getDb();
  const farm = await getFarmForUser(db, parsed.data.farmId, userId);

  if (!farm) {
    return NextResponse.json({ ok: false, message: "Voce nao tem acesso a esta fazenda." }, { status: 403 });
  }

  const range = getCycleDateRange(parsed.data.referenceMonth, farm.closingCycleStartDay, farm.closingCycleEndDay);
  const report = await buildReportData({
    farmName: farm.name,
    farmPricePerLiter: farm.defaultPricePerLiter ?? 0,
    farmId: parsed.data.farmId,
    referenceMonth: parsed.data.referenceMonth,
    referenceStart: range.startDate,
    referenceEnd: range.endDate,
    type: parsed.data.type,
  });
  const fileName = buildFileName(report.title, parsed.data.referenceMonth, parsed.data.format);

  await createReportExport(db, {
    farmId: parsed.data.farmId,
    fileName,
    format: parsed.data.format,
    generatedBy: userId,
    referenceEnd: range.endDate,
    referenceStart: range.startDate,
    type: parsed.data.type,
  });

  if (parsed.data.format === "json") {
    return Response.json(
      {
        generatedAt: new Date().toISOString(),
        report,
      },
      { headers: downloadHeaders(fileName, "application/json; charset=utf-8") },
    );
  }

  if (parsed.data.format === "html") {
    return new Response(renderHtml(report), {
      headers: downloadHeaders(fileName, "text/html; charset=utf-8"),
    });
  }

  if (parsed.data.format === "csv") {
    return new Response(renderCsv(report), {
      headers: downloadHeaders(fileName, "text/csv; charset=utf-8"),
    });
  }

  if (parsed.data.format === "xlsx") {
    const xlsx = await renderXlsx(report);

    return new Response(xlsx, {
      headers: downloadHeaders(fileName, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    });
  }

  return new Response(renderPdf(report), {
    headers: downloadHeaders(fileName, "application/pdf"),
  });
}
