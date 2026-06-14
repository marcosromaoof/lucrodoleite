import { z } from "zod";

export const expenseCategories = [
  "Ração",
  "Sal mineral",
  "Medicamentos",
  "Veterinário",
  "Energia",
  "Combustível",
  "Mão de obra",
  "Manutenção",
  "Transporte",
  "Outras despesas",
] as const;

export const expenseQuantityEligibleCategories = [
  expenseCategories[0],
  expenseCategories[1],
  expenseCategories[2],
  expenseCategories[5],
  expenseCategories[8],
] as const;

export const expenseUnits = ["kg", "saco", "un", "litro", "viagem"] as const;

export const expenseSchema = z
  .object({
    date: z.iso.date(),
    referenceMonth: z.string().regex(/^\d{4}-\d{2}$/),
    category: z.enum(expenseCategories),
    supplier: z.string().max(120).optional(),
    description: z.string().min(1).max(240),
    amount: z.number().finite().min(0, "Despesa nao pode ser negativa.").optional(),
    quantity: z.number().finite().positive("Quantidade precisa ser maior que zero.").optional(),
    unit: z.string().trim().max(30).optional(),
    unitPrice: z.number().finite().min(0, "Valor unitario nao pode ser negativo.").optional(),
    feedBrandId: z.uuid().optional(),
    feedTestId: z.uuid().optional(),
  })
  .superRefine((value, context) => {
    const eligible = isExpenseQuantityEligible(value.category);
    const hasQuantityFields =
      value.quantity !== undefined || value.unit !== undefined || value.unitPrice !== undefined;

    if (!eligible && hasQuantityFields) {
      context.addIssue({
        code: "custom",
        message: "Quantidade e unidade so podem ser usadas em categorias elegiveis.",
        path: ["quantity"],
      });
    }

    if (eligible && hasQuantityFields && !value.unit) {
      context.addIssue({
        code: "custom",
        message: "Informe a unidade da despesa.",
        path: ["unit"],
      });
    }

    if (value.amount === undefined && !(eligible && value.quantity !== undefined && value.unitPrice !== undefined)) {
      context.addIssue({
        code: "custom",
        message: "Informe o valor total ou quantidade com valor unitario.",
        path: ["amount"],
      });
    }
  });

export type ExpenseInput = z.infer<typeof expenseSchema>;

export type NormalizedExpenseInput = Omit<ExpenseInput, "amount" | "quantity" | "unitPrice"> & {
  amount: number;
  quantity?: number;
  unitPrice?: number;
};

export function isExpenseQuantityEligible(category: string) {
  return expenseQuantityEligibleCategories.includes(category as (typeof expenseQuantityEligibleCategories)[number]);
}

export function normalizeExpenseInput(input: ExpenseInput): NormalizedExpenseInput {
  const eligible = isExpenseQuantityEligible(input.category);
  const amount =
    eligible && input.quantity !== undefined && input.unitPrice !== undefined
      ? input.quantity * input.unitPrice
      : input.amount ?? 0;
  const unitPrice =
    eligible && input.unitPrice === undefined && input.quantity !== undefined && input.quantity > 0
      ? amount / input.quantity
      : input.unitPrice;

  return {
    ...input,
    amount: roundCurrency(amount),
    quantity: eligible ? input.quantity : undefined,
    unit: eligible ? input.unit : undefined,
    unitPrice: unitPrice === undefined ? undefined : roundDecimal(unitPrice, 4),
  };
}

function roundCurrency(value: number) {
  return roundDecimal(value, 2);
}

function roundDecimal(value: number, digits: number) {
  const factor = 10 ** digits;

  return Math.round((value + Number.EPSILON) * factor) / factor;
}
