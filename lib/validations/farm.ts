import { z } from "zod";

export const farmSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da fazenda.").max(120),
  ownerName: z.string().trim().max(120).optional(),
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().length(2).optional(),
  milkCompany: z.string().trim().max(120).optional(),
  defaultPricePerLiter: z.number().finite().min(0).optional(),
});
