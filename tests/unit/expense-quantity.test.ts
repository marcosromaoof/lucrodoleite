import { describe, expect, it } from "vitest";
import { expenseSchema, normalizeExpenseInput } from "@/lib/validations/expense";

describe("expense quantity fields", () => {
  it("calculates total amount from quantity and unit price for eligible categories", () => {
    const parsed = expenseSchema.parse({
      category: "Ração",
      date: "2026-06-13",
      description: "Compra de ração",
      quantity: 10,
      referenceMonth: "2026-06",
      unit: "saco",
      unitPrice: 123.4567,
    });

    expect(normalizeExpenseInput(parsed)).toMatchObject({
      amount: 1234.57,
      quantity: 10,
      unit: "saco",
      unitPrice: 123.4567,
    });
  });

  it("derives unit price when amount and quantity are provided", () => {
    const parsed = expenseSchema.parse({
      amount: 250,
      category: "Combustível",
      date: "2026-06-13",
      description: "Diesel",
      quantity: 50,
      referenceMonth: "2026-06",
      unit: "litro",
    });

    expect(normalizeExpenseInput(parsed).unitPrice).toBe(5);
  });

  it("rejects quantity fields for categories that are not eligible", () => {
    const parsed = expenseSchema.safeParse({
      amount: 250,
      category: "Energia",
      date: "2026-06-13",
      description: "Conta de energia",
      quantity: 1,
      referenceMonth: "2026-06",
      unit: "un",
    });

    expect(parsed.success).toBe(false);
  });
});
