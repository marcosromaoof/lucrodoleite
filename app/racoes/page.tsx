import Link from "next/link";
import {
  submitDeleteFeedBrandForm,
  submitDeleteFeedTestForm,
  submitFeedBrandForm,
  submitFeedTestForm,
} from "@/app/racoes/actions";
import { AppShell } from "@/components/app-shell/app-shell";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { FormField } from "@/components/ui/form-field";
import { PageCard } from "@/components/ui/page-card";
import { SetupCallout } from "@/components/ui/setup-callout";
import { getDb } from "@/db/client";
import { getOperationalContext } from "@/lib/app/operational-context";
import { getSearchParam, type PageSearchParams } from "@/lib/app/search-params";
import { getCycleDateRange } from "@/lib/dates/month";
import { formatCurrency, formatLiters } from "@/lib/formatters/number";
import { listFeedBrands } from "@/lib/repositories/feed-brands";
import { listFeedTestResults } from "@/lib/repositories/feed-tests";

export const dynamic = "force-dynamic";

type RacoesPageProps = {
  searchParams?: PageSearchParams;
};

export default async function RacoesPage({ searchParams }: RacoesPageProps) {
  const context = await getOperationalContext(searchParams);
  const range = context.activeFarm
    ? getCycleDateRange(
        context.referenceMonth,
        context.activeFarm.closingCycleStartDay,
        context.activeFarm.closingCycleEndDay,
      )
    : { startDate: `${context.referenceMonth}-01`, endDate: `${context.referenceMonth}-31` };
  const editFeedBrandId = await getSearchParam(searchParams, "editFeedBrandId");
  const editFeedTestId = await getSearchParam(searchParams, "editFeedTestId");
  const [brands, tests] = context.activeFarm
    ? await Promise.all([
        listFeedBrands(getDb(), context.activeFarm.id),
        listFeedTestResults(getDb(), context.activeFarm.id),
      ])
    : [[], []];
  const editingBrand = brands.find((brand) => brand.id === editFeedBrandId) ?? null;
  const editingTest = tests.find((test) => test.id === editFeedTestId) ?? null;
  const baseQuery = `farmId=${context.activeFarmId}&referenceMonth=${context.referenceMonth}`;

  return (
    <AppShell
      activeFarmId={context.activeFarmId}
      activeHref="/racoes"
      eyebrow="Teste de ração"
      farms={context.farms}
      referenceMonth={context.referenceMonth}
      referenceMonthLabel={context.referenceMonthLabel}
      title="Rações"
    >
      <div className="grid gap-5 p-5 sm:p-8 xl:grid-cols-[1fr_0.85fr]">
        <PageCard
          description="Cadastre marcas e compare custo, aumento de litros e lucro adicional por período."
          title={editingBrand ? "Editar marca de ração" : "Nova marca de ração"}
        >
          <form action={submitFeedBrandForm} className="grid gap-4">
            <input name="farmId" type="hidden" value={context.activeFarmId} />
            {editingBrand ? <input name="feedBrandId" type="hidden" value={editingBrand.id} /> : null}
            <FormField label="Nome da marca">
              <input
                className="field"
                defaultValue={editingBrand?.name}
                maxLength={120}
                name="name"
                required
                type="text"
              />
            </FormField>

            <FormField label="Fabricante">
              <input
                className="field"
                defaultValue={editingBrand?.manufacturer ?? undefined}
                maxLength={120}
                name="manufacturer"
                type="text"
              />
            </FormField>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Peso do saco em kg">
                <input
                  className="field"
                  defaultValue={editingBrand?.bagWeightKg ?? undefined}
                  min="0"
                  name="bagWeightKg"
                  step="0.001"
                  type="number"
                />
              </FormField>
              <FormField label="Preço do saco">
                <input
                  className="field"
                  defaultValue={editingBrand?.pricePerBag ?? undefined}
                  min="0"
                  name="pricePerBag"
                  step="0.01"
                  type="number"
                />
              </FormField>
            </div>

            <FormField label="Proteína (%)">
              <input
                className="field"
                defaultValue={editingBrand?.proteinPercent ?? undefined}
                max="100"
                min="0"
                name="proteinPercent"
                step="0.01"
                type="number"
              />
            </FormField>

            <FormField label="Observações">
              <textarea
                className="field min-h-28 resize-y"
                defaultValue={editingBrand?.notes ?? undefined}
                maxLength={500}
                name="notes"
              />
            </FormField>

            <div className="flex flex-wrap gap-3">
              <button className="primary-button flex-1" disabled={!context.activeFarm} type="submit">
                {editingBrand ? "Atualizar marca" : "Salvar marca"}
              </button>
              {editingBrand ? (
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--border)] px-4 font-black text-[color:var(--farm-green)]"
                  href={`/racoes?${baseQuery}`}
                >
                  Cancelar
                </Link>
              ) : null}
            </div>
          </form>
        </PageCard>

        <PageCard
          description="Informe a média antes da troca, a média durante o teste e o custo da ração no período."
          title={editingTest ? "Editar teste de ração" : "Novo teste de ração"}
        >
          <form action={submitFeedTestForm} className="grid gap-4">
            <input name="farmId" type="hidden" value={context.activeFarmId} />
            {editingTest ? <input name="feedTestId" type="hidden" value={editingTest.id} /> : null}

            <FormField label="Nome do teste">
              <input
                className="field"
                defaultValue={editingTest?.testName ?? `Teste ${context.referenceMonthLabel}`}
                maxLength={120}
                name="name"
                required
                type="text"
              />
            </FormField>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Ração cadastrada">
                <select className="field" defaultValue={editingTest?.feedBrandId ?? ""} name="feedBrandId">
                  <option value="">Sem vínculo</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Nome exibido no comparativo">
                <input
                  className="field"
                  defaultValue={editingTest?.label}
                  maxLength={120}
                  name="label"
                  required
                  type="text"
                />
              </FormField>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Início do teste">
                <input
                  className="field"
                  defaultValue={editingTest?.startDate ?? range.startDate}
                  name="periodStart"
                  required
                  type="date"
                />
              </FormField>
              <FormField label="Fim do teste">
                <input
                  className="field"
                  defaultValue={editingTest?.endDate ?? range.endDate}
                  name="periodEnd"
                  required
                  type="date"
                />
              </FormField>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Média diária antes">
                <input
                  className="field"
                  defaultValue={editingTest?.baselineDailyLiters ?? undefined}
                  min="0"
                  name="baselineDailyLiters"
                  required
                  step="0.001"
                  type="number"
                />
              </FormField>
              <FormField label="Média diária no teste">
                <input
                  className="field"
                  defaultValue={editingTest?.averageDailyLiters ?? undefined}
                  min="0"
                  name="testDailyLiters"
                  required
                  step="0.001"
                  type="number"
                />
              </FormField>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Preço do leite por litro">
                <input
                  className="field"
                  defaultValue={editingTest?.milkPricePerLiter ?? context.activeFarm?.defaultPricePerLiter?.toFixed(4)}
                  min="0"
                  name="milkPricePerLiter"
                  required
                  step="0.0001"
                  type="number"
                />
              </FormField>
              <FormField label="Custo da ração no período">
                <input
                  className="field"
                  defaultValue={editingTest?.feedCostTotal ?? undefined}
                  min="0"
                  name="feedCostTotal"
                  required
                  step="0.01"
                  type="number"
                />
              </FormField>
            </div>

            <FormField label="Kg de ração por dia">
              <input
                className="field"
                defaultValue={editingTest?.dailyFeedKg ?? undefined}
                min="0"
                name="dailyFeedKg"
                step="0.001"
                type="number"
              />
            </FormField>

            <FormField label="Observações">
              <textarea
                className="field min-h-24 resize-y"
                defaultValue={editingTest?.testNotes ?? undefined}
                maxLength={500}
                name="notes"
              />
            </FormField>

            <div className="flex flex-wrap gap-3">
              <button className="primary-button flex-1" disabled={!context.activeFarm} type="submit">
                {editingTest ? "Atualizar teste" : "Calcular e salvar teste"}
              </button>
              {editingTest ? (
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--border)] px-4 font-black text-[color:var(--farm-green)]"
                  href={`/racoes?${baseQuery}`}
                >
                  Cancelar
                </Link>
              ) : null}
            </div>
          </form>
        </PageCard>

        <PageCard title="Marcas cadastradas">
          {!context.activeFarm ? (
            <SetupCallout title="Cadastre uma fazenda">
              As rações precisam de uma fazenda ativa antes de serem salvas.
            </SetupCallout>
          ) : brands.length === 0 ? (
            <SetupCallout title="Nenhuma marca cadastrada">
              Cadastre marcas reais para comparar preço por kg e vincular testes de ração.
            </SetupCallout>
          ) : (
            <div className="grid gap-3">
              {brands.map((brand) => (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--milk-white)] p-4" key={brand.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{brand.name}</p>
                      <p className="text-sm text-[color:var(--muted)]">
                        {brand.manufacturer ?? "Fabricante não informado"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        className="rounded-md border border-[var(--border)] px-2 py-1 text-sm font-bold text-[color:var(--farm-green)]"
                        href={`/racoes?${baseQuery}&editFeedBrandId=${brand.id}`}
                      >
                        Editar
                      </Link>
                      <form action={submitDeleteFeedBrandForm}>
                        <input name="farmId" type="hidden" value={context.activeFarmId} />
                        <input name="feedBrandId" type="hidden" value={brand.id} />
                        <ConfirmSubmitButton
                          className="rounded-md border border-[var(--wood)] px-2 py-1 text-sm font-bold text-[color:var(--wood)]"
                          message="Excluir esta marca de ração?"
                        >
                          Excluir
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <span>Saco: {brand.pricePerBag !== null ? formatCurrency(brand.pricePerBag) : "sem preço"}</span>
                    <span>
                      Preço/kg: {brand.pricePerKg !== null ? formatCurrency(brand.pricePerKg) : "sem cálculo"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PageCard>

        <PageCard title="Resultados dos testes">
          {!context.activeFarm ? (
            <SetupCallout title="Cadastre uma fazenda">
              Os testes de ração precisam de uma fazenda ativa.
            </SetupCallout>
          ) : tests.length === 0 ? (
            <SetupCallout title="Nenhum teste registrado">
              Lance testes reais para comparar aumento de litros, custo e lucro adicional por ração.
            </SetupCallout>
          ) : (
            <div className="grid gap-3">
              {tests.map((test) => (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--milk-white)] p-4" key={test.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{test.label}</p>
                      <p className="text-sm text-[color:var(--muted)]">
                        {test.testName} | {test.startDate} a {test.endDate}
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <span
                        className={
                          test.compensated === "yes"
                            ? "rounded-md bg-[var(--farm-green)] px-2 py-1 text-xs font-black text-white"
                            : "rounded-md bg-[var(--wood)] px-2 py-1 text-xs font-black text-white"
                        }
                      >
                        {test.compensated === "yes" ? "Compensou" : test.compensated === "no" ? "Não compensou" : "Empatou"}
                      </span>
                      <Link
                        className="rounded-md border border-[var(--border)] px-2 py-1 text-sm font-bold text-[color:var(--farm-green)]"
                        href={`/racoes?${baseQuery}&editFeedTestId=${test.id}`}
                      >
                        Editar
                      </Link>
                      <form action={submitDeleteFeedTestForm}>
                        <input name="farmId" type="hidden" value={context.activeFarmId} />
                        <input name="feedTestId" type="hidden" value={test.id} />
                        <ConfirmSubmitButton
                          className="rounded-md border border-[var(--wood)] px-2 py-1 text-sm font-bold text-[color:var(--wood)]"
                          message="Excluir este teste de ração?"
                        >
                          Excluir
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                    <ResultMetric label="Aumento diário" value={formatLiters(test.extraDailyLiters ?? 0)} />
                    <ResultMetric label="Receita extra" value={formatCurrency(test.extraRevenue ?? 0)} />
                    <ResultMetric label="Lucro adicional" value={formatCurrency(test.additionalProfit)} />
                  </div>
                  <p className="mt-3 text-sm text-[color:var(--muted)]">{test.conclusion}</p>
                </div>
              ))}
            </div>
          )}
        </PageCard>
      </div>
    </AppShell>
  );
}

function ResultMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-white p-3">
      <span className="block text-xs font-semibold text-[color:var(--muted)]">{label}</span>
      <strong className="mt-1 block text-base">{value}</strong>
    </div>
  );
}
