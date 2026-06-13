CREATE TABLE "app_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid,
	"user_id" text,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_productions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"date" date NOT NULL,
	"liters" numeric(12, 3) NOT NULL,
	"lactating_cows" integer,
	"batch_name" text,
	"feed_test_id" uuid,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"date" date NOT NULL,
	"reference_month" text NOT NULL,
	"category" text NOT NULL,
	"supplier" text,
	"description" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"feed_brand_id" uuid,
	"feed_test_id" uuid,
	"receipt_url" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "farm_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "farms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"owner_name" text,
	"city" text,
	"state" text,
	"milk_company" text,
	"default_price_per_liter" numeric(12, 4),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feed_brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"name" text NOT NULL,
	"manufacturer" text,
	"protein_percent" numeric(6, 2),
	"bag_weight_kg" numeric(8, 3),
	"price_per_bag" numeric(12, 2),
	"price_per_kg" numeric(12, 4),
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feed_test_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feed_test_id" uuid NOT NULL,
	"feed_brand_id" uuid,
	"label" text NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"daily_feed_kg" numeric(10, 3),
	"total_feed_kg" numeric(12, 3),
	"feed_cost_total" numeric(12, 2),
	"average_daily_liters" numeric(12, 3),
	"baseline_daily_liters" numeric(12, 3),
	"extra_daily_liters" numeric(12, 3),
	"extra_total_liters" numeric(12, 3),
	"extra_revenue" numeric(12, 2),
	"additional_profit" numeric(12, 2),
	"break_even_liters" numeric(12, 3),
	"break_even_liters_per_day" numeric(12, 3),
	"result_per_liter" numeric(12, 4),
	"conclusion" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feed_tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"name" text NOT NULL,
	"status" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"baseline_start_date" date,
	"baseline_end_date" date,
	"comparison_mode" text NOT NULL,
	"milk_price_per_liter" numeric(12, 4),
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthly_closings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"reference_month" text NOT NULL,
	"total_liters" numeric(12, 3) NOT NULL,
	"milk_invoice_amount" numeric(12, 2) NOT NULL,
	"real_price_per_liter" numeric(12, 4) NOT NULL,
	"total_feed_amount" numeric(12, 2) NOT NULL,
	"total_expenses" numeric(12, 2) NOT NULL,
	"feed_cost_per_liter" numeric(12, 4) NOT NULL,
	"total_cost_per_liter" numeric(12, 4) NOT NULL,
	"gross_result_per_liter" numeric(12, 4) NOT NULL,
	"result_after_feed_per_liter" numeric(12, 4) NOT NULL,
	"net_result_per_liter" numeric(12, 4) NOT NULL,
	"net_profit" numeric(12, 2) NOT NULL,
	"closed_by" text,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"type" text NOT NULL,
	"format" text NOT NULL,
	"reference_start" date,
	"reference_end" date,
	"file_name" text,
	"generated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_productions" ADD CONSTRAINT "daily_productions_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_productions" ADD CONSTRAINT "daily_productions_feed_test_id_feed_tests_id_fk" FOREIGN KEY ("feed_test_id") REFERENCES "public"."feed_tests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_productions" ADD CONSTRAINT "daily_productions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_feed_brand_id_feed_brands_id_fk" FOREIGN KEY ("feed_brand_id") REFERENCES "public"."feed_brands"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_feed_test_id_feed_tests_id_fk" FOREIGN KEY ("feed_test_id") REFERENCES "public"."feed_tests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farm_members" ADD CONSTRAINT "farm_members_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farm_members" ADD CONSTRAINT "farm_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_brands" ADD CONSTRAINT "feed_brands_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_test_variants" ADD CONSTRAINT "feed_test_variants_feed_test_id_feed_tests_id_fk" FOREIGN KEY ("feed_test_id") REFERENCES "public"."feed_tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_test_variants" ADD CONSTRAINT "feed_test_variants_feed_brand_id_feed_brands_id_fk" FOREIGN KEY ("feed_brand_id") REFERENCES "public"."feed_brands"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_tests" ADD CONSTRAINT "feed_tests_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_tests" ADD CONSTRAINT "feed_tests_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_closings" ADD CONSTRAINT "monthly_closings_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_closings" ADD CONSTRAINT "monthly_closings_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "app_settings_farm_key_unique" ON "app_settings" USING btree ("farm_id","key");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_productions_farm_date_unique" ON "daily_productions" USING btree ("farm_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "farm_members_farm_user_unique" ON "farm_members" USING btree ("farm_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "monthly_closings_farm_reference_unique" ON "monthly_closings" USING btree ("farm_id","reference_month");