import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import writeXlsxFile from "write-excel-file/node";
import { auth } from "@/auth";
import { getDb } from "@/db/client";
import { isDatabaseConfigured } from "@/lib/app/environment";
import { calculateMonthlyEstimate } from "@/lib/calculations/financial";
import { formatReferenceMonth, getMonthDateRange, getTodayDateKey } from "@/lib/dates/month";
import { formatCurrency, formatLiters } from "@/lib/formatters/number";
import { getMonthlyExpenseSummaryByReferenceMonth, listExpensesByReferenceMonth } from "@/lib/repositories/expenses";
import { getFarmForUser } from "@/lib/repositories/farms";
import { listFeedBrands } from "@/lib/repositories/feed-brands";
import { listFeedTestResults } from "@/lib/repositories/feed-tests";
import { getMonthlyClosing } from "@/lib/repositories/monthly-closings";
import { createReportExport } from "@/lib/repositories/report-exports";
import { getMonthlyProductionSummary, listProductionsByMonth } from "@/lib/repositories/production";
import { reportExportSchema, reportFormatLabels, reportTypeLabels } from "@/lib/validations/report-export";

export const runtime = "nodejs";

type ReportColumn = {
  header: string;
  key: string;
};

type ReportRow = Record<string, number | string | null>;

type ReportData = {
  columns: ReportColumn[];
  rows: ReportRow[];
  subtitle: string;
  title: string;
};

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

  const range = getMonthDateRange(parsed.data.referenceMonth);
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
      headers: downloadHeaders(
        fileName,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ),
    });
  }

  const pdf = renderPdf(report);

  return new Response(pdf, {
    headers: downloadHeaders(fileName, "application/pdf"),
  });
}

async function buildReportData(input: {
  farmId: string;
  farmName: string;
  farmPricePerLiter: number;
  referenceEnd: string;
  referenceMonth: string;
  referenceStart: string;
  type: keyof typeof reportTypeLabels;
}): Promise<ReportData> {
  const db = getDb();
  const subtitle = `${input.farmName} | ${formatReferenceMonth(input.referenceMonth)}`;
  const title = reportTypeLabels[input.type];

  if (input.type === "production") {
    const productions = await listProductionsByMonth(db, input.farmId, input.referenceStart, input.referenceEnd);

    return {
      columns: [
        { header: "Data", key: "date" },
        { header: "Litros", key: "liters" },
        { header: "Vacas em lactação", key: "lactatingCows" },
        { header: "Lote", key: "batchName" },
        { header: "Observação", key: "notes" },
      ],
      rows: productions
        .sort((left, right) => left.date.localeCompare(right.date))
        .map((item) => ({
          batchName: item.batchName,
          date: item.date,
          lactatingCows: item.lactatingCows,
          liters: item.liters,
          notes: item.notes,
        })),
      subtitle,
      title,
    };
  }

  if (input.type === "expenses") {
    const expenses = await listExpensesByReferenceMonth(db, input.farmId, input.referenceMonth);

    return {
      columns: [
        { header: "Data", key: "date" },
        { header: "Mês de referência", key: "referenceMonth" },
        { header: "Categoria", key: "category" },
        { header: "Fornecedor", key: "supplier" },
        { header: "Descrição", key: "description" },
        { header: "Valor", key: "amount" },
      ],
      rows: expenses
        .sort((left, right) => left.date.localeCompare(right.date))
        .map((item) => ({
          amount: item.amount,
          category: item.category,
          date: item.date,
          description: item.description,
          referenceMonth: item.referenceMonth,
          supplier: item.supplier,
        })),
      subtitle,
      title,
    };
  }

  if (input.type === "feed-brands") {
    const brands = await listFeedBrands(db, input.farmId);

    return {
      columns: [
        { header: "Marca", key: "name" },
        { header: "Fabricante", key: "manufacturer" },
        { header: "Proteína (%)", key: "proteinPercent" },
        { header: "Saco (kg)", key: "bagWeightKg" },
        { header: "Preço do saco", key: "pricePerBag" },
        { header: "Preço por kg", key: "pricePerKg" },
      ],
      rows: brands.map((item) => ({
        bagWeightKg: item.bagWeightKg,
        manufacturer: item.manufacturer,
        name: item.name,
        pricePerBag: item.pricePerBag,
        pricePerKg: item.pricePerKg,
        proteinPercent: item.proteinPercent,
      })),
      subtitle,
      title,
    };
  }

  if (input.type === "feed-tests") {
    const tests = await listFeedTestResults(db, input.farmId, 100);

    return {
      columns: [
        { header: "Teste", key: "testName" },
        { header: "Ração", key: "label" },
        { header: "Início", key: "startDate" },
        { header: "Fim", key: "endDate" },
        { header: "Média antes", key: "baselineDailyLiters" },
        { header: "Média no teste", key: "averageDailyLiters" },
        { header: "Aumento diário", key: "extraDailyLiters" },
        { header: "Receita extra", key: "extraRevenue" },
        { header: "Custo", key: "feedCostTotal" },
        { header: "Lucro adicional", key: "additionalProfit" },
        { header: "Conclusão", key: "conclusion" },
      ],
      rows: tests.map((item) => ({
        additionalProfit: item.additionalProfit,
        averageDailyLiters: item.averageDailyLiters,
        baselineDailyLiters: item.baselineDailyLiters,
        conclusion: item.conclusion,
        endDate: item.endDate,
        extraDailyLiters: item.extraDailyLiters,
        extraRevenue: item.extraRevenue,
        feedCostTotal: item.feedCostTotal,
        label: item.label,
        startDate: item.startDate,
        testName: item.testName,
      })),
      subtitle,
      title,
    };
  }

  if (input.type === "closing") {
    const closing = await getMonthlyClosing(db, input.farmId, input.referenceMonth);

    return {
      columns: [
        { header: "Indicador", key: "metric" },
        { header: "Valor", key: "value" },
      ],
      rows: closing
        ? [
            { metric: "Litros apurados", value: formatLiters(closing.totalLiters) },
            { metric: "Valor total da nota", value: formatCurrency(closing.milkInvoiceAmount) },
            { metric: "Preço real por litro", value: formatCurrency(closing.realPricePerLiter) },
            { metric: "Despesa com ração", value: formatCurrency(closing.totalFeedAmount) },
            { metric: "Despesas totais", value: formatCurrency(closing.totalExpenses) },
            { metric: "Custo total por litro", value: formatCurrency(closing.totalCostPerLiter) },
            { metric: "Resultado líquido por litro", value: formatCurrency(closing.netResultPerLiter) },
            { metric: "Lucro líquido", value: formatCurrency(closing.netProfit) },
          ]
        : [],
      subtitle,
      title,
    };
  }

  const [productionSummary, expenseSummary] = await Promise.all([
    getMonthlyProductionSummary(db, input.farmId, input.referenceStart, input.referenceEnd, getTodayDateKey()),
    getMonthlyExpenseSummaryByReferenceMonth(db, input.farmId, input.referenceMonth),
  ]);
  const estimate = calculateMonthlyEstimate({
    estimatedPricePerLiter: input.farmPricePerLiter,
    totalExpenses: expenseSummary.totalAmount,
    totalLiters: productionSummary.totalLiters,
  });

  return {
    columns: [
      { header: "Indicador", key: "metric" },
      { header: "Valor", key: "value" },
    ],
    rows: [
      { metric: "Dias com produção", value: productionSummary.recordCount },
      { metric: "Litros no mês", value: formatLiters(productionSummary.totalLiters) },
      { metric: "Preço padrão por litro", value: formatCurrency(input.farmPricePerLiter) },
      { metric: "Despesas totais", value: formatCurrency(expenseSummary.totalAmount) },
      { metric: "Despesa com ração", value: formatCurrency(expenseSummary.feedAmount) },
      { metric: "Receita estimada", value: formatCurrency(estimate.estimatedRevenue) },
      { metric: "Lucro estimado", value: formatCurrency(estimate.estimatedProfit) },
      { metric: "Resultado estimado por litro", value: formatCurrency(estimate.estimatedResultPerLiter) },
    ],
    subtitle,
    title,
  };
}

function renderCsv(report: ReportData) {
  const header = report.columns.map((column) => escapeCsv(column.header)).join(";");
  const body = report.rows.map((row) =>
    report.columns.map((column) => escapeCsv(row[column.key])).join(";"),
  );

  return ["\uFEFF" + header, ...body].join("\r\n");
}

async function renderXlsx(report: ReportData) {
  const rows = [
    report.columns.map((column) => column.header),
    ...report.rows.map((row) => report.columns.map((column) => normalizeCell(row[column.key]))),
  ];
  const workbook = writeXlsxFile(rows, {
    sheet: "Relatório",
  });

  const buffer = await workbook.toBuffer();

  return toArrayBuffer(buffer);
}

function renderPdf(report: ReportData) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(report.title, 40, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(report.subtitle, 40, 60);

  autoTable(doc, {
    body: report.rows.map((row) => report.columns.map((column) => String(normalizeCell(row[column.key])))),
    head: [report.columns.map((column) => column.header)],
    headStyles: { fillColor: [13, 77, 45], textColor: 255 },
    margin: { left: 40, right: 40 },
    startY: 78,
    styles: { fontSize: 8 },
    theme: "grid",
  });

  return doc.output("arraybuffer") as ArrayBuffer;
}

function renderHtml(report: ReportData) {
  const emptyRow =
    report.rows.length === 0
      ? `<tr><td colspan="${report.columns.length}">Nenhum registro encontrado.</td></tr>`
      : "";
  const rows = report.rows
    .map(
      (row) =>
        `<tr>${report.columns
          .map((column) => `<td>${escapeHtml(String(normalizeCell(row[column.key])))}</td>`)
          .join("")}</tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(report.title)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #20241f; margin: 32px; }
    h1 { color: #0d4d2d; margin-bottom: 4px; }
    p { color: #667064; margin-top: 0; }
    table { border-collapse: collapse; width: 100%; margin-top: 24px; }
    th { background: #0d4d2d; color: white; text-align: left; }
    th, td { border: 1px solid #d8d1c1; padding: 8px; font-size: 13px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(report.title)}</h1>
  <p>${escapeHtml(report.subtitle)}</p>
  <table>
    <thead>
      <tr>${report.columns.map((column) => `<th>${escapeHtml(column.header)}</th>`).join("")}</tr>
    </thead>
    <tbody>${rows}${emptyRow}</tbody>
  </table>
</body>
</html>`;
}

function downloadHeaders(fileName: string, contentType: string) {
  return {
    "Content-Disposition": `attachment; filename="${fileName}"`,
    "Content-Type": contentType,
  };
}

function buildFileName(title: string, referenceMonth: string, format: keyof typeof reportFormatLabels) {
  return `${slug(title)}-${referenceMonth}.${format}`;
}

function slug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function escapeCsv(value: number | string | null | undefined) {
  const text = String(normalizeCell(value));

  if (/[;"\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeCell(value: number | string | null | undefined) {
  return value ?? "";
}

function toArrayBuffer(buffer: Buffer) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}
