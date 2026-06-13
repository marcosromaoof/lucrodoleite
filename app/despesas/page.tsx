import { submitExpenseForm } from "@/app/despesas/actions";
import { AppShell } from "@/components/app-shell/app-shell";
import { FormField } from "@/components/ui/form-field";
import { PageCard } from "@/components/ui/page-card";
import { SetupCallout } from "@/components/ui/setup-callout";
import { getDb } from "@/db/client";
import { getOperationalContext } from "@/lib/app/operational-context";
import type { PageSearchParams } from "@/lib/app/search-params";
import { getTodayDateKey } from "@/lib/dates/month";
import { formatCurrency } from "@/lib/formatters/number";
import {
  listExpensesByReferenceMonth,
  summarizeExpensesByCategoryByReferenceMonth,
} from "@/lib/repositories/expenses";
import { expenseCategories } from "@/lib/validations/expense";

export const dynamic = "force-dynamic";

type DespesasPageProps = {
  searchParams?: PageSearchParams;
};

export default async function DespesasPage({ searchParams }: DespesasPageProps) {
  const context = await getOperationalContext(searchParams);
  const expenses = context.activeFarm
    ? await listExpensesByReferenceMonth(getDb(), context.activeFarm.id, context.referenceMonth)
    : [];
  const summaries = context.activeFarm
    ? await summarizeExpensesByCategoryByReferenceMonth(getDb(), context.activeFarm.id, context.referenceMonth)
    : [];

  return (
    <AppShell
      activeFarmId={context.activeFarmId}
      activeHref="/despesas"
      eyebrow="Controle de gastos"
      farms={context.farms}
      referenceMonth={context.referenceMonth}
      referenceMonthLabel={context.referenceMonthLabel}
      title="Despesas"
    >
      <div className="grid gap-5 p-5 sm:p-8 xl:grid-cols-[1fr_0.75fr]">
        <PageCard description="Cadastre despesas reais por categoria e mês de referência." title="Nova despesa">
          <form action={submitExpenseForm} className="grid gap-4">
            <input name="farmId" type="hidden" value={context.activeFarmId} />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Data">
                <input className="field" defaultValue={getTodayDateKey()} name="date" required type="date" />
              </FormField>
              <FormField label="Mês de referência">
                <input className="field" defaultValue={context.referenceMonth} name="referenceMonth" required type="month" />
              </FormField>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Categoria">
                <select className="field" name="category" required>
                  <option value="">Selecione</option>
                  {expenseCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Valor">
                <input className="field" min="0" name="amount" required step="0.01" type="number" />
              </FormField>
            </div>

            <FormField label="Fornecedor">
              <input className="field" maxLength={120} name="supplier" type="text" />
            </FormField>

            <FormField label="Descrição">
              <textarea className="field min-h-28 resize-y" maxLength={240} name="description" required />
            </FormField>

            <button className="primary-button" disabled={!context.activeFarm} type="submit">
              Lançar despesa
            </button>
          </form>
        </PageCard>

        <PageCard title="Resumo por categoria">
          {!context.activeFarm ? (
            <SetupCallout title="Cadastre uma fazenda">
              As despesas precisam de uma fazenda ativa antes de serem salvas.
            </SetupCallout>
          ) : summaries.length === 0 ? (
            <SetupCallout title="Sem despesas no mês">
              Nenhuma despesa encontrada para {context.referenceMonthLabel}.
            </SetupCallout>
          ) : (
            <div className="grid gap-3">
              {summaries.map((summary) => (
                <div
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--milk-white)] p-3"
                  key={summary.category}
                >
                  <span className="font-semibold">{summary.category}</span>
                  <strong>{formatCurrency(summary.totalAmount)}</strong>
                </div>
              ))}
            </div>
          )}
          {expenses.length > 0 ? (
            <div className="mt-5 overflow-hidden rounded-lg border border-[var(--border)]">
              <table className="w-full border-collapse text-sm">
                <tbody>
                  {expenses.slice(0, 8).map((expense) => (
                    <tr key={expense.id}>
                      <td className="border-t border-[var(--border)] px-3 py-2">{expense.date}</td>
                      <td className="border-t border-[var(--border)] px-3 py-2">{expense.category}</td>
                      <td className="border-t border-[var(--border)] px-3 py-2 text-right font-bold">
                        {formatCurrency(expense.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </PageCard>
      </div>
    </AppShell>
  );
}
