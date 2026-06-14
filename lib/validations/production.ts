import { z } from "zod";

export const productionSchema = z.object({
  date: z.iso.date(),
  liters: z.number().finite().min(0, "Litros nao podem ser negativos."),
  lactatingCows: z.number().int().positive().optional(),
  batchName: z.string().max(80).optional(),
  feedTestId: z.uuid().optional(),
  notes: z.string().max(500).optional(),
});
