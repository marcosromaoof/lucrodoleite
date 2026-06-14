import { reportExports } from "@/db/schema";
import type { AppDatabase } from "./types";
import { desc, eq } from "drizzle-orm";

export type CreateReportExportInput = {
  farmId: string;
  fileName: string;
  format: string;
  generatedBy?: string;
  referenceEnd?: string;
  referenceStart?: string;
  type: string;
};

export type ReportExportRecord = {
  createdAt: Date;
  fileName: string | null;
  format: string;
  id: string;
  referenceEnd: string | null;
  referenceStart: string | null;
  type: string;
};

export async function createReportExport(db: AppDatabase, input: CreateReportExportInput) {
  const [created] = await db
    .insert(reportExports)
    .values({
      farmId: input.farmId,
      fileName: input.fileName,
      format: input.format,
      generatedBy: input.generatedBy,
      referenceEnd: input.referenceEnd,
      referenceStart: input.referenceStart,
      type: input.type,
    })
    .returning({ id: reportExports.id });

  return created;
}

export async function listReportExports(db: AppDatabase, farmId: string, limit = 12): Promise<ReportExportRecord[]> {
  return db
    .select({
      createdAt: reportExports.createdAt,
      fileName: reportExports.fileName,
      format: reportExports.format,
      id: reportExports.id,
      referenceEnd: reportExports.referenceEnd,
      referenceStart: reportExports.referenceStart,
      type: reportExports.type,
    })
    .from(reportExports)
    .where(eq(reportExports.farmId, farmId))
    .orderBy(desc(reportExports.createdAt))
    .limit(limit);
}
