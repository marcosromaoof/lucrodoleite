import { describe, expect, it } from "vitest";
import { getCycleDateRange } from "@/lib/dates/month";

describe("custom closing periods", () => {
  it("uses the previous month when the cycle crosses the civil month boundary", () => {
    expect(getCycleDateRange("2026-06", 25, 24)).toEqual({
      startDate: "2026-05-25",
      endDate: "2026-06-24",
    });
  });

  it("keeps calendar month behavior for day 1 to 31 and clamps month end", () => {
    expect(getCycleDateRange("2026-06", 1, 31)).toEqual({
      startDate: "2026-06-01",
      endDate: "2026-06-30",
    });
  });

  it("clamps start and end dates to short months", () => {
    expect(getCycleDateRange("2026-02", 31, 31)).toEqual({
      startDate: "2026-02-28",
      endDate: "2026-02-28",
    });
  });
});
