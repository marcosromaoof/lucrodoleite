import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import writeXlsxFile from "write-excel-file/node";
import { getDb } from "@/db/client";
import { summarizeCowEvaluation } from "@/lib/calculations/cow-evaluation";
import { calculateMonthlyEstimate } from "@/lib/calculations/financial";
import { formatReferenceMonth, getTodayDateKey } from "@/lib/dates/month";
import { formatCurrency, formatLiters } from "@/lib/formatters/number";
import { getMonthlyExpenseSummary, listExpensesByMonth } from "@/lib/repositories/expenses";
import { listFeedBrands } from "@/lib/repositories/feed-brands";
import { listFeedTestResults } from "@/lib/repositories/feed-tests";
import { getMonthlyClosing } from "@/lib/repositories/monthly-closings";
import { getMonthlyProductionSummary, listProductionsByMonth } from "@/lib/repositories/production";
import { listCowEvaluationEntriesByFarm, listCowEvaluations } from "@/lib/repositories/cows";
import { reportFormatLabels, reportTypeLabels } from "@/lib/validations/report-export";

export type ReportColumn = {
  header: string;
  key: string;
};

export type ReportRow = Record<string, number | string | null>;

export type ReportData = {
  columns: ReportColumn[];
  rows: ReportRow[];
  subtitle: string;
  title: string;
};

export async function buildReportData(input: {
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
        { header: "Vacas em lactacao", key: "lactatingCows" },
        { header: "Lote", key: "batchName" },
        { header: "Observacao", key: "notes" },
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
    const expenses = await listExpensesByMonth(db, input.farmId, input.referenceStart, input.referenceEnd);

    return {
      columns: [
        { header: "Data", key: "date" },
        { header: "Mes de referencia", key: "referenceMonth" },
        { header: "Categoria", key: "category" },
        { header: "Fornecedor", key: "supplier" },
        { header: "Descricao", key: "description" },
        { header: "Quantidade", key: "quantity" },
        { header: "Unidade", key: "unit" },
        { header: "Valor unitario", key: "unitPrice" },
        { header: "Valor", key: "amount" },
      ],
      rows: expenses
        .sort((left, right) => left.date.localeCompare(right.date))
        .map((item) => ({
          amount: item.amount,
          category: item.category,
          date: item.date,
          description: item.description,
          quantity: item.quantity,
          referenceMonth: item.referenceMonth,
          supplier: item.supplier,
          unit: item.unit,
          unitPrice: item.unitPrice,
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
        { header: "Proteina (%)", key: "proteinPercent" },
        { header: "Saco (kg)", key: "bagWeightKg" },
        { header: "Preco do saco", key: "pricePerBag" },
        { header: "Preco por kg", key: "pricePerKg" },
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
        { header: "Racao", key: "label" },
        { header: "Inicio", key: "startDate" },
        { header: "Fim", key: "endDate" },
        { header: "Media antes", key: "baselineDailyLiters" },
        { header: "Media no teste", key: "averageDailyLiters" },
        { header: "Aumento diario", key: "extraDailyLiters" },
        { header: "Receita extra", key: "extraRevenue" },
        { header: "Custo", key: "feedCostTotal" },
        { header: "Lucro adicional", key: "additionalProfit" },
        { header: "Conclusao", key: "conclusion" },
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
            { metric: "Periodo", value: `${closing.periodStart} a ${closing.periodEnd}` },
            { metric: "Valor total da nota", value: formatCurrency(closing.milkInvoiceAmount) },
            { metric: "Preco real por litro", value: formatCurrency(closing.realPricePerLiter) },
            { metric: "Despesa com racao", value: formatCurrency(closing.totalFeedAmount) },
            { metric: "Despesa com silagem", value: formatCurrency(closing.totalSilageAmount) },
            { metric: "Despesa com sal mineral", value: formatCurrency(closing.totalMineralAmount) },
            { metric: "Custo de alimentacao", value: formatCurrency(closing.totalNutritionAmount) },
            { metric: "Custo alimentacao por litro", value: formatCurrency(closing.nutritionCostPerLiter) },
            { metric: "Lucro livre apos alimentacao", value: formatCurrency(closing.freeProfitAfterNutrition) },
            { metric: "Despesas totais", value: formatCurrency(closing.totalExpenses) },
            { metric: "Custo total por litro", value: formatCurrency(closing.totalCostPerLiter) },
            { metric: "Resultado liquido por litro", value: formatCurrency(closing.netResultPerLiter) },
            { metric: "Lucro liquido", value: formatCurrency(closing.netProfit) },
          ]
        : [],
      subtitle,
      title,
    };
  }

  if (input.type === "cow-evaluations") {
    const [evaluations, entries] = await Promise.all([
      listCowEvaluations(db, input.farmId),
      listCowEvaluationEntriesByFarm(db, input.farmId),
    ]);
    const entriesByEvaluation = new Map<string, typeof entries>();

    for (const entry of entries) {
      entriesByEvaluation.set(entry.evaluationId, [...(entriesByEvaluation.get(entry.evaluationId) ?? []), entry]);
    }

    return {
      columns: [
        { header: "Avaliacao", key: "evaluation" },
        { header: "Vaca", key: "cow" },
        { header: "Media sem racao", key: "baselineAverage" },
        { header: "Media com racao", key: "testAverage" },
        { header: "Aumento diario", key: "extraDailyLiters" },
        { header: "Custo alimentacao", key: "nutritionCost" },
        { header: "Lucro livre", key: "freeProfitAfterNutrition" },
        { header: "Lucro liquido", key: "netProfit" },
        { header: "Lucro adicional/dia", key: "additionalDailyProfit" },
      ],
      rows: evaluations.map((evaluation) => {
        const summary = summarizeCowEvaluation(entriesByEvaluation.get(evaluation.id) ?? [], evaluation.milkPricePerLiter);

        return {
          additionalDailyProfit: summary.comparison.additionalDailyProfit,
          baselineAverage: summary.baseline.averageDailyLiters,
          cow: `${evaluation.cowIdentification}${evaluation.cowName ? ` - ${evaluation.cowName}` : ""}`,
          evaluation: evaluation.name,
          extraDailyLiters: summary.comparison.extraDailyLiters,
          freeProfitAfterNutrition: summary.total.freeProfitAfterNutrition,
          netProfit: summary.total.netProfit,
          nutritionCost: summary.total.nutritionCost,
          testAverage: summary.test.averageDailyLiters,
        };
      }),
      subtitle,
      title,
    };
  }

  const [productionSummary, expenseSummary] = await Promise.all([
    getMonthlyProductionSummary(db, input.farmId, input.referenceStart, input.referenceEnd, getTodayDateKey()),
    getMonthlyExpenseSummary(db, input.farmId, input.referenceStart, input.referenceEnd),
  ]);
  const estimate = calculateMonthlyEstimate({
    estimatedPricePerLiter: input.farmPricePerLiter,
    totalNutritionAmount: expenseSummary.nutritionAmount,
    totalExpenses: expenseSummary.totalAmount,
    totalLiters: productionSummary.totalLiters,
  });

  return {
    columns: [
      { header: "Indicador", key: "metric" },
      { header: "Valor", key: "value" },
    ],
    rows: [
      { metric: "Dias com producao", value: productionSummary.recordCount },
      { metric: "Litros no mes", value: formatLiters(productionSummary.totalLiters) },
      { metric: "Preco padrao por litro", value: formatCurrency(input.farmPricePerLiter) },
      { metric: "Despesas totais", value: formatCurrency(expenseSummary.totalAmount) },
      { metric: "Despesa com racao", value: formatCurrency(expenseSummary.feedAmount) },
      { metric: "Despesa com silagem", value: formatCurrency(expenseSummary.silageAmount) },
      { metric: "Despesa com sal mineral", value: formatCurrency(expenseSummary.mineralAmount) },
      { metric: "Custo de alimentacao", value: formatCurrency(expenseSummary.nutritionAmount) },
      { metric: "Receita estimada", value: formatCurrency(estimate.estimatedRevenue) },
      { metric: "Lucro livre apos alimentacao", value: formatCurrency(estimate.estimatedFreeProfitAfterNutrition) },
      { metric: "Lucro estimado", value: formatCurrency(estimate.estimatedProfit) },
      { metric: "Resultado estimado por litro", value: formatCurrency(estimate.estimatedResultPerLiter) },
    ],
    subtitle,
    title,
  };
}

export function renderCsv(report: ReportData) {
  const header = report.columns.map((column) => escapeCsv(column.header)).join(";");
  const body = report.rows.map((row) => report.columns.map((column) => escapeCsv(row[column.key])).join(";"));

  return ["\uFEFF" + header, ...body].join("\r\n");
}

export async function renderXlsx(report: ReportData) {
  const rows = [
    report.columns.map((column) => column.header),
    ...report.rows.map((row) => report.columns.map((column) => normalizeCell(row[column.key]))),
  ];
  const workbook = writeXlsxFile(rows, {
    sheet: "Relatorio",
  });
  const buffer = await workbook.toBuffer();

  return toArrayBuffer(buffer);
}

export function renderPdf(report: ReportData) {
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

export function renderHtml(report: ReportData) {
  const emptyRow =
    report.rows.length === 0 ? `<tr><td colspan="${report.columns.length}">Nenhum registro encontrado.</td></tr>` : "";
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

export function downloadHeaders(fileName: string, contentType: string) {
  return {
    "Content-Disposition": `attachment; filename="${fileName}"`,
    "Content-Type": contentType,
  };
}

export function buildFileName(title: string, referenceMonth: string, format: keyof typeof reportFormatLabels) {
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
