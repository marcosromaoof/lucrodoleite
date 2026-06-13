import { submitMonthlyClosingForm } from "@/app/fechamento/actions";
import { AppShell } from "@/components/app-shell/app-shell";
import { FormField } from "@/components/ui/form-field";
import { PageCard } from "@/components/ui/page-card";
import { SetupCallout } from "@/components/ui/setup-callout";
import { getDb } from "@/db/client";
import { getOperationalContext } from "@/lib/app/operational-context";
import type { PageSearchParams } from "@/lib/app/search-params";
import { calculateMonthlyClosing } from "@/lib/calculations/financial";
import { formatReferenceMonth, getMonthDateRange, getTodayDateKey } from "@/lib/dates/month";
import { formatCurrency, formatLiters } from "@/lib/formatters/number";
import { getMonthlyExpenseSummaryByReferenceMonth } from "@/lib/repositories/expenses";
import { getMonthlyClosing, listMonthlyClosings } from "@/lib/repositories/monthly-closings";
import { getMonthlyProductionSummary } from "@/lib/repositories/production";

export const dynamic = "force-dynamic";

type FechamentoPageProps = {
  searchParams?: PageSearchParams;
};

export default async function FechamentoPage({ searchParams }: FechamentoPageProps) {
  const context = await getOperationalContext(searchParams);
  const range = getMonthDateRange(context.referenceMonth);
  const activeFarm = context.activeFarm;

  const [productionSummary, expenseSummary, closing, closingHistory] = activeFarm
    ? await (async () => {
        const db = getDb();

        return Promise.all([
          getMonthlyProductionSummary(db, activeFarm.id, range.startDate, range.endDate, getTodayDateKey()),
          getMonthlyExpenseSummaryByReferenceMonth(db, activeFarm.id, context.referenceMonth),
          getMonthlyClosing(db, activeFarm.id, context.referenceMonth),
          listMonthlyClosings(db, activeFarm.id),
        ]);
      })()
    : [
        { recordCount: 0, todayLiters: 0, totalLiters: 0 },
        { feedAmount: 0, totalAmount: 0 },
        null,
        [],
      ];

  const projectedInvoice =
    productionSummary.totalLiters * (activeFarm?.defaultPricePerLiter ?? 0);
  const invoiceAmount = closing?.milkInvoiceAmount ?? projectedInvoice;
  const preview = calculateMonthlyClosing({
    milkInvoiceAmount: invoiceAmount,
    totalExpenses: expenseSummary.totalAmount,
    totalFeedAmount: expenseSummary.feedAmount,
    totalLiters: productionSummary.totalLiters,
  });
  const canClose = Boolean(context.activeFarm) && productionSummary.totalLiters > 0;

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
      <div className="grid gap-5 p-5 sm:p-8 xl:grid-cols-[1fr_0.75fr]">
        <PageCard
          description="O fechamento usa produção real do mês e despesas por mês de referência. Informe o valor da nota do leite para salvar o resultado."
          title={`Fechar ${context.referenceMonthLabel}`}
        >
          <form action={submitMonthlyClosingForm} className="grid gap-4">
            <input name="farmId" type="hidden" value={context.activeFarmId} />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Mês de referência">
                <input
                  className="field"
                  defaultValue={context.referenceMonth}
                  name="referenceMonth"
                  required
                  type="month"
                />
              </FormField>
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
            </div>

            <div className="grid gap-3 rounded-lg border border-[var(--border)] bg-[var(--milk-white)] p-4 text-sm md:grid-cols-3">
              <div>
                <span className="text-[color:var(--muted)]">Litros apurados</span>
                <strong className="block text-lg">{formatLiters(productionSummary.totalLiters)}</strong>
              </div>
              <div>
                <span className="text-[color:var(--muted)]">Despesa com ração</span>
                <strong className="block text-lg">{formatCurrency(expenseSummary.feedAmount)}</strong>
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
                Registre litros produzidos em {context.referenceMonthLabel} antes de fechar o mês.
              </SetupCallout>
            </div>
          ) : null}
        </PageCard>

        <PageCard title={closing ? "Fechamento salvo" : "Prévia calculada"}>
          <div className="grid gap-3">
            <Indicator label="Preço real por litro" value={formatCurrency(preview.realPricePerLiter)} />
            <Indicator label="Custo da ração por litro" value={formatCurrency(preview.feedCostPerLiter)} />
            <Indicator
              label="Resultado livre após ração"
              value={formatCurrency(preview.resultAfterFeedPerLiter)}
            />
            <Indicator label="Custo total por litro" value={formatCurrency(preview.totalCostPerLiter)} />
            <Indicator label="Resultado líquido por litro" value={formatCurrency(preview.netResultPerLiter)} />
            <Indicator label="Lucro líquido" value={formatCurrency(preview.netProfit)} emphasis />
          </div>
          {closing?.closedAt ? (
            <p className="mt-4 text-xs text-[color:var(--muted)]">
              Salvo em {closing.closedAt.toLocaleString("pt-BR")}.
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
                    <th className="border-b border-[var(--border)] px-3 py-2 text-left">Mês</th>
                    <th className="border-b border-[var(--border)] px-3 py-2 text-right">Litros</th>
                    <th className="border-b border-[var(--border)] px-3 py-2 text-right">Lucro</th>
                  </tr>
                </thead>
                <tbody>
                  {closingHistory.map((item) => (
                    <tr key={item.id}>
                      <td className="border-t border-[var(--border)] px-3 py-2">
                        {formatReferenceMonth(item.referenceMonth)}
                      </td>
                      <td className="border-t border-[var(--border)] px-3 py-2 text-right">
                        {formatLiters(item.totalLiters)}
                      </td>
                      <td className="border-t border-[var(--border)] px-3 py-2 text-right font-bold">
                        {formatCurrency(item.netProfit)}
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
