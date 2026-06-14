import { getDb } from "@/db/client";
import { requireApiFarmAccess } from "@/lib/api/farm-access";
import { apiError, apiOk, zodError } from "@/lib/api/responses";
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

type ReportExportRouteContext = {
  params: Promise<{
    farmId: string;
  }>;
};

export async function GET(request: Request, context: ReportExportRouteContext) {
  const { farmId } = await context.params;
  const access = await requireApiFarmAccess(request, farmId);

  if (access.error) {
    return access.error;
  }

  const url = new URL(request.url);
  const parsed = reportExportSchema.safeParse({
    farmId,
    format: url.searchParams.get("format") ?? "",
    referenceMonth: url.searchParams.get("referenceMonth") ?? "",
    type: url.searchParams.get("type") ?? "",
  });

  if (!parsed.success) {
    return zodError(parsed.error.flatten().fieldErrors);
  }

  const db = getDb();
  const farm = await getFarmForUser(db, farmId, access.user.id);

  if (!farm) {
    return apiError(403, "forbidden", "Voce nao tem acesso a esta fazenda.");
  }

  const range = getCycleDateRange(
    parsed.data.referenceMonth,
    farm.closingCycleStartDay,
    farm.closingCycleEndDay,
  );
  const report = await buildReportData({
    farmId,
    farmName: farm.name,
    farmPricePerLiter: farm.defaultPricePerLiter ?? 0,
    referenceEnd: range.endDate,
    referenceMonth: parsed.data.referenceMonth,
    referenceStart: range.startDate,
    type: parsed.data.type,
  });
  const fileName = buildFileName(report.title, parsed.data.referenceMonth, parsed.data.format);

  await createReportExport(db, {
    farmId,
    fileName,
    format: parsed.data.format,
    generatedBy: access.user.id,
    referenceEnd: range.endDate,
    referenceStart: range.startDate,
    type: parsed.data.type,
  });

  if (parsed.data.format === "json") {
    return apiOk({
      fileName,
      generatedAt: new Date().toISOString(),
      report,
    });
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
