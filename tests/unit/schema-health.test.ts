import { describe, expect, it } from "vitest";
import { getMissingApplicationTables, requiredApplicationTables } from "@/lib/database/schema-health";

describe("database schema health", () => {
  it("reports no missing tables when all application tables exist", () => {
    expect(getMissingApplicationTables([...requiredApplicationTables])).toEqual([]);
  });

  it("reports only application tables missing from the database", () => {
    const existingTables = requiredApplicationTables.filter((table) => table !== "farms" && table !== "expenses");

    expect(getMissingApplicationTables(existingTables)).toEqual(["expenses", "farms"]);
  });

  it("handles table names case-insensitively", () => {
    expect(getMissingApplicationTables(requiredApplicationTables.map((table) => table.toUpperCase()))).toEqual([]);
  });
});
