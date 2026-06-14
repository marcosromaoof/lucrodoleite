import Link from "next/link";
import { submitDeleteExpenseForm, submitExpenseForm } from "@/app/despesas/actions";
import { AppShell } from "@/components/app-shell/app-shell";
import { ExpenseCategoryFields } from "@/components/expenses/expense-category-fields";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { EditModeBanner } from "@/components/ui/edit-mode-banner";
import { FormField } from "@/components/ui/form-field";
import { PageCard } from "@/components/ui/page-card";
import { SetupCallout } from "@/components/ui/setup-callout";
import { getDb } from "@/db/client";
import { getOperationalContext } from "@/lib/app/operational-context";
import { getSearchParam, type PageSearchParams } from "@/lib/app/search-params";
import { formatDateRange, getCycleDateRange, getTodayDateKey } from "@/lib/dates/month";
import { formatCurrency } from "@/lib/formatters/number";
import { listExpensesByMonth, type ExpenseRecord } from "@/lib/repositories/expenses";
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
  const [editExpenseId, filterCategory, filterSupplier, filterFeedBrandId, minAmountFilter, maxAmountFilter] =
    await Promise.all([
      getSearchParam(searchParams, "editExpenseId"),
      getSearchParam(searchParams, "filterCategory"),
      getSearchParam(searchParams, "filterSupplier"),
      getSearchParam(searchParams, "filterFeedBrandId"),
      getSearchParam(searchParams, "minAmount"),
      getSearchParam(searchParams, "maxAmount"),
    ]);
  const [expenses, feedBrands, feedTests] = context.activeFarm
    ? await Promise.all([
        listExpensesByMonth(getDb(), context.activeFarm.id, range.startDate, range.endDate),
        listFeedBrands(getDb(), context.activeFarm.id),
        listFeedTestResults(getDb(), context.activeFarm.id, 100),
      ])
    : [[], [], []];
  const filters = {
    category: filterCategory ?? "",
    feedBrandId: filterFeedBrandId ?? "",
    maxAmount: parseAmountFilter(maxAmountFilter),
    minAmount: parseAmountFilter(minAmountFilter),
    supplier: filterSupplier ?? "",
  };
  const visibleExpenses = filterExpenses(expenses, filters);
  const summaries = summarizeVisibleExpenses(visibleExpenses);
  const visibleTotal = visibleExpenses.reduce((total, expense) => total + expense.amount, 0);
  const hasActiveFilters = Boolean(
    filters.category || filters.feedBrandId || filters.supplier || filters.minAmount !== null || filters.maxAmount !== null,
  );
  const editingExpense = expenses.find((expense) => expense.id === editExpenseId) ?? null;
  const resetParams = new URLSearchParams({
    farmId: context.activeFarmId,
    referenceMonth: context.referenceMonth,
  });
  const listParams = new URLSearchParams(resetParams);

  if (filters.category) {
    listParams.set("filterCategory", filters.category);
  }
  if (filters.supplier) {
    listParams.set("filterSupplier", filters.supplier);
  }
  if (filters.feedBrandId) {
    listParams.set("filterFeedBrandId", filters.feedBrandId);
  }
  if (filters.minAmount !== null) {
    listParams.set("minAmount", String(filters.minAmount));
  }
  if (filters.maxAmount !== null) {
    listParams.set("maxAmount", String(filters.maxAmount));
  }

  const baseQuery = listParams.toString();
  const resetQuery = resetParams.toString();

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
      <div className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <PageCard
          description={`Cadastre despesas reais do ciclo ${formatDateRange(range.startDate, range.endDate)}. Em categorias elegíveis, informe volumes e valor unitário.`}
          title={editingExpense ? "Editar despesa" : "Nova despesa"}
        >
          <form action={submitExpenseForm} className="grid gap-4">
            <input name="farmId" type="hidden" value={context.activeFarmId} />
            {editingExpense ? <input name="expenseId" type="hidden" value={editingExpense.id} /> : null}
            {editingExpense ? (
              <EditModeBanner
                cancelHref={`/despesas?${baseQuery}`}
                entity="Despesa selecionada"
                summary={`${editingExpense.date} - ${editingExpense.category} - ${formatCurrency(editingExpense.amount)}`}
              />
            ) : null}
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
                  className="edit-cancel-link inline-flex min-h-12 items-center justify-center"
                  href={`/despesas?${baseQuery}`}
                >
                  Cancelar
                </Link>
              ) : null}
            </div>
          </form>
        </PageCard>

        <PageCard title="Resumo e lançamentos">
          <form className="expense-filter-grid" method="get">
            <input name="farmId" type="hidden" value={context.activeFarmId} />
            <input name="referenceMonth" type="hidden" value={context.referenceMonth} />
            <FormField label="Categoria">
              <select className="field" defaultValue={filters.category} name="filterCategory">
                <option value="">Todas</option>
                {expenseCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Fornecedor">
              <input
                className="field"
                defaultValue={filters.supplier}
                maxLength={120}
                name="filterSupplier"
                placeholder="Nome ou parte do nome"
                type="text"
              />
            </FormField>
            <FormField label="Marca de ração">
              <select className="field" defaultValue={filters.feedBrandId} name="filterFeedBrandId">
                <option value="">Todas</option>
                {feedBrands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Valor mínimo">
              <input
                className="field"
                defaultValue={filters.minAmount ?? ""}
                min="0"
                name="minAmount"
                step="0.01"
                type="number"
              />
            </FormField>
            <FormField label="Valor máximo">
              <input
                className="field"
                defaultValue={filters.maxAmount ?? ""}
                min="0"
                name="maxAmount"
                step="0.01"
                type="number"
              />
            </FormField>
            <div className="expense-filter-actions">
              <button className="primary-button min-h-12" disabled={!context.activeFarm} type="submit">
                Filtrar
              </button>
              <Link className="edit-cancel-link inline-flex min-h-12 items-center justify-center" href={`/despesas?${resetQuery}`}>
                Limpar
              </Link>
            </div>
          </form>

          {context.activeFarm ? (
            <p className="mt-4 text-sm font-semibold text-[color:var(--muted)]">
              Mostrando {visibleExpenses.length} de {expenses.length} lançamentos do período. Total filtrado:{" "}
              <strong className="text-[color:var(--foreground)]">{formatCurrency(visibleTotal)}</strong>
            </p>
          ) : null}

          {!context.activeFarm ? (
            <SetupCallout title="Cadastre uma fazenda">
              As despesas precisam de uma fazenda ativa antes de serem salvas.
            </SetupCallout>
          ) : summaries.length === 0 ? (
            <SetupCallout title={hasActiveFilters ? "Nenhuma despesa encontrada" : "Sem despesas no período"}>
              {hasActiveFilters
                ? "Ajuste os filtros para ampliar a busca nos lançamentos do período."
                : `Nenhuma despesa encontrada entre ${formatDateRange(range.startDate, range.endDate)}.`}
            </SetupCallout>
          ) : (
            <div className="mt-4 grid gap-3">
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
          {visibleExpenses.length > 0 ? (
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
                  {visibleExpenses.map((expense) => (
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
                        <div className="row-actions">
                          <Link
                            className="action-link"
                            href={`/despesas?${baseQuery}&editExpenseId=${expense.id}`}
                          >
                            Editar
                          </Link>
                          <form action={submitDeleteExpenseForm}>
                            <input name="farmId" type="hidden" value={context.activeFarmId} />
                            <input name="expenseId" type="hidden" value={expense.id} />
                            <ConfirmSubmitButton
                              className="danger-action"
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

type ExpenseFilters = {
  category: string;
  feedBrandId: string;
  maxAmount: number | null;
  minAmount: number | null;
  supplier: string;
};

function filterExpenses(expenses: ExpenseRecord[], filters: ExpenseFilters) {
  const supplierFilter = filters.supplier.trim().toLowerCase();

  return expenses.filter((expense) => {
    if (filters.category && expense.category !== filters.category) {
      return false;
    }
    if (filters.feedBrandId && expense.feedBrandId !== filters.feedBrandId) {
      return false;
    }
    if (supplierFilter && !expense.supplier?.toLowerCase().includes(supplierFilter)) {
      return false;
    }
    if (filters.minAmount !== null && expense.amount < filters.minAmount) {
      return false;
    }
    if (filters.maxAmount !== null && expense.amount > filters.maxAmount) {
      return false;
    }

    return true;
  });
}

function summarizeVisibleExpenses(expenses: ExpenseRecord[]) {
  const totalsByCategory = new Map<string, number>();

  for (const expense of expenses) {
    totalsByCategory.set(expense.category, (totalsByCategory.get(expense.category) ?? 0) + expense.amount);
  }

  return [...totalsByCategory.entries()]
    .map(([category, totalAmount]) => ({ category, totalAmount }))
    .sort((left, right) => left.category.localeCompare(right.category));
}

function parseAmountFilter(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
