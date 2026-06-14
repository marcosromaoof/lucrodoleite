import { z } from "zod";

export const reportTypes = [
  "production",
  "expenses",
  "closing",
  "feed-brands",
  "feed-tests",
  "cow-evaluations",
  "monthly-summary",
] as const;

export const reportFormats = ["pdf", "csv", "xlsx", "html", "json"] as const;

export const reportTypeLabels: Record<(typeof reportTypes)[number], string> = {
  closing: "Fechamento mensal",
  expenses: "Despesas por categoria",
  "feed-brands": "Marcas de ração",
  "feed-tests": "Testes de ração",
  "cow-evaluations": "Avaliações vaca a vaca",
  "monthly-summary": "Resumo mensal",
  production: "Produção diária",
};

export const reportFormatLabels: Record<(typeof reportFormats)[number], string> = {
  csv: "CSV",
  html: "HTML",
  json: "JSON",
  pdf: "PDF",
  xlsx: "XLSX",
};

export const reportExportSchema = z.object({
  farmId: z.uuid("Fazenda inválida."),
  format: z.enum(reportFormats),
  referenceMonth: z.string().regex(/^\d{4}-\d{2}$/, "Informe um mês válido."),
  type: z.enum(reportTypes),
});
