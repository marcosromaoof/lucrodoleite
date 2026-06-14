import { describe, expect, it } from "vitest";
import { summarizeCowEvaluation } from "@/lib/calculations/cow-evaluation";

describe("cow evaluation calculations", () => {
  it("compares baseline and feed test periods with direct cow costs", () => {
    const summary = summarizeCowEvaluation(
      [
        { date: "2026-06-01", liters: 18, phase: "baseline" },
        { date: "2026-06-02", liters: 20, phase: "baseline" },
        {
          date: "2026-06-03",
          feedKg: 4,
          feedPricePerKg: 1.5,
          liters: 24,
          phase: "test",
          silageKg: 10,
          silagePricePerKg: 0.25,
        },
        {
          date: "2026-06-04",
          feedKg: 4,
          feedPricePerKg: 1.5,
          liters: 26,
          otherCosts: 1,
          phase: "test",
          silageKg: 10,
          silagePricePerKg: 0.25,
        },
      ],
      2.5,
    );

    expect(summary.baseline.averageDailyLiters).toBe(19);
    expect(summary.test.averageDailyLiters).toBe(25);
    expect(summary.comparison.extraDailyLiters).toBe(6);
    expect(summary.test.feedCost).toBe(12);
    expect(summary.test.silageCost).toBe(5);
    expect(summary.total.nutritionCost).toBe(17);
    expect(summary.total.freeProfitAfterNutrition).toBe(203);
    expect(summary.total.netProfit).toBe(202);
    expect(summary.comparison.additionalDailyProfit).toBeCloseTo(6);
    expect(summary.comparison.profitCompensated).toBe(true);
  });
});
