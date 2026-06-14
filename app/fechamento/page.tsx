import {
  submitDeleteMonthlyClosingForm,
  submitMonthlyClosingForm,
  submitRecalculateMonthlyClosingForm,
} from "@/app/fechamento/actions";
import { AppShell } from "@/components/app-shell/app-shell";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { EditModeBanner } from "@/components/ui/edit-mode-banner";
import { FormField } from "@/components/ui/form-field";
import { PageCard } from "@/components/ui/page-card";
import { SetupCallout } from "@/components/ui/setup-callout";
import { getDb } from "@/db/client";
import { getOperationalContext } from "@/lib/app/operational-context";
import type { PageSearchParams } from "@/lib/app/search-params";
import { calculateMonthlyClosing } from "@/lib/calculations/financial";
import { formatDateRange, formatReferenceMonth, getCycleDateRange, getTodayDateKey } from "@/lib/dates/month";
import { formatCurrency, formatLiters } from "@/lib/formatters/number";
import { getMonthlyExpenseSummary } from "@/lib/repositories/expenses";
import { getMonthlyClosing, listMonthlyClosings } from "@/lib/repositories/monthly-closings";
import { getMonthlyProductionSummary } from "@/lib/repositories/production";

export const dynamic = "force-dynamic";

type FechamentoPageProps = {
  searchParams?: PageSearchParams;
};

export default async function FechamentoPage({ searchParams }: FechamentoPageProps) {
  const context = await getOperationalContext(searchParams);
  const activeFarm = context.activeFarm;
  const defaultRange = activeFarm
    ? getCycleDateRange(context.referenceMonth, activeFarm.closingCycleStartDay, activeFarm.closingCycleEndDay)
    : { startDate: `${context.referenceMonth}-01`, endDate: `${context.referenceMonth}-31` };

  const [closing, closingHistory] = activeFarm
    ? await Promise.all([
        getMonthlyClosing(getDb(), activeFarm.id, context.referenceMonth),
        listMonthlyClosings(getDb(), activeFarm.id),
      ])
    : [null, []];
  const range = closing
    ? { startDate: closing.periodStart, endDate: closing.periodEnd }
    : defaultRange;

  const [productionSummary, expenseSummary] = activeFarm
    ? await Promise.all([
        getMonthlyProductionSummary(getDb(), activeFarm.id, range.startDate, range.endDate, getTodayDateKey()),
        getMonthlyExpenseSummary(getDb(), activeFarm.id, range.startDate, range.endDate),
      ])
    : [
        { recordCount: 0, todayLiters: 0, totalLiters: 0 },
        { feedAmount: 0, totalAmount: 0 },
      ];

  const projectedInvoice = productionSummary.totalLiters * (activeFarm?.defaultPricePerLiter ?? 0);
  const invoiceAmount = closing?.milkInvoiceAmount ?? projectedInvoice;
  const preview = calculateMonthlyClosing({
    milkInvoiceAmount: invoiceAmount,
    totalExpenses: expenseSummary.totalAmount,
    totalFeedAmount: expenseSummary.feedAmount,
    totalLiters: productionSummary.totalLiters,
  });
  const canClose = Boolean(context.activeFarm) && productionSummary.totalLiters > 0;
  const baseQuery = `farmId=${context.activeFarmId}&referenceMonth=${context.referenceMonth}`;

  return (
    <AppShell
      activeFarmId={context.activeFarmId}
      activeHref="/fechamento"
      eyebrow="Fechamento mensal"
      farms={context.farms}
      referenceMonth={context.referenceMonth}
      referenceMonthLabel={context.referenceMonthLabel}
      title="Fechamento"
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_0.75fr]">
        <PageCard
          description="Informe a competência e o período real da nota do laticínio. O cálculo usa produção e despesas dentro dessas datas."
          title={`Fechar ${context.referenceMonthLabel}`}
        >
          <form action={submitMonthlyClosingForm} className="grid gap-4">
            <input name="farmId" type="hidden" value={context.activeFarmId} />
            {closing ? (
              <EditModeBanner
                cancelHref={`/fechamento?${baseQuery}`}
                entity="Fechamento salvo"
                summary={`${formatReferenceMonth(closing.referenceMonth)} - ${formatDateRange(
                  closing.periodStart,
                  closing.periodEnd,
                )}`}
              />
            ) : null}
            <div className="grid gap-4 md:grid-cols-3">
              <FormField label="Mês de referência">
                <input
                  className="field"
                  defaultValue={context.referenceMonth}
                  name="referenceMonth"
                  required
                  type="month"
                />
              </FormField>
              <FormField label="Data inicial">
                <input className="field" defaultValue={range.startDate} name="periodStart" required type="date" />
              </FormField>
              <FormField label="Data final">
                <input className="field" defaultValue={range.endDate} name="periodEnd" required type="date" />
              </FormField>
            </div>

            <FormField label="Valor total da nota">
              <input
                className="field"
                defaultValue={invoiceAmount > 0 ? invoiceAmount.toFixed(2) : undefined}
                min="0"
                name="milkInvoiceAmount"
                required
                step="0.01"
                type="number"
              />
            </FormField>

            <div className="grid gap-3 rounded-lg border border-[var(--border)] bg-[var(--milk-white)] p-4 text-sm md:grid-cols-3">
              <div>
                <span className="text-[color:var(--muted)]">Período apurado</span>
                <strong className="block text-base">{formatDateRange(range.startDate, range.endDate)}</strong>
              </div>
              <div>
                <span className="text-[color:var(--muted)]">Litros apurados</span>
                <strong className="block text-lg">{formatLiters(productionSummary.totalLiters)}</strong>
              </div>
              <div>
                <span className="text-[color:var(--muted)]">Despesas totais</span>
                <strong className="block text-lg">{formatCurrency(expenseSummary.totalAmount)}</strong>
              </div>
            </div>

            <button className="primary-button" disabled={!canClose} type="submit">
              Calcular e salvar fechamento
            </button>
          </form>

          {!context.activeFarm ? (
            <SetupCallout title="Cadastre uma fazenda">
              O fechamento mensal precisa de uma fazenda ativa.
            </SetupCallout>
          ) : productionSummary.totalLiters <= 0 ? (
            <div className="mt-4">
              <SetupCallout title="Produção ainda não registrada">
                Registre litros produzidos entre {formatDateRange(range.startDate, range.endDate)} antes de fechar.
              </SetupCallout>
            </div>
          ) : null}
        </PageCard>

        <PageCard title={closing ? "Fechamento salvo" : "Prévia calculada"}>
          <div className="grid gap-3">
            <Indicator label="Preço real por litro" value={formatCurrency(preview.realPricePerLiter)} />
            <Indicator label="Custo da ração por litro" value={formatCurrency(preview.feedCostPerLiter)} />
            <Indicator label="Resultado livre após ração" value={formatCurrency(preview.resultAfterFeedPerLiter)} />
            <Indicator label="Custo total por litro" value={formatCurrency(preview.totalCostPerLiter)} />
            <Indicator label="Resultado líquido por litro" value={formatCurrency(preview.netResultPerLiter)} />
            <Indicator label="Lucro líquido" value={formatCurrency(preview.netProfit)} emphasis />
          </div>
          {closing?.closedAt ? (
            <p className="mt-4 text-xs text-[color:var(--muted)]">
              Salvo em {closing.closedAt.toLocaleString("pt-BR")} para {formatDateRange(closing.periodStart, closing.periodEnd)}.
            </p>
          ) : null}
        </PageCard>

        <PageCard title="Histórico de fechamentos">
          {closingHistory.length === 0 ? (
            <SetupCallout>Nenhum fechamento salvo para esta fazenda.</SetupCallout>
          ) : (
            <div className="overflow-hidden rounded-lg border border-[var(--border)]">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-[var(--milk-white)]">
                  <tr>
                    <th className="border-b border-[var(--border)] px-3 py-2 text-left">Competência</th>
                    <th className="border-b border-[var(--border)] px-3 py-2 text-left">Período</th>
                    <th className="border-b border-[var(--border)] px-3 py-2 text-right">Lucro</th>
                    <th className="border-b border-[var(--border)] px-3 py-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {closingHistory.map((item) => (
                    <tr key={item.id}>
                      <td className="border-t border-[var(--border)] px-3 py-2">
                        {formatReferenceMonth(item.referenceMonth)}
                      </td>
                      <td className="border-t border-[var(--border)] px-3 py-2">
                        <span className="block">{formatDateRange(item.periodStart, item.periodEnd)}</span>
                        <span className="text-xs text-[color:var(--muted)]">{formatLiters(item.totalLiters)}</span>
                      </td>
                      <td className="border-t border-[var(--border)] px-3 py-2 text-right font-bold">
                        {formatCurrency(item.netProfit)}
                      </td>
                      <td className="border-t border-[var(--border)] px-3 py-2">
                        <div className="row-actions">
                          <form action={submitRecalculateMonthlyClosingForm}>
                            <input name="farmId" type="hidden" value={context.activeFarmId} />
                            <input name="closingId" type="hidden" value={item.id} />
                            <button
                              className="action-link"
                              type="submit"
                            >
                              Recalcular
                            </button>
                          </form>
                          <form action={submitDeleteMonthlyClosingForm}>
                            <input name="farmId" type="hidden" value={context.activeFarmId} />
                            <input name="closingId" type="hidden" value={item.id} />
                            <ConfirmSubmitButton
                              className="danger-action"
                              message="Excluir este fechamento?"
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

function Indicator({ emphasis, label, value }: { emphasis?: boolean; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--milk-white)] p-3">
      <span className="text-sm font-semibold text-[color:var(--muted)]">{label}</span>
      <strong className={emphasis ? "text-lg text-[color:var(--farm-green)]" : "text-sm"}>{value}</strong>
    </div>
  );
}
