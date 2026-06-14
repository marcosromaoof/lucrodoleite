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
import { recoverLegacyFarmDataAction } from "@/lib/actions/recover-legacy-data";
import { AppShell } from "@/components/app-shell/app-shell";
import { DashboardAction } from "@/components/dashboard/dashboard-action";
import { EmptyChart } from "@/components/dashboard/empty-chart";
import { FeedComparisonPanel } from "@/components/dashboard/feed-comparison-panel";
import { IndicatorCard } from "@/components/dashboard/indicator-card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { MonthlyChart } from "@/components/dashboard/monthly-chart";
import { SetupCallout } from "@/components/ui/setup-callout";
import { SubmitButton } from "@/components/ui/submit-button";
import { getDb } from "@/db/client";
import { getOperationalContext } from "@/lib/app/operational-context";
import type { PageSearchParams } from "@/lib/app/search-params";
import { calculateMonthlyEstimate, safeDivide } from "@/lib/calculations/financial";
import { getCycleDateRange, getTodayDateKey } from "@/lib/dates/month";
import { formatCurrency, formatLiters } from "@/lib/formatters/number";
import { getMonthlyExpenseSummary, listExpensesByMonth } from "@/lib/repositories/expenses";
import { listFeedBrands } from "@/lib/repositories/feed-brands";
import { listFeedTestResults } from "@/lib/repositories/feed-tests";
import { getMonthlyProductionSummary, listProductionsByMonth } from "@/lib/repositories/production";

export const dynamic = "force-dynamic";

type PainelPageProps = {
  searchParams?: PageSearchParams;
};

function buildChartRows(
  productions: Awaited<ReturnType<typeof listProductionsByMonth>>,
  expenses: Awaited<ReturnType<typeof listExpensesByMonth>>,
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
  const range = context.activeFarm
    ? getCycleDateRange(
        context.referenceMonth,
        context.activeFarm.closingCycleStartDay,
        context.activeFarm.closingCycleEndDay,
      )
    : { startDate: `${context.referenceMonth}-01`, endDate: `${context.referenceMonth}-31` };
  const todayDate = getTodayDateKey();

  const [productionSummary, expenseSummary, productions, expenses, feedBrands, feedTests] = context.activeFarm
    ? await Promise.all([
        getMonthlyProductionSummary(getDb(), context.activeFarm.id, range.startDate, range.endDate, todayDate),
        getMonthlyExpenseSummary(getDb(), context.activeFarm.id, range.startDate, range.endDate),
        listProductionsByMonth(getDb(), context.activeFarm.id, range.startDate, range.endDate),
        listExpensesByMonth(getDb(), context.activeFarm.id, range.startDate, range.endDate),
        listFeedBrands(getDb(), context.activeFarm.id),
        listFeedTestResults(getDb(), context.activeFarm.id),
      ])
    : [
        { recordCount: 0, todayLiters: 0, totalLiters: 0 },
        { feedAmount: 0, mineralAmount: 0, nutritionAmount: 0, silageAmount: 0, totalAmount: 0 },
        [],
        [],
        [],
        [],
      ];

  const pricePerLiter = context.activeFarm?.defaultPricePerLiter ?? 0;
  const estimate = calculateMonthlyEstimate({
    estimatedPricePerLiter: pricePerLiter,
    totalNutritionAmount: expenseSummary.nutritionAmount,
    totalExpenses: expenseSummary.totalAmount,
    totalLiters: productionSummary.totalLiters,
  });
  const nutritionCostPerLiter = safeDivide(expenseSummary.nutritionAmount, productionSummary.totalLiters);
  const resultAfterNutritionPerLiter = pricePerLiter - nutritionCostPerLiter;
  const chartRows = buildChartRows(productions, expenses);
  const hasFarm = Boolean(context.activeFarm);
  const hasProduction = productionSummary.recordCount > 0;
  const hasEstimate = pricePerLiter > 0 && hasProduction;
  const hasLoss = hasEstimate && estimate.estimatedProfit < 0;
  const hasLossPerLiter = hasProduction && estimate.estimatedResultPerLiter < 0;

  return (
    <AppShell
      activeFarmId={context.activeFarmId}
      activeHref="/painel"
      eyebrow="Gestão"
      farms={context.farms}
      referenceMonth={context.referenceMonth}
      referenceMonthLabel={context.referenceMonthLabel}
      title="Painel"
    >
      <div className="dashboard-stack">
        <section className="metric-grid">
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
            label="Resultado estimado"
            negative={hasLoss}
            status={hasEstimate ? "Calculado" : hasProduction ? "Aguardando preço" : "Aguardando produção"}
            value={hasEstimate ? formatCurrency(estimate.estimatedProfit) : "--"}
          />
          <MetricCard
            helper="Lucro estimado por litro"
            icon={CircleDollarSign}
            label="Resultado por litro"
            negative={hasLossPerLiter}
            status={hasProduction ? "Calculado" : "Sem produção"}
            value={hasProduction ? formatCurrency(estimate.estimatedResultPerLiter) : "--"}
          />
        </section>

        <section className="quick-action-grid">
          <DashboardAction href="/producao" icon={PlusCircle} label="Registrar produção" />
          <DashboardAction href="/despesas" icon={Wallet} label="Lançar despesa" variant="wood" />
          <DashboardAction href="/racoes" icon={FlaskConical} label="Cadastrar ração" variant="outline" />
        </section>

        {!hasFarm ? (
          <SetupCallout title="Recuperar dados antigos">
            <p>
              Se voce ja tinha producao, despesas ou fazenda cadastrada antes do login no dominio novo, vincule esses
              registros a sua conta atual.
            </p>
            <form
              action={recoverLegacyFarmDataAction}
              className="mt-3"
              data-feedback-pending="Recuperando dados antigos..."
              data-feedback-success="Dados recuperados. Atualizando painel."
            >
              <SubmitButton className="primary-button w-full sm:w-auto" pendingLabel="Recuperando...">
                Recuperar dados antigos
              </SubmitButton>
            </form>
            <p className="mt-3">
              Se nao houver dados legados no banco, cadastre a primeira fazenda para liberar os indicadores.
            </p>
          </SetupCallout>
        ) : null}

        <section className="dashboard-panel-grid">
          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Indicadores do mês</h2>
                <p className="panel-subtitle">Custos e resultado por litro no período</p>
              </div>
            </div>
            <div className="indicator-grid mt-4">
              <IndicatorCard
                helper={hasProduction ? "Receita estimada menos despesas" : "Aguardando produção"}
                icon={CircleDollarSign}
                label="Resultado líquido por litro"
                negative={hasLossPerLiter}
                value={hasProduction ? formatCurrency(estimate.estimatedResultPerLiter) : "--"}
              />
              <IndicatorCard
                helper={expenseSummary.nutritionAmount > 0 ? "Ração, silagem e sal mineral" : "Sem custos de alimentação"}
                icon={Beef}
                label="Custo da alimentação por litro"
                tone="wood"
                value={hasProduction ? formatCurrency(nutritionCostPerLiter) : "--"}
              />
              <IndicatorCard
                helper={hasProduction ? "Receita menos alimentação" : "Aguardando produção"}
                icon={Sprout}
                label="Lucro livre após alimentação"
                negative={pricePerLiter > 0 && hasProduction && resultAfterNutritionPerLiter < 0}
                value={pricePerLiter > 0 && hasProduction ? formatCurrency(resultAfterNutritionPerLiter) : "--"}
              />
            </div>
          </div>

          {chartRows.length > 0 ? <MonthlyChart rows={chartRows} /> : <EmptyChart />}

          <FeedComparisonPanel brands={feedBrands} tests={feedTests} />
        </section>
      </div>
    </AppShell>
  );
}
