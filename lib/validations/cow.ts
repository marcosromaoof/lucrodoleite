import { z } from "zod";
import { cowEvaluationPhases } from "@/lib/calculations/cow-evaluation";

export const cowStatuses = ["active", "dry", "sold", "inactive"] as const;

export const cowStatusLabels: Record<(typeof cowStatuses)[number], string> = {
  active: "Em lactação",
  dry: "Seca",
  inactive: "Inativa",
  sold: "Vendida",
};

export const cowSchema = z.object({
  birthDate: z.iso.date().optional(),
  breed: z.string().trim().max(80).optional(),
  identification: z.string().trim().min(1, "Informe a identificação da vaca.").max(80),
  name: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
  status: z.enum(cowStatuses).default("active"),
});

export const cowEvaluationSchema = z
  .object({
    baselineEndDate: z.iso.date(),
    baselineStartDate: z.iso.date(),
    cowId: z.uuid("Vaca inválida."),
    milkPricePerLiter: z.number().finite().min(0, "Preço do leite não pode ser negativo."),
    name: z.string().trim().min(1, "Informe o nome da avaliação.").max(120),
    notes: z.string().trim().max(500).optional(),
    testEndDate: z.iso.date(),
    testStartDate: z.iso.date(),
  })
  .refine((value) => value.baselineEndDate >= value.baselineStartDate, {
    message: "A data final sem ração precisa ser maior ou igual à inicial.",
    path: ["baselineEndDate"],
  })
  .refine((value) => value.testEndDate >= value.testStartDate, {
    message: "A data final com ração precisa ser maior ou igual à inicial.",
    path: ["testEndDate"],
  });

export const cowEvaluationEntrySchema = z.object({
  date: z.iso.date(),
  feedKg: z.number().finite().min(0).optional(),
  feedPricePerKg: z.number().finite().min(0).optional(),
  liters: z.number().finite().min(0, "Litros não pode ser negativo."),
  notes: z.string().trim().max(500).optional(),
  otherCosts: z.number().finite().min(0).optional(),
  phase: z.enum(cowEvaluationPhases),
  silageKg: z.number().finite().min(0).optional(),
  silagePricePerKg: z.number().finite().min(0).optional(),
});
