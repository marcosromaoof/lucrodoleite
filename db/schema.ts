import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "@auth/core/adapters";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true, mode: "date" }),
  image: text("image"),
  ...timestamps,
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    primaryKey({
      columns: [table.provider, table.providerAccountId],
    }),
  ],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true, mode: "date" }).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.identifier, table.token],
    }),
  ],
);

export const apiTokens = pgTable(
  "api_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    tokenHash: text("token_hash").notNull(),
    tokenPrefix: text("token_prefix").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("api_tokens_token_hash_unique").on(table.tokenHash),
    index("api_tokens_user_id_idx").on(table.userId),
  ],
);

export const farms = pgTable("farms", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  ownerName: text("owner_name"),
  city: text("city"),
  state: text("state"),
  milkCompany: text("milk_company"),
  defaultPricePerLiter: numeric("default_price_per_liter", {
    precision: 12,
    scale: 4,
  }),
  ...timestamps,
});

export const farmMembers = pgTable(
  "farm_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("farm_members_farm_user_unique").on(table.farmId, table.userId)],
);

export const feedBrands = pgTable("feed_brands", {
  id: uuid("id").defaultRandom().primaryKey(),
  farmId: uuid("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  manufacturer: text("manufacturer"),
  proteinPercent: numeric("protein_percent", { precision: 6, scale: 2 }),
  bagWeightKg: numeric("bag_weight_kg", { precision: 8, scale: 3 }),
  pricePerBag: numeric("price_per_bag", { precision: 12, scale: 2 }),
  pricePerKg: numeric("price_per_kg", { precision: 12, scale: 4 }),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

export const feedTests = pgTable("feed_tests", {
  id: uuid("id").defaultRandom().primaryKey(),
  farmId: uuid("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  baselineStartDate: date("baseline_start_date"),
  baselineEndDate: date("baseline_end_date"),
  comparisonMode: text("comparison_mode").notNull(),
  milkPricePerLiter: numeric("milk_price_per_liter", { precision: 12, scale: 4 }),
  notes: text("notes"),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
});

export const dailyProductions = pgTable(
  "daily_productions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    liters: numeric("liters", { precision: 12, scale: 3 }).notNull(),
    lactatingCows: integer("lactating_cows"),
    batchName: text("batch_name"),
    feedTestId: uuid("feed_test_id").references(() => feedTests.id, { onDelete: "set null" }),
    notes: text("notes"),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [uniqueIndex("daily_productions_farm_date_unique").on(table.farmId, table.date)],
);

export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  farmId: uuid("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  referenceMonth: text("reference_month").notNull(),
  category: text("category").notNull(),
  supplier: text("supplier"),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  feedBrandId: uuid("feed_brand_id").references(() => feedBrands.id, { onDelete: "set null" }),
  feedTestId: uuid("feed_test_id").references(() => feedTests.id, { onDelete: "set null" }),
  receiptUrl: text("receipt_url"),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
});

export const monthlyClosings = pgTable(
  "monthly_closings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    month: integer("month").notNull(),
    year: integer("year").notNull(),
    referenceMonth: text("reference_month").notNull(),
    totalLiters: numeric("total_liters", { precision: 12, scale: 3 }).notNull(),
    milkInvoiceAmount: numeric("milk_invoice_amount", { precision: 12, scale: 2 }).notNull(),
    realPricePerLiter: numeric("real_price_per_liter", { precision: 12, scale: 4 }).notNull(),
    totalFeedAmount: numeric("total_feed_amount", { precision: 12, scale: 2 }).notNull(),
    totalExpenses: numeric("total_expenses", { precision: 12, scale: 2 }).notNull(),
    feedCostPerLiter: numeric("feed_cost_per_liter", { precision: 12, scale: 4 }).notNull(),
    totalCostPerLiter: numeric("total_cost_per_liter", { precision: 12, scale: 4 }).notNull(),
    grossResultPerLiter: numeric("gross_result_per_liter", {
      precision: 12,
      scale: 4,
    }).notNull(),
    resultAfterFeedPerLiter: numeric("result_after_feed_per_liter", {
      precision: 12,
      scale: 4,
    }).notNull(),
    netResultPerLiter: numeric("net_result_per_liter", { precision: 12, scale: 4 }).notNull(),
    netProfit: numeric("net_profit", { precision: 12, scale: 2 }).notNull(),
    closedBy: text("closed_by").references(() => users.id, { onDelete: "set null" }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [uniqueIndex("monthly_closings_farm_reference_unique").on(table.farmId, table.referenceMonth)],
);

export const feedTestVariants = pgTable("feed_test_variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  feedTestId: uuid("feed_test_id")
    .notNull()
    .references(() => feedTests.id, { onDelete: "cascade" }),
  feedBrandId: uuid("feed_brand_id").references(() => feedBrands.id, { onDelete: "set null" }),
  label: text("label").notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  dailyFeedKg: numeric("daily_feed_kg", { precision: 10, scale: 3 }),
  totalFeedKg: numeric("total_feed_kg", { precision: 12, scale: 3 }),
  feedCostTotal: numeric("feed_cost_total", { precision: 12, scale: 2 }),
  averageDailyLiters: numeric("average_daily_liters", { precision: 12, scale: 3 }),
  baselineDailyLiters: numeric("baseline_daily_liters", { precision: 12, scale: 3 }),
  extraDailyLiters: numeric("extra_daily_liters", { precision: 12, scale: 3 }),
  extraTotalLiters: numeric("extra_total_liters", { precision: 12, scale: 3 }),
  extraRevenue: numeric("extra_revenue", { precision: 12, scale: 2 }),
  additionalProfit: numeric("additional_profit", { precision: 12, scale: 2 }),
  breakEvenLiters: numeric("break_even_liters", { precision: 12, scale: 3 }),
  breakEvenLitersPerDay: numeric("break_even_liters_per_day", { precision: 12, scale: 3 }),
  resultPerLiter: numeric("result_per_liter", { precision: 12, scale: 4 }),
  conclusion: text("conclusion"),
  ...timestamps,
});

export const reportExports = pgTable("report_exports", {
  id: uuid("id").defaultRandom().primaryKey(),
  farmId: uuid("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  format: text("format").notNull(),
  referenceStart: date("reference_start"),
  referenceEnd: date("reference_end"),
  fileName: text("file_name"),
  generatedBy: text("generated_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const appSettings = pgTable(
  "app_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    value: jsonb("value").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("app_settings_farm_key_unique").on(table.farmId, table.key)],
);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  farmId: uuid("farm_id").references(() => farms.id, { onDelete: "set null" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
