import { getDb } from "@/db/client";
import { isDatabaseConfigured } from "@/lib/app/environment";
import type { PageSearchParams } from "@/lib/app/search-params";
import { getSearchParam } from "@/lib/app/search-params";
import { formatReferenceMonth, normalizeMonthKey } from "@/lib/dates/month";
import { listFarmsForUser, type FarmOption } from "@/lib/repositories/farms";
import { redirect } from "next/navigation";
import { getOptionalSession } from "@/lib/auth/session";

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
  const session = await getOptionalSession();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/entrar");
  }

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
    const farms = await listFarmsForUser(getDb(), userId);
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
