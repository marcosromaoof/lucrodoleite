CREATE TABLE "cow_evaluation_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"evaluation_id" uuid NOT NULL,
	"date" date NOT NULL,
	"phase" text NOT NULL,
	"liters" numeric(12, 3) NOT NULL,
	"feed_kg" numeric(12, 3),
	"feed_price_per_kg" numeric(12, 4),
	"silage_kg" numeric(12, 3),
	"silage_price_per_kg" numeric(12, 4),
	"other_costs" numeric(12, 2),
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cow_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"cow_id" uuid NOT NULL,
	"name" text NOT NULL,
	"baseline_start_date" date NOT NULL,
	"baseline_end_date" date NOT NULL,
	"test_start_date" date NOT NULL,
	"test_end_date" date NOT NULL,
	"milk_price_per_liter" numeric(12, 4) NOT NULL,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"identification" text NOT NULL,
	"name" text,
	"breed" text,
	"birth_date" date,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "monthly_closings" ADD COLUMN "total_silage_amount" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "monthly_closings" ADD COLUMN "total_mineral_amount" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "monthly_closings" ADD COLUMN "total_nutrition_amount" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "monthly_closings" ADD COLUMN "nutrition_cost_per_liter" numeric(12, 4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "monthly_closings" ADD COLUMN "result_after_nutrition_per_liter" numeric(12, 4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "monthly_closings" ADD COLUMN "free_profit_after_nutrition" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
UPDATE "monthly_closings"
SET
	"total_nutrition_amount" = "total_feed_amount",
	"nutrition_cost_per_liter" = "feed_cost_per_liter",
	"result_after_nutrition_per_liter" = "result_after_feed_per_liter",
	"free_profit_after_nutrition" = "milk_invoice_amount" - "total_feed_amount";--> statement-breakpoint
ALTER TABLE "cow_evaluation_entries" ADD CONSTRAINT "cow_evaluation_entries_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cow_evaluation_entries" ADD CONSTRAINT "cow_evaluation_entries_evaluation_id_cow_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."cow_evaluations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cow_evaluation_entries" ADD CONSTRAINT "cow_evaluation_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cow_evaluations" ADD CONSTRAINT "cow_evaluations_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cow_evaluations" ADD CONSTRAINT "cow_evaluations_cow_id_cows_id_fk" FOREIGN KEY ("cow_id") REFERENCES "public"."cows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cow_evaluations" ADD CONSTRAINT "cow_evaluations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cows" ADD CONSTRAINT "cows_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cows" ADD CONSTRAINT "cows_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cow_entries_evaluation_date_phase_unique" ON "cow_evaluation_entries" USING btree ("evaluation_id","date","phase");--> statement-breakpoint
CREATE INDEX "cow_entries_farm_date_idx" ON "cow_evaluation_entries" USING btree ("farm_id","date");--> statement-breakpoint
CREATE INDEX "cow_evaluations_farm_idx" ON "cow_evaluations" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "cow_evaluations_cow_idx" ON "cow_evaluations" USING btree ("cow_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cows_farm_identification_unique" ON "cows" USING btree ("farm_id","identification");--> statement-breakpoint
CREATE INDEX "cows_farm_status_idx" ON "cows" USING btree ("farm_id","status");
