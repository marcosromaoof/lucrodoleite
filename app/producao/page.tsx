import Link from "next/link";
import { submitDeleteProductionForm, submitProductionForm } from "@/app/producao/actions";
import { AppShell } from "@/components/app-shell/app-shell";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { EditModeBanner } from "@/components/ui/edit-mode-banner";
import { FormField } from "@/components/ui/form-field";
import { PageCard } from "@/components/ui/page-card";
import { SetupCallout } from "@/components/ui/setup-callout";
import { getDb } from "@/db/client";
import { getOperationalContext } from "@/lib/app/operational-context";
import { getSearchParam, type PageSearchParams } from "@/lib/app/search-params";
import { getCycleDateRange, getTodayDateKey, formatDateRange } from "@/lib/dates/month";
import { formatLiters } from "@/lib/formatters/number";
import { listProductionsByMonth } from "@/lib/repositories/production";

export const dynamic = "force-dynamic";

type ProducaoPageProps = {
  searchParams?: PageSearchParams;
};

export default async function ProducaoPage({ searchParams }: ProducaoPageProps) {
  const context = await getOperationalContext(searchParams);
  const range = context.activeFarm
    ? getCycleDateRange(
        context.referenceMonth,
        context.activeFarm.closingCycleStartDay,
        context.activeFarm.closingCycleEndDay,
      )
    : { startDate: `${context.referenceMonth}-01`, endDate: `${context.referenceMonth}-31` };
  const editProductionId = await getSearchParam(searchParams, "editProductionId");
  const productions = context.activeFarm
    ? await listProductionsByMonth(getDb(), context.activeFarm.id, range.startDate, range.endDate)
    : [];
  const editingProduction = productions.find((production) => production.id === editProductionId) ?? null;
  const baseQuery = `farmId=${context.activeFarmId}&referenceMonth=${context.referenceMonth}`;

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
      <div className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <PageCard
          description={`Período do ciclo: ${formatDateRange(range.startDate, range.endDate)}. Se a data já existir, use editar na lista para alterar com controle de fechamento.`}
          title={editingProduction ? "Editar produção" : "Lançamento do dia"}
        >
          <form action={submitProductionForm} className="grid gap-4">
            <input name="farmId" type="hidden" value={context.activeFarmId} />
            {editingProduction ? <input name="productionId" type="hidden" value={editingProduction.id} /> : null}
            {editingProduction ? (
              <EditModeBanner
                cancelHref={`/producao?${baseQuery}`}
                entity="Produção selecionada"
                summary={`${editingProduction.date} - ${formatLiters(editingProduction.liters)}`}
              />
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Data">
                <input
                  className="field"
                  defaultValue={editingProduction?.date ?? getTodayDateKey()}
                  name="date"
                  required
                  type="date"
                />
              </FormField>
              <FormField label="Litros produzidos">
                <input
                  className="field"
                  defaultValue={editingProduction?.liters}
                  min="0"
                  name="liters"
                  required
                  step="0.001"
                  type="number"
                />
              </FormField>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Vacas em lactação">
                <input
                  className="field"
                  defaultValue={editingProduction?.lactatingCows ?? undefined}
                  min="1"
                  name="lactatingCows"
                  step="1"
                  type="number"
                />
              </FormField>
              <FormField label="Lote">
                <input
                  className="field"
                  defaultValue={editingProduction?.batchName ?? undefined}
                  maxLength={80}
                  name="batchName"
                  type="text"
                />
              </FormField>
            </div>

            <FormField label="Observação">
              <textarea
                className="field min-h-32 resize-y"
                defaultValue={editingProduction?.notes ?? undefined}
                maxLength={500}
                name="notes"
              />
            </FormField>

            <div className="flex flex-wrap gap-3">
              <button className="primary-button flex-1" disabled={!context.activeFarm} type="submit">
                {editingProduction ? "Atualizar produção" : "Salvar produção"}
              </button>
              {editingProduction ? (
                <Link
                  className="edit-cancel-link inline-flex min-h-12 items-center justify-center"
                  href={`/producao?${baseQuery}`}
                >
                  Cancelar
                </Link>
              ) : null}
            </div>
          </form>
        </PageCard>

        <PageCard title="Histórico do período">
          {!context.activeFarm ? (
            <SetupCallout title="Cadastre uma fazenda">
              A produção precisa de uma fazenda ativa antes de ser salva.
            </SetupCallout>
          ) : productions.length === 0 ? (
            <SetupCallout title="Sem produção no período">
              Nenhum registro de produção encontrado entre {formatDateRange(range.startDate, range.endDate)}.
            </SetupCallout>
          ) : (
            <div className="overflow-hidden rounded-lg border border-[var(--border)]">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-[var(--milk-white)]">
                  <tr>
                    <th className="border-b border-[var(--border)] px-3 py-2 text-left">Data</th>
                    <th className="border-b border-[var(--border)] px-3 py-2 text-right">Litros</th>
                    <th className="border-b border-[var(--border)] px-3 py-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {productions.map((production) => (
                    <tr key={production.id}>
                      <td className="border-t border-[var(--border)] px-3 py-2">{production.date}</td>
                      <td className="border-t border-[var(--border)] px-3 py-2 text-right font-bold">
                        {formatLiters(production.liters)}
                      </td>
                      <td className="border-t border-[var(--border)] px-3 py-2">
                        <div className="row-actions">
                          <Link
                            className="action-link"
                            href={`/producao?${baseQuery}&editProductionId=${production.id}`}
                          >
                            Editar
                          </Link>
                          <form action={submitDeleteProductionForm}>
                            <input name="farmId" type="hidden" value={context.activeFarmId} />
                            <input name="productionId" type="hidden" value={production.id} />
                            <ConfirmSubmitButton
                              className="danger-action"
                              message="Excluir este registro de produção?"
                            >
                              Excluir
                            </ConfirmSubmitButton>
                          </form>
                        </div>
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
