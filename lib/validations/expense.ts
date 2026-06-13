import { z } from "zod";

export const expenseCategories = [
  "Racao",
  "Sal mineral",
  "Medicamentos",
  "Veterinario",
  "Energia",
  "Combustivel",
  "Mao de obra",
  "Manutencao",
  "Transporte",
  "Outras despesas",
] as const;

export const expenseSchema = z.object({
  date: z.iso.date(),
  referenceMonth: z.string().regex(/^\d{4}-\d{2}$/),
  category: z.enum(expenseCategories),
  supplier: z.string().max(120).optional(),
  description: z.string().min(1).max(240),
  amount: z.number().finite().min(0, "Despesa nao pode ser negativa."),
  feedBrandId: z.uuid().optional(),
  feedTestId: z.uuid().optional(),
});
