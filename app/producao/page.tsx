import { submitProductionForm } from "@/app/producao/actions";
import { AppShell } from "@/components/app-shell/app-shell";
import { FormField } from "@/components/ui/form-field";
import { PageCard } from "@/components/ui/page-card";
import { SetupCallout } from "@/components/ui/setup-callout";
import { getDb } from "@/db/client";
import { getOperationalContext } from "@/lib/app/operational-context";
import type { PageSearchParams } from "@/lib/app/search-params";
import { getMonthDateRange, getTodayDateKey } from "@/lib/dates/month";
import { formatLiters } from "@/lib/formatters/number";
import { listProductionsByMonth } from "@/lib/repositories/production";

export const dynamic = "force-dynamic";

type ProducaoPageProps = {
  searchParams?: PageSearchParams;
};

export default async function ProducaoPage({ searchParams }: ProducaoPageProps) {
  const context = await getOperationalContext(searchParams);
  const range = getMonthDateRange(context.referenceMonth);
  const productions = context.activeFarm
    ? await listProductionsByMonth(getDb(), context.activeFarm.id, range.startDate, range.endDate)
    : [];

  return (
    <AppShell
      activeFarmId={context.activeFarmId}
      activeHref="/producao"
      eyebrow="Produção diária"
      farms={context.farms}
      referenceMonth={context.referenceMonth}
      referenceMonthLabel={context.referenceMonthLabel}
      title="Registrar produção"
    >
      <div className="grid gap-5 p-5 sm:p-8 xl:grid-cols-[1fr_0.75fr]">
        <PageCard
          description="Registre a produção real da fazenda ativa. Se a data já existir, o registro será atualizado."
          title="Lançamento do dia"
        >
          <form action={submitProductionForm} className="grid gap-4">
            <input name="farmId" type="hidden" value={context.activeFarmId} />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Data">
                <input className="field" defaultValue={getTodayDateKey()} name="date" required type="date" />
              </FormField>
              <FormField label="Litros produzidos">
                <input className="field" min="0" name="liters" required step="0.001" type="number" />
              </FormField>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Vacas em lactação">
                <input className="field" min="1" name="lactatingCows" step="1" type="number" />
              </FormField>
              <FormField label="Lote">
                <input className="field" maxLength={80} name="batchName" type="text" />
              </FormField>
            </div>

            <FormField label="Observação">
              <textarea className="field min-h-32 resize-y" maxLength={500} name="notes" />
            </FormField>

            <button className="primary-button" disabled={!context.activeFarm} type="submit">
              Salvar produção
            </button>
          </form>
        </PageCard>

        <PageCard title="Histórico do mês">
          {!context.activeFarm ? (
            <SetupCallout title="Cadastre uma fazenda">
              A produção precisa de uma fazenda ativa antes de ser salva.
            </SetupCallout>
          ) : productions.length === 0 ? (
            <SetupCallout title="Sem produção no mês">
              Nenhum registro de produção encontrado para {context.referenceMonthLabel}.
            </SetupCallout>
          ) : (
            <div className="overflow-hidden rounded-lg border border-[var(--border)]">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-[var(--milk-white)]">
                  <tr>
                    <th className="border-b border-[var(--border)] px-3 py-2 text-left">Data</th>
                    <th className="border-b border-[var(--border)] px-3 py-2 text-right">Litros</th>
                  </tr>
                </thead>
                <tbody>
                  {productions.map((production) => (
                    <tr key={production.id}>
                      <td className="border-t border-[var(--border)] px-3 py-2">{production.date}</td>
                      <td className="border-t border-[var(--border)] px-3 py-2 text-right font-bold">
                        {formatLiters(production.liters)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PageCard>
      </div>
    </AppShell>
  );
}
