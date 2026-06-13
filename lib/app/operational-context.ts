import { getDb } from "@/db/client";
import { isDatabaseConfigured } from "@/lib/app/environment";
import type { PageSearchParams } from "@/lib/app/search-params";
import { getSearchParam } from "@/lib/app/search-params";
import { formatReferenceMonth, normalizeMonthKey } from "@/lib/dates/month";
import { listFarms, type FarmOption } from "@/lib/repositories/farms";

export type OperationalContext = {
  activeFarm: FarmOption | null;
  activeFarmId: string;
  databaseConfigured: boolean;
  farms: FarmOption[];
  referenceMonth: string;
  referenceMonthLabel: string;
};

export async function getOperationalContext(searchParams?: PageSearchParams): Promise<OperationalContext> {
  const databaseConfigured = isDatabaseConfigured();
  const referenceMonth = normalizeMonthKey(await getSearchParam(searchParams, "referenceMonth"));

  if (!databaseConfigured) {
    return {
      activeFarm: null,
      activeFarmId: "",
      databaseConfigured,
      farms: [],
      referenceMonth,
      referenceMonthLabel: formatReferenceMonth(referenceMonth),
    };
  }

  try {
    const farms = await listFarms(getDb());
    const farmIdParam = await getSearchParam(searchParams, "farmId");
    const activeFarm = farms.find((farm) => farm.id === farmIdParam) ?? farms[0] ?? null;

    return {
      activeFarm,
      activeFarmId: activeFarm?.id ?? "",
      databaseConfigured,
      farms,
      referenceMonth,
      referenceMonthLabel: formatReferenceMonth(referenceMonth),
    };
  } catch {
    return {
      activeFarm: null,
      activeFarmId: "",
      databaseConfigured,
      farms: [],
      referenceMonth,
      referenceMonthLabel: formatReferenceMonth(referenceMonth),
    };
  }
}
