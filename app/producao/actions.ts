"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { requireAuthenticatedFarmAccess } from "@/lib/actions/guards";
import { success, validationError, type ActionState } from "@/lib/actions/action-state";
import { readInteger, readNumber, readRequiredString, readString } from "@/lib/forms/form-data";
import {
  createDailyProduction,
  deleteProduction,
  getProductionByDate,
  getProductionById,
  updateProduction,
} from "@/lib/repositories/production";
import {
  assertProductionChangeKeepsClosedPeriods,
  MonthlyClosingError,
  recalculateClosingsForDates,
} from "@/lib/services/monthly-closing";
import { farmScopedSchema } from "@/lib/validations/scoped";
import { productionSchema } from "@/lib/validations/production";

export async function createProductionAction(formData: FormData): Promise<ActionState> {
  const parsed = productionSchema
    .merge(farmScopedSchema)
    .safeParse({
      farmId: readRequiredString(formData, "farmId"),
      date: readRequiredString(formData, "date"),
      liters: readNumber(formData, "liters"),
      lactatingCows: readInteger(formData, "lactatingCows"),
      batchName: readString(formData, "batchName"),
      feedTestId: readString(formData, "feedTestId"),
      notes: readString(formData, "notes"),
    });

  if (!parsed.success) {
    return validationError("Confira os dados da produção.", parsed.error.flatten().fieldErrors);
  }

  const accessGuard = await requireAuthenticatedFarmAccess(parsed.data.farmId);

  if (accessGuard.error) {
    return accessGuard.error;
  }

  try {
    const db = getDb();
    const existing = await getProductionByDate(db, parsed.data.farmId, parsed.data.date);

    if (existing) {
      await assertProductionChangeKeepsClosedPeriods(db, {
        farmId: parsed.data.farmId,
        newDate: parsed.data.date,
        newLiters: parsed.data.liters,
        oldDate: existing.date,
        oldLiters: existing.liters,
      });
    }

    const created = await createDailyProduction(db, {
      ...parsed.data,
      createdBy: accessGuard.user.id,
    });
    await recalculateClosingsForDates(db, parsed.data.farmId, [parsed.data.date]);
    revalidatePath("/", "layout");

    return success("Produção salva com sucesso.", created?.id);
  } catch (error) {
    if (error instanceof MonthlyClosingError) {
      return validationError(error.message);
    }

    return validationError("Não foi possível salvar a produção agora.");
  }
}

export async function updateProductionAction(formData: FormData): Promise<ActionState> {
  const productionId = readRequiredString(formData, "productionId");
  const parsed = productionSchema
    .merge(farmScopedSchema)
    .safeParse({
      farmId: readRequiredString(formData, "farmId"),
      date: readRequiredString(formData, "date"),
      liters: readNumber(formData, "liters"),
      lactatingCows: readInteger(formData, "lactatingCows"),
      batchName: readString(formData, "batchName"),
      feedTestId: readString(formData, "feedTestId"),
      notes: readString(formData, "notes"),
    });

  if (!productionId) {
    return validationError("Registro de produção inválido.");
  }

  if (!parsed.success) {
    return validationError("Confira os dados da produção.", parsed.error.flatten().fieldErrors);
  }

  const accessGuard = await requireAuthenticatedFarmAccess(parsed.data.farmId);

  if (accessGuard.error) {
    return accessGuard.error;
  }

  try {
    const db = getDb();
    const existing = await getProductionById(db, parsed.data.farmId, productionId);

    if (!existing) {
      return validationError("Registro de produção não encontrado.");
    }

    await assertProductionChangeKeepsClosedPeriods(db, {
      farmId: parsed.data.farmId,
      newDate: parsed.data.date,
      newLiters: parsed.data.liters,
      oldDate: existing.date,
      oldLiters: existing.liters,
    });

    const updated = await updateProduction(db, parsed.data.farmId, productionId, parsed.data);

    if (updated.conflict) {
      return validationError("Já existe produção cadastrada para esta data.");
    }

    await recalculateClosingsForDates(db, parsed.data.farmId, [existing.date, parsed.data.date]);
    revalidatePath("/", "layout");

    return success("Produção atualizada com sucesso.", updated.record?.id);
  } catch (error) {
    if (error instanceof MonthlyClosingError) {
      return validationError(error.message);
    }

    return validationError("Não foi possível atualizar a produção agora.");
  }
}

export async function deleteProductionAction(formData: FormData): Promise<ActionState> {
  const farmId = readRequiredString(formData, "farmId");
  const productionId = readRequiredString(formData, "productionId");

  if (!farmId || !productionId) {
    return validationError("Registro de produção inválido.");
  }

  const accessGuard = await requireAuthenticatedFarmAccess(farmId);

  if (accessGuard.error) {
    return accessGuard.error;
  }

  try {
    const db = getDb();
    const existing = await getProductionById(db, farmId, productionId);

    if (!existing) {
      return validationError("Registro de produção não encontrado.");
    }

    await assertProductionChangeKeepsClosedPeriods(db, {
      farmId,
      oldDate: existing.date,
      oldLiters: existing.liters,
    });

    await deleteProduction(db, farmId, productionId);
    await recalculateClosingsForDates(db, farmId, [existing.date]);
    revalidatePath("/", "layout");

    return success("Produção excluída com sucesso.", productionId);
  } catch (error) {
    if (error instanceof MonthlyClosingError) {
      return validationError(error.message);
    }

    return validationError("Não foi possível excluir a produção agora.");
  }
}

export async function submitProductionForm(formData: FormData): Promise<void> {
  const productionId = readString(formData, "productionId");

  if (productionId) {
    await updateProductionAction(formData);
    return;
  }

  await createProductionAction(formData);
}

export async function submitDeleteProductionForm(formData: FormData): Promise<void> {
  await deleteProductionAction(formData);
}
