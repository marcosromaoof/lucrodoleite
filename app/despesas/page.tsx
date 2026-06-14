import Link from "next/link";
import { submitDeleteExpenseForm, submitExpenseForm } from "@/app/despesas/actions";
import { AppShell } from "@/components/app-shell/app-shell";
import { ExpenseCategoryFields } from "@/components/expenses/expense-category-fields";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { FormField } from "@/components/ui/form-field";
import { PageCard } from "@/components/ui/page-card";
import { SetupCallout } from "@/components/ui/setup-callout";
import { getDb } from "@/db/client";
import { getOperationalContext } from "@/lib/app/operational-context";
import { getSearchParam, type PageSearchParams } from "@/lib/app/search-params";
import { formatDateRange, getCycleDateRange, getTodayDateKey } from "@/lib/dates/month";
import { formatCurrency } from "@/lib/formatters/number";
import { listExpensesByMonth, summarizeExpensesByCategory } from "@/lib/repositories/expenses";
import { listFeedBrands } from "@/lib/repositories/feed-brands";
import { listFeedTestResults } from "@/lib/repositories/feed-tests";
import { expenseCategories, expenseQuantityEligibleCategories, expenseUnits } from "@/lib/validations/expense";

export const dynamic = "force-dynamic";

type DespesasPageProps = {
  searchParams?: PageSearchParams;
};

export default async function DespesasPage({ searchParams }: DespesasPageProps) {
  const context = await getOperationalContext(searchParams);
  const range = context.activeFarm
    ? getCycleDateRange(
        context.referenceMonth,
        context.activeFarm.closingCycleStartDay,
        context.activeFarm.closingCycleEndDay,
      )
    : { startDate: `${context.referenceMonth}-01`, endDate: `${context.referenceMonth}-31` };
  const editExpenseId = await getSearchParam(searchParams, "editExpenseId");
  const [expenses, summaries, feedBrands, feedTests] = context.activeFarm
    ? await Promise.all([
        listExpensesByMonth(getDb(), context.activeFarm.id, range.startDate, range.endDate),
        summarizeExpensesByCategory(getDb(), context.activeFarm.id, range.startDate, range.endDate),
        listFeedBrands(getDb(), context.activeFarm.id),
        listFeedTestResults(getDb(), context.activeFarm.id, 100),
      ])
    : [[], [], [], []];
  const editingExpense = expenses.find((expense) => expense.id === editExpenseId) ?? null;
  const baseQuery = `farmId=${context.activeFarmId}&referenceMonth=${context.referenceMonth}`;

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
      <div className="grid gap-5 p-5 sm:p-8 xl:grid-cols-[1fr_0.85fr]">
        <PageCard
          description={`Cadastre despesas reais do ciclo ${formatDateRange(range.startDate, range.endDate)}. Em categorias elegíveis, informe volumes e valor unitário.`}
          title={editingExpense ? "Editar despesa" : "Nova despesa"}
        >
          <form action={submitExpenseForm} className="grid gap-4">
            <input name="farmId" type="hidden" value={context.activeFarmId} />
            {editingExpense ? <input name="expenseId" type="hidden" value={editingExpense.id} /> : null}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Data">
                <input
                  className="field"
                  defaultValue={editingExpense?.date ?? getTodayDateKey()}
                  name="date"
                  required
                  type="date"
                />
              </FormField>
              <FormField label="Mês de referência">
                <input
                  className="field"
                  defaultValue={editingExpense?.referenceMonth ?? context.referenceMonth}
                  name="referenceMonth"
                  required
                  type="month"
                />
              </FormField>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ExpenseCategoryFields
                categories={expenseCategories}
                defaultCategory={editingExpense?.category}
                defaultQuantity={editingExpense?.quantity}
                defaultUnit={editingExpense?.unit}
                defaultUnitPrice={editingExpense?.unitPrice}
                eligibleCategories={expenseQuantityEligibleCategories}
                units={expenseUnits}
              />
              <FormField label="Valor total">
                <input
                  className="field"
                  defaultValue={editingExpense?.amount}
                  min="0"
                  name="amount"
                  step="0.01"
                  type="number"
                />
              </FormField>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Marca de ração">
                <select className="field" defaultValue={editingExpense?.feedBrandId ?? ""} name="feedBrandId">
                  <option value="">Sem vínculo</option>
                  {feedBrands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Teste de ração">
                <select className="field" defaultValue={editingExpense?.feedTestId ?? ""} name="feedTestId">
                  <option value="">Sem vínculo</option>
                  {feedTests.map((test) => (
                    <option key={test.id} value={test.id}>
                      {test.testName} - {test.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField label="Fornecedor">
              <input
                className="field"
                defaultValue={editingExpense?.supplier ?? undefined}
                maxLength={120}
                name="supplier"
                type="text"
              />
            </FormField>

            <FormField label="Descrição">
              <textarea
                className="field min-h-28 resize-y"
                defaultValue={editingExpense?.description ?? undefined}
                maxLength={240}
                name="description"
                required
              />
            </FormField>

            <div className="flex flex-wrap gap-3">
              <button className="primary-button flex-1" disabled={!context.activeFarm} type="submit">
                {editingExpense ? "Atualizar despesa" : "Lançar despesa"}
              </button>
              {editingExpense ? (
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--border)] px-4 font-black text-[color:var(--farm-green)]"
                  href={`/despesas?${baseQuery}`}
                >
                  Cancelar
                </Link>
              ) : null}
            </div>
          </form>
        </PageCard>

        <PageCard title="Resumo e lançamentos">
          {!context.activeFarm ? (
            <SetupCallout title="Cadastre uma fazenda">
              As despesas precisam de uma fazenda ativa antes de serem salvas.
            </SetupCallout>
          ) : summaries.length === 0 ? (
            <SetupCallout title="Sem despesas no período">
              Nenhuma despesa encontrada entre {formatDateRange(range.startDate, range.endDate)}.
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
                <thead className="bg-[var(--milk-white)]">
                  <tr>
                    <th className="border-b border-[var(--border)] px-3 py-2 text-left">Data</th>
                    <th className="border-b border-[var(--border)] px-3 py-2 text-left">Categoria</th>
                    <th className="border-b border-[var(--border)] px-3 py-2 text-right">Valor</th>
                    <th className="border-b border-[var(--border)] px-3 py-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="border-t border-[var(--border)] px-3 py-2">{expense.date}</td>
                      <td className="border-t border-[var(--border)] px-3 py-2">
                        <span className="font-semibold">{expense.category}</span>
                        {expense.quantity !== null && expense.unit ? (
                          <span className="block text-xs text-[color:var(--muted)]">
                            {expense.quantity} {expense.unit}
                          </span>
                        ) : null}
                      </td>
                      <td className="border-t border-[var(--border)] px-3 py-2 text-right font-bold">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="border-t border-[var(--border)] px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <Link
                            className="rounded-md border border-[var(--border)] px-2 py-1 font-bold text-[color:var(--farm-green)]"
                            href={`/despesas?${baseQuery}&editExpenseId=${expense.id}`}
                          >
                            Editar
                          </Link>
                          <form action={submitDeleteExpenseForm}>
                            <input name="farmId" type="hidden" value={context.activeFarmId} />
                            <input name="expenseId" type="hidden" value={expense.id} />
                            <ConfirmSubmitButton
                              className="rounded-md border border-[var(--wood)] px-2 py-1 font-bold text-[color:var(--wood)]"
                              message="Excluir esta despesa?"
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
          ) : null}
        </PageCard>
      </div>
    </AppShell>
  );
}
