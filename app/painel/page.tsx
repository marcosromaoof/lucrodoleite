import {
  Beef,
  CircleDollarSign,
  Droplet,
  FlaskConical,
  HandCoins,
  Milk,
  PlusCircle,
  Sprout,
  Tag,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { DashboardAction } from "@/components/dashboard/dashboard-action";
import { EmptyChart } from "@/components/dashboard/empty-chart";
import { FeedComparisonPanel } from "@/components/dashboard/feed-comparison-panel";
import { IndicatorCard } from "@/components/dashboard/indicator-card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { MonthlyChart } from "@/components/dashboard/monthly-chart";
import { SetupCallout } from "@/components/ui/setup-callout";
import { getDb } from "@/db/client";
import { getOperationalContext } from "@/lib/app/operational-context";
import type { PageSearchParams } from "@/lib/app/search-params";
import { calculateMonthlyEstimate, safeDivide } from "@/lib/calculations/financial";
import { getMonthDateRange, getTodayDateKey } from "@/lib/dates/month";
import { formatCurrency, formatLiters } from "@/lib/formatters/number";
import { getMonthlyExpenseSummaryByReferenceMonth, listExpensesByReferenceMonth } from "@/lib/repositories/expenses";
import { listFeedBrands } from "@/lib/repositories/feed-brands";
import { listFeedTestResults } from "@/lib/repositories/feed-tests";
import { getMonthlyProductionSummary, listProductionsByMonth } from "@/lib/repositories/production";

export const dynamic = "force-dynamic";

type PainelPageProps = {
  searchParams?: PageSearchParams;
};

function buildChartRows(
  productions: Awaited<ReturnType<typeof listProductionsByMonth>>,
  expenses: Awaited<ReturnType<typeof listExpensesByReferenceMonth>>,
) {
  const rowsByDate = new Map<string, { date: string; expenseAmount: number; liters: number }>();

  for (const production of productions) {
    rowsByDate.set(production.date, {
      date: production.date,
      expenseAmount: rowsByDate.get(production.date)?.expenseAmount ?? 0,
      liters: production.liters,
    });
  }

  for (const expense of expenses) {
    const current = rowsByDate.get(expense.date) ?? {
      date: expense.date,
      expenseAmount: 0,
      liters: 0,
    };

    rowsByDate.set(expense.date, {
      ...current,
      expenseAmount: current.expenseAmount + expense.amount,
    });
  }

  return [...rowsByDate.values()].sort((left, right) => left.date.localeCompare(right.date)).slice(-12);
}

export default async function PainelPage({ searchParams }: PainelPageProps) {
  const context = await getOperationalContext(searchParams);
  const range = getMonthDateRange(context.referenceMonth);
  const todayDate = getTodayDateKey();

  const [productionSummary, expenseSummary, productions, expenses, feedBrands, feedTests] = context.activeFarm
    ? await Promise.all([
        getMonthlyProductionSummary(getDb(), context.activeFarm.id, range.startDate, range.endDate, todayDate),
        getMonthlyExpenseSummaryByReferenceMonth(getDb(), context.activeFarm.id, context.referenceMonth),
        listProductionsByMonth(getDb(), context.activeFarm.id, range.startDate, range.endDate),
        listExpensesByReferenceMonth(getDb(), context.activeFarm.id, context.referenceMonth),
        listFeedBrands(getDb(), context.activeFarm.id),
        listFeedTestResults(getDb(), context.activeFarm.id),
      ])
    : [
        { recordCount: 0, todayLiters: 0, totalLiters: 0 },
        { feedAmount: 0, totalAmount: 0 },
        [],
        [],
        [],
        [],
      ];

  const pricePerLiter = context.activeFarm?.defaultPricePerLiter ?? 0;
  const estimate = calculateMonthlyEstimate({
    estimatedPricePerLiter: pricePerLiter,
    totalExpenses: expenseSummary.totalAmount,
    totalLiters: productionSummary.totalLiters,
  });
  const feedCostPerLiter = safeDivide(expenseSummary.feedAmount, productionSummary.totalLiters);
  const resultAfterFeedPerLiter = pricePerLiter - feedCostPerLiter;
  const chartRows = buildChartRows(productions, expenses);
  const hasFarm = Boolean(context.activeFarm);
  const hasProduction = productionSummary.recordCount > 0;

  return (
    <AppShell
      activeFarmId={context.activeFarmId}
      activeHref="/painel"
      eyebrow="Projeto em implantação"
      farms={context.farms}
      referenceMonth={context.referenceMonth}
      referenceMonthLabel={context.referenceMonthLabel}
      title="Painel"
    >
      <div className="space-y-4 p-4 sm:p-6">
        <section className="grid gap-3 xl:grid-cols-6">
          <MetricCard
            helper="Registro de hoje"
            icon={Milk}
            label="Produção do dia"
            status={hasFarm ? todayDate : "Sem fazenda"}
            value={hasFarm ? formatLiters(productionSummary.todayLiters) : "--"}
          />
          <MetricCard
            helper={`${productionSummary.recordCount} dias registrados`}
            icon={Droplet}
            label="Litros no mês"
            status={hasProduction ? "Dados reais" : "Sem produção"}
            tone="blue"
            value={hasFarm ? formatLiters(productionSummary.totalLiters) : "--"}
          />
          <MetricCard
            helper="Padrão da fazenda"
            icon={Tag}
            label="Preço por litro"
            status={pricePerLiter > 0 ? "Configurado" : "Não informado"}
            value={pricePerLiter > 0 ? formatCurrency(pricePerLiter) : "--"}
          />
          <MetricCard
            helper="Total no mês"
            icon={Wallet}
            label="Despesas do mês"
            status={expenses.length > 0 ? `${expenses.length} lançamentos` : "Sem despesas"}
            value={hasFarm ? formatCurrency(expenseSummary.totalAmount) : "--"}
          />
          <MetricCard
            helper="Receita estimada - despesas"
            icon={HandCoins}
            label="Lucro estimado"
            status={pricePerLiter > 0 && hasProduction ? "Calculado" : "Aguardando preço/litros"}
            value={pricePerLiter > 0 && hasFarm ? formatCurrency(estimate.estimatedProfit) : "--"}
          />
          <MetricCard
            helper="Lucro estimado por litro"
            icon={CircleDollarSign}
            label="Resultado por litro"
            status={hasProduction ? "Calculado" : "Sem produção"}
            value={hasProduction ? formatCurrency(estimate.estimatedResultPerLiter) : "--"}
          />
        </section>

        <section className="grid gap-3 lg:grid-cols-3">
          <DashboardAction href="/producao" icon={PlusCircle} label="Registrar produção" />
          <DashboardAction href="/despesas" icon={Wallet} label="Lançar despesa" variant="wood" />
          <DashboardAction href="/racoes" icon={FlaskConical} label="Cadastrar ração" variant="outline" />
        </section>

        {!hasFarm ? (
          <SetupCallout title="Cadastre a primeira fazenda">
            O painel só calcula indicadores depois que houver uma fazenda real cadastrada.
          </SetupCallout>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Indicadores do mês</h2>
            <div className="mt-4 grid divide-y divide-[var(--border)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <IndicatorCard
                helper={hasProduction ? "Receita estimada menos despesas" : "Aguardando produção"}
                icon={CircleDollarSign}
                label="Resultado líquido por litro"
                value={hasProduction ? formatCurrency(estimate.estimatedResultPerLiter) : "--"}
              />
              <IndicatorCard
                helper={expenseSummary.feedAmount > 0 ? "Categoria Ração" : "Sem despesas de ração"}
                icon={Beef}
                label="Custo da ração por litro"
                tone="wood"
                value={hasProduction ? formatCurrency(feedCostPerLiter) : "--"}
              />
              <IndicatorCard
                helper={hasProduction ? "Preço por litro menos ração" : "Aguardando produção"}
                icon={Sprout}
                label="Resultado livre após ração"
                value={pricePerLiter > 0 && hasProduction ? formatCurrency(resultAfterFeedPerLiter) : "--"}
              />
            </div>
          </div>

          {chartRows.length > 0 ? <MonthlyChart rows={chartRows} /> : <EmptyChart />}
        </section>

        <FeedComparisonPanel brands={feedBrands} tests={feedTests} />
      </div>
    </AppShell>
  );
}
