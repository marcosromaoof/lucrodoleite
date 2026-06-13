import { z } from "zod";

export const monthlyClosingSchema = z.object({
  referenceMonth: z.string().regex(/^\d{4}-\d{2}$/, "Informe um mês válido."),
  milkInvoiceAmount: z.number().finite().min(0, "Valor da nota não pode ser negativo."),
});
