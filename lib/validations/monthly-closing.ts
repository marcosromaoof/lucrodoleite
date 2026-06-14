import { z } from "zod";

export const monthlyClosingSchema = z
  .object({
    referenceMonth: z.string().regex(/^\d{4}-\d{2}$/, "Informe um mês válido."),
    periodStart: z.iso.date().optional(),
    periodEnd: z.iso.date().optional(),
    milkInvoiceAmount: z.number().finite().min(0, "Valor da nota não pode ser negativo."),
  })
  .refine((value) => !value.periodStart || !value.periodEnd || value.periodEnd >= value.periodStart, {
    message: "A data final precisa ser maior ou igual à inicial.",
    path: ["periodEnd"],
  });
