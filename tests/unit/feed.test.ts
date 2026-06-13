import { describe, expect, it } from "vitest";
import { calculateFeedVariant, compareFeedVariants } from "@/lib/calculations/feed";

describe("feed calculations", () => {
  it("identifies when a feed brand compensates financially", () => {
    const result = calculateFeedVariant({
      label: "Marca B",
      baselineDailyLiters: 70,
      testDailyLiters: 90,
      days: 30,
      milkPricePerLiter: 2.7,
      feedCostTotal: 1200,
    });

    expect(result.extraDailyLiters).toBe(20);
    expect(result.extraTotalLiters).toBe(600);
    expect(result.extraRevenue).toBe(1620);
    expect(result.additionalProfit).toBe(420);
    expect(result.breakEvenLiters).toBeCloseTo(444.4444);
    expect(result.breakEvenLitersPerDay).toBeCloseTo(14.8148);
    expect(result.compensated).toBe("yes");
  });

  it("identifies when production increases but profit falls", () => {
    const result = calculateFeedVariant({
      label: "Marca C",
      baselineDailyLiters: 70,
      testDailyLiters: 80,
      days: 30,
      milkPricePerLiter: 2.7,
      feedCostTotal: 1000,
    });

    expect(result.extraTotalLiters).toBe(300);
    expect(result.additionalProfit).toBe(-190);
    expect(result.compensated).toBe("no");
  });

  it("compares brands by production and financial result separately", () => {
    const comparison = compareFeedVariants([
      {
        label: "Marca B",
        baselineDailyLiters: 70,
        testDailyLiters: 90,
        days: 30,
        milkPricePerLiter: 2.7,
        feedCostTotal: 1200,
      },
      {
        label: "Marca C",
        baselineDailyLiters: 70,
        testDailyLiters: 85,
        days: 30,
        milkPricePerLiter: 2.7,
        feedCostTotal: 600,
      },
    ]);

    expect(comparison.bestProductionResult?.label).toBe("Marca B");
    expect(comparison.bestFinancialResult?.label).toBe("Marca C");
  });
});
