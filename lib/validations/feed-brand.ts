import { z } from "zod";

export const feedBrandSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da marca.").max(120),
  manufacturer: z.string().trim().max(120).optional(),
  proteinPercent: z.number().finite().min(0).max(100).optional(),
  bagWeightKg: z.number().finite().positive().optional(),
  pricePerBag: z.number().finite().min(0).optional(),
  notes: z.string().trim().max(500).optional(),
});
