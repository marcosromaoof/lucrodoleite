import { describe, expect, it } from "vitest";
import { readInteger, readNumber, readRequiredString, readString } from "@/lib/forms/form-data";
import { expenseSchema } from "@/lib/validations/expense";

describe("form data helpers", () => {
  it("reads trimmed strings and required strings", () => {
    const formData = new FormData();
    formData.set("name", "  Fazenda Boa Vista  ");

    expect(readString(formData, "name")).toBe("Fazenda Boa Vista");
    expect(readRequiredString(formData, "missing")).toBe("");
  });

  it("reads decimal numbers using comma or dot", () => {
    const formData = new FormData();
    formData.set("liters", "1.250");
    formData.set("price", "2,70");

    expect(readNumber(formData, "liters")).toBe(1.25);
    expect(readNumber(formData, "price")).toBe(2.7);
  });

  it("rejects non-integer values when integer is expected", () => {
    const formData = new FormData();
    formData.set("cows", "12.5");

    expect(Number.isNaN(readInteger(formData, "cows"))).toBe(true);
  });

  it("accepts production expense categories in Brazilian Portuguese", () => {
    const result = expenseSchema.safeParse({
      date: "2026-06-13",
      referenceMonth: "2026-06",
      category: "Ração",
      description: "Compra de ração",
      amount: 100,
    });

    expect(result.success).toBe(true);
  });
});
