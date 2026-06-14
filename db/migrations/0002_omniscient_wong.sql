ALTER TABLE "expenses" ADD COLUMN "quantity" numeric(12, 3);--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "unit" text;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "unit_price" numeric(12, 4);--> statement-breakpoint
ALTER TABLE "farms" ADD COLUMN "closing_cycle_start_day" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "farms" ADD COLUMN "closing_cycle_end_day" integer DEFAULT 31 NOT NULL;--> statement-breakpoint
ALTER TABLE "farms" ADD CONSTRAINT "farms_closing_cycle_start_day_check" CHECK ("closing_cycle_start_day" between 1 and 31);--> statement-breakpoint
ALTER TABLE "farms" ADD CONSTRAINT "farms_closing_cycle_end_day_check" CHECK ("closing_cycle_end_day" between 1 and 31);--> statement-breakpoint
ALTER TABLE "monthly_closings" ADD COLUMN "period_start" date;--> statement-breakpoint
ALTER TABLE "monthly_closings" ADD COLUMN "period_end" date;--> statement-breakpoint
UPDATE "monthly_closings"
SET
  "period_start" = make_date("year", "month", 1),
  "period_end" = (make_date("year", "month", 1) + interval '1 month - 1 day')::date
WHERE "period_start" IS NULL OR "period_end" IS NULL;--> statement-breakpoint
ALTER TABLE "monthly_closings" ALTER COLUMN "period_start" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "monthly_closings" ALTER COLUMN "period_end" SET NOT NULL;
