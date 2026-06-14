export const requiredApplicationTables = [
  "accounts",
  "api_tokens",
  "app_settings",
  "audit_logs",
  "daily_productions",
  "expenses",
  "farm_members",
  "farms",
  "feed_brands",
  "feed_test_variants",
  "feed_tests",
  "monthly_closings",
  "report_exports",
  "sessions",
  "users",
  "verification_tokens",
] as const;

export function getMissingApplicationTables(existingTables: string[]) {
  const existing = new Set(existingTables.map((table) => table.toLowerCase()));

  return requiredApplicationTables.filter((table) => !existing.has(table));
}
