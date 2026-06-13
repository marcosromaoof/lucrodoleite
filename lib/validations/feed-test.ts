import { z } from "zod";

export const feedTestSchema = z
  .object({
    baselineDailyLiters: z.number().finite().min(0),
    dailyFeedKg: z.number().finite().min(0).optional(),
    feedBrandId: z.uuid().optional(),
    feedCostTotal: z.number().finite().min(0),
    label: z.string().trim().min(1, "Informe o nome da ração testada.").max(120),
    milkPricePerLiter: z.number().finite().min(0),
    name: z.string().trim().min(1, "Informe o nome do teste.").max(120),
    notes: z.string().trim().max(500).optional(),
    periodEnd: z.iso.date(),
    periodStart: z.iso.date(),
    testDailyLiters: z.number().finite().min(0),
  })
  .refine((value) => value.periodEnd >= value.periodStart, {
    message: "A data final precisa ser maior ou igual à inicial.",
    path: ["periodEnd"],
  });
