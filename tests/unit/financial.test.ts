import { describe, expect, it } from "vitest";
import { calculateMonthlyClosing, calculateMonthlyEstimate, safeDivide } from "@/lib/calculations/financial";

describe("financial calculations", () => {
  it("calculates monthly closing indicators", () => {
    const result = calculateMonthlyClosing({
      totalLiters: 2700,
      milkInvoiceAmount: 7290,
      totalFeedAmount: 1200,
      totalExpenses: 1700,
    });

    expect(result.realPricePerLiter).toBeCloseTo(2.7);
    expect(result.feedCostPerLiter).toBeCloseTo(0.4444);
    expect(result.resultAfterFeedPerLiter).toBeCloseTo(2.2555);
    expect(result.totalCostPerLiter).toBeCloseTo(0.6296);
    expect(result.netResultPerLiter).toBeCloseTo(2.0703);
    expect(result.netProfit).toBe(5590);
  });

  it("does not divide by zero", () => {
    expect(safeDivide(10, 0)).toBe(0);
    expect(calculateMonthlyClosing({
      totalLiters: 0,
      milkInvoiceAmount: 1000,
      totalFeedAmount: 300,
      totalExpenses: 500,
    }).netResultPerLiter).toBe(0);
  });

  it("calculates monthly estimates before closing", () => {
    const result = calculateMonthlyEstimate({
      totalLiters: 1000,
      estimatedPricePerLiter: 2.5,
      totalExpenses: 900,
    });

    expect(result.estimatedRevenue).toBe(2500);
    expect(result.estimatedProfit).toBe(1600);
    expect(result.estimatedResultPerLiter).toBe(1.6);
  });
});
