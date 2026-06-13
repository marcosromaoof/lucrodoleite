import { z } from "zod";

export const farmIdSchema = z.uuid("Fazenda inválida.");

export const farmScopedSchema = z.object({
  farmId: farmIdSchema,
});
