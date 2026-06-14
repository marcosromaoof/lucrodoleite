import Link from "next/link";
import {
  submitCowEvaluationEntryForm,
  submitCowEvaluationForm,
  submitCowForm,
  submitDeleteCowEvaluationEntryForm,
  submitDeleteCowEvaluationForm,
  submitDeleteCowForm,
} from "@/app/vacas/actions";
import { AppShell } from "@/components/app-shell/app-shell";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { EditModeBanner } from "@/components/ui/edit-mode-banner";
import { FormField } from "@/components/ui/form-field";
import { PageCard } from "@/components/ui/page-card";
import { SetupCallout } from "@/components/ui/setup-callout";
import { SubmitButton } from "@/components/ui/submit-button";
import { getDb } from "@/db/client";
import { getOperationalContext } from "@/lib/app/operational-context";
import { getSearchParam, type PageSearchParams } from "@/lib/app/search-params";
import { summarizeCowEvaluation, type CowEvaluationEntryInput } from "@/lib/calculations/cow-evaluation";
import { getCycleDateRange } from "@/lib/dates/month";
import { formatCurrency, formatLiters } from "@/lib/formatters/number";
import {
  listCowEvaluationEntriesByFarm,
  listCowEvaluations,
  listCows,
  type CowEvaluationEntryRecord,
} from "@/lib/repositories/cows";
import { cowStatusLabels, cowStatuses } from "@/lib/validations/cow";

export const dynamic = "force-dynamic";

type VacasPageProps = {
  searchParams?: PageSearchParams;
};

export default async function VacasPage({ searchParams }: VacasPageProps) {
  const context = await getOperationalContext(searchParams);
  const range = context.activeFarm
    ? getCycleDateRange(
        context.referenceMonth,
        context.activeFarm.closingCycleStartDay,
        context.activeFarm.closingCycleEndDay,
      )
    : { startDate: `${context.referenceMonth}-01`, endDate: `${context.referenceMonth}-31` };
  const [editCowId, editEvaluationId, evaluationIdParam, editEntryId] = await Promise.all([
    getSearchParam(searchParams, "editCowId"),
    getSearchParam(searchParams, "editEvaluationId"),
    getSearchParam(searchParams, "evaluationId"),
    getSearchParam(searchParams, "editEntryId"),
  ]);
  const [cows, evaluations, allEntries] = context.activeFarm
    ? await Promise.all([
        listCows(getDb(), context.activeFarm.id),
        listCowEvaluations(getDb(), context.activeFarm.id),
        listCowEvaluationEntriesByFarm(getDb(), context.activeFarm.id),
      ])
    : [[], [], []];
  const entriesByEvaluation = groupEntriesByEvaluation(allEntries);
  const editingCow = cows.find((cow) => cow.id === editCowId) ?? null;
  const editingEvaluation = evaluations.find((evaluation) => evaluation.id === editEvaluationId) ?? null;
  const activeEvaluation =
    evaluations.find((evaluation) => evaluation.id === (evaluationIdParam ?? editEvaluationId)) ?? evaluations[0] ?? null;
  const activeEntries = activeEvaluation ? entriesByEvaluation.get(activeEvaluation.id) ?? [] : [];
  const editingEntry = activeEntries.find((entry) => entry.id === editEntryId) ?? null;
  const baseQuery = `farmId=${context.activeFarmId}&referenceMonth=${context.referenceMonth}`;
  const activeEvaluationQuery = activeEvaluation ? `${baseQuery}&evaluationId=${activeEvaluation.id}` : baseQuery;
  const activeSummary = activeEvaluation
    ? summarizeCowEvaluation(toCalculationEntries(activeEntries), activeEvaluation.milkPricePerLiter)
    : null;

  return (
    <AppShell
      activeFarmId={context.activeFarmId}
      activeHref="/vacas"
      eyebrow="Avaliação individual"
      farms={context.farms}
      referenceMonth={context.referenceMonth}
      referenceMonthLabel={context.referenceMonthLabel}
      title="Vacas"
    >
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1fr]">
        <PageCard
          description="Cadastre cada animal para acompanhar produção, alimentação e resultado individual."
          title={editingCow ? "Editar vaca" : "Nova vaca"}
        >
          <form
            action={submitCowForm}
            className="grid gap-4"
            data-feedback-pending={editingCow ? "Atualizando vaca..." : "Salvando vaca..."}
            data-feedback-success="Cadastro da vaca processado. Confira a lista atualizada."
          >
            <input name="farmId" type="hidden" value={context.activeFarmId} />
            {editingCow ? <input name="cowId" type="hidden" value={editingCow.id} /> : null}
            {editingCow ? (
              <EditModeBanner
                cancelHref={`/vacas?${baseQuery}`}
                entity="Vaca selecionada"
                summary={`${editingCow.identification}${editingCow.name ? ` - ${editingCow.name}` : ""}`}
              />
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Identificação">
                <input
                  className="field"
                  defaultValue={editingCow?.identification}
                  maxLength={80}
                  name="identification"
                  required
                  type="text"
                />
              </FormField>
              <FormField label="Nome/apelido">
                <input className="field" defaultValue={editingCow?.name ?? undefined} maxLength={120} name="name" />
              </FormField>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField label="Raça">
                <input className="field" defaultValue={editingCow?.breed ?? undefined} maxLength={80} name="breed" />
              </FormField>
              <FormField label="Nascimento">
                <input className="field" defaultValue={editingCow?.birthDate ?? undefined} name="birthDate" type="date" />
              </FormField>
              <FormField label="Status">
                <select className="field" defaultValue={editingCow?.status ?? "active"} name="status">
                  {cowStatuses.map((status) => (
                    <option key={status} value={status}>
                      {cowStatusLabels[status]}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField label="Observações">
              <textarea
                className="field min-h-24 resize-y"
                defaultValue={editingCow?.notes ?? undefined}
                maxLength={500}
                name="notes"
              />
            </FormField>

            <div className="flex flex-wrap gap-3">
              <SubmitButton
                className="primary-button flex-1"
                disabled={!context.activeFarm}
                pendingLabel={editingCow ? "Atualizando..." : "Salvando..."}
              >
                {editingCow ? "Atualizar vaca" : "Salvar vaca"}
              </SubmitButton>
              {editingCow ? (
                <Link className="edit-cancel-link inline-flex min-h-12 items-center justify-center" href={`/vacas?${baseQuery}`}>
                  Cancelar
                </Link>
              ) : null}
            </div>
          </form>
        </PageCard>

        <PageCard
          description="Compare a produção base sem ração com o período de teste com ração e silagem informadas por vaca."
          title={editingEvaluation ? "Editar avaliação" : "Nova avaliação"}
        >
          <form
            action={submitCowEvaluationForm}
            className="grid gap-4"
            data-feedback-pending={editingEvaluation ? "Atualizando avaliação..." : "Salvando avaliação..."}
            data-feedback-success="Avaliação processada. Confira os resultados atualizados."
          >
            <input name="farmId" type="hidden" value={context.activeFarmId} />
            {editingEvaluation ? <input name="evaluationId" type="hidden" value={editingEvaluation.id} /> : null}
            {editingEvaluation ? (
              <EditModeBanner
                cancelHref={`/vacas?${baseQuery}&evaluationId=${editingEvaluation.id}`}
                entity="Avaliação selecionada"
                summary={`${editingEvaluation.name} - ${editingEvaluation.cowIdentification}`}
              />
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Vaca">
                <select className="field" defaultValue={editingEvaluation?.cowId ?? ""} name="cowId" required>
                  <option value="">Selecione</option>
                  {cows.map((cow) => (
                    <option key={cow.id} value={cow.id}>
                      {cow.identification}
                      {cow.name ? ` - ${cow.name}` : ""}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Nome da avaliação">
                <input
                  className="field"
                  defaultValue={editingEvaluation?.name ?? `Avaliação ${context.referenceMonthLabel}`}
                  maxLength={120}
                  name="name"
                  required
                />
              </FormField>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <FormField label="Início sem ração">
                <input
                  className="field"
                  defaultValue={editingEvaluation?.baselineStartDate ?? range.startDate}
                  name="baselineStartDate"
                  required
                  type="date"
                />
              </FormField>
              <FormField label="Fim sem ração">
                <input
                  className="field"
                  defaultValue={editingEvaluation?.baselineEndDate ?? range.endDate}
                  name="baselineEndDate"
                  required
                  type="date"
                />
              </FormField>
              <FormField label="Início com ração">
                <input
                  className="field"
                  defaultValue={editingEvaluation?.testStartDate ?? range.startDate}
                  name="testStartDate"
                  required
                  type="date"
                />
              </FormField>
              <FormField label="Fim com ração">
                <input
                  className="field"
                  defaultValue={editingEvaluation?.testEndDate ?? range.endDate}
                  name="testEndDate"
                  required
                  type="date"
                />
              </FormField>
            </div>

            <FormField label="Preço do leite por litro">
              <input
                className="field"
                defaultValue={editingEvaluation?.milkPricePerLiter ?? context.activeFarm?.defaultPricePerLiter ?? undefined}
                min="0"
                name="milkPricePerLiter"
                required
                step="0.0001"
                type="number"
              />
            </FormField>

            <FormField label="Observações">
              <textarea
                className="field min-h-24 resize-y"
                defaultValue={editingEvaluation?.notes ?? undefined}
                maxLength={500}
                name="notes"
              />
            </FormField>

            <div className="flex flex-wrap gap-3">
              <SubmitButton
                className="primary-button flex-1"
                disabled={!context.activeFarm || cows.length === 0}
                pendingLabel={editingEvaluation ? "Atualizando..." : "Salvando..."}
              >
                {editingEvaluation ? "Atualizar avaliação" : "Salvar avaliação"}
              </SubmitButton>
              {editingEvaluation ? (
                <Link
                  className="edit-cancel-link inline-flex min-h-12 items-center justify-center"
                  href={`/vacas?${baseQuery}&evaluationId=${editingEvaluation.id}`}
                >
                  Cancelar
                </Link>
              ) : null}
            </div>
          </form>
        </PageCard>

        <PageCard title="Vacas cadastradas">
          {!context.activeFarm ? (
            <SetupCallout title="Cadastre uma fazenda">As vacas precisam de uma fazenda ativa.</SetupCallout>
          ) : cows.length === 0 ? (
            <SetupCallout title="Nenhuma vaca cadastrada">
              Cadastre o primeiro animal para liberar avaliações individuais.
            </SetupCallout>
          ) : (
            <div className="grid gap-3">
              {cows.map((cow) => (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--milk-white)] p-4" key={cow.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">
                        {cow.identification}
                        {cow.name ? ` - ${cow.name}` : ""}
                      </p>
                      <p className="text-sm text-[color:var(--muted)]">
                        {cow.breed ?? "Raça não informada"} | {cowStatusLabels[cow.status as keyof typeof cowStatusLabels] ?? cow.status}
                      </p>
                    </div>
                    <div className="row-actions">
                      <Link className="action-link" href={`/vacas?${baseQuery}&editCowId=${cow.id}`}>
                        Editar
                      </Link>
                      <form
                        action={submitDeleteCowForm}
                        data-feedback-pending="Excluindo vaca..."
                        data-feedback-success="Cadastro da vaca processado. Confira a lista atualizada."
                      >
                        <input name="farmId" type="hidden" value={context.activeFarmId} />
                        <input name="cowId" type="hidden" value={cow.id} />
                        <ConfirmSubmitButton className="danger-action" message="Excluir esta vaca?">
                          Excluir
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PageCard>

        <PageCard title="Avaliações">
          {evaluations.length === 0 ? (
            <SetupCallout title="Nenhuma avaliação registrada">
              Crie uma avaliação para comparar produção sem ração e com ração por animal.
            </SetupCallout>
          ) : (
            <div className="grid gap-3">
              {evaluations.map((evaluation) => {
                const summary = summarizeCowEvaluation(
                  toCalculationEntries(entriesByEvaluation.get(evaluation.id) ?? []),
                  evaluation.milkPricePerLiter,
                );
                const selected = activeEvaluation?.id === evaluation.id;

                return (
                  <div
                    className={`rounded-lg border p-4 ${
                      selected ? "border-[var(--farm-green)] bg-[rgba(238,243,223,0.72)]" : "border-[var(--border)] bg-[var(--milk-white)]"
                    }`}
                    key={evaluation.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{evaluation.name}</p>
                        <p className="text-sm text-[color:var(--muted)]">
                          {evaluation.cowIdentification}
                          {evaluation.cowName ? ` - ${evaluation.cowName}` : ""} | {summary.total.dayCount} lançamentos
                        </p>
                      </div>
                      <div className="row-actions flex-wrap">
                        <Link className="action-link" href={`/vacas?${baseQuery}&evaluationId=${evaluation.id}`}>
                          Abrir
                        </Link>
                        <Link className="action-link" href={`/vacas?${baseQuery}&editEvaluationId=${evaluation.id}`}>
                          Editar
                        </Link>
                        <form
                          action={submitDeleteCowEvaluationForm}
                          data-feedback-pending="Excluindo avaliação..."
                          data-feedback-success="Avaliação processada. Confira a lista atualizada."
                        >
                          <input name="farmId" type="hidden" value={context.activeFarmId} />
                          <input name="evaluationId" type="hidden" value={evaluation.id} />
                          <ConfirmSubmitButton className="danger-action" message="Excluir esta avaliação e seus lançamentos?">
                            Excluir
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                      <ResultPill label="Sem ração" value={formatLiters(summary.baseline.averageDailyLiters)} />
                      <ResultPill label="Com ração" value={formatLiters(summary.test.averageDailyLiters)} />
                      <ResultPill label="Lucro adicional/dia" value={formatCurrency(summary.comparison.additionalDailyProfit)} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </PageCard>

        <div className="xl:col-span-2">
          <PageCard
            description={
              activeEvaluation
                ? `${activeEvaluation.cowIdentification} | ${activeEvaluation.baselineStartDate} a ${activeEvaluation.testEndDate}`
                : "Selecione uma avaliação para lançar produção e custos diários."
            }
            title={activeEvaluation ? `Lançamentos - ${activeEvaluation.name}` : "Lançamentos da avaliação"}
          >
            {!activeEvaluation ? (
              <SetupCallout title="Nenhuma avaliação selecionada">
                Crie ou abra uma avaliação para registrar produção vaca a vaca.
              </SetupCallout>
            ) : (
              <div className="grid gap-5 xl:grid-cols-[0.9fr_1fr]">
                <form
                  action={submitCowEvaluationEntryForm}
                  className="grid gap-4"
                  data-feedback-pending={editingEntry ? "Atualizando lançamento..." : "Salvando lançamento..."}
                  data-feedback-success="Lançamento processado. Confira os resultados atualizados."
                >
                  <input name="farmId" type="hidden" value={context.activeFarmId} />
                  <input name="evaluationId" type="hidden" value={activeEvaluation.id} />
                  {editingEntry ? <input name="entryId" type="hidden" value={editingEntry.id} /> : null}
                  {editingEntry ? (
                    <EditModeBanner
                      cancelHref={`/vacas?${activeEvaluationQuery}`}
                      entity="Lançamento selecionado"
                      summary={`${editingEntry.date} - ${phaseLabel(editingEntry.phase)} - ${formatLiters(editingEntry.liters)}`}
                    />
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField label="Fase">
                      <select className="field" defaultValue={editingEntry?.phase ?? "baseline"} name="phase" required>
                        <option value="baseline">Sem ração</option>
                        <option value="test">Com ração</option>
                      </select>
                    </FormField>
                    <FormField label="Data">
                      <input className="field" defaultValue={editingEntry?.date ?? range.startDate} name="date" required type="date" />
                    </FormField>
                    <FormField label="Litros">
                      <input
                        className="field"
                        defaultValue={editingEntry?.liters ?? undefined}
                        min="0"
                        name="liters"
                        required
                        step="0.001"
                        type="number"
                      />
                    </FormField>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Kg de ração">
                      <input className="field" defaultValue={editingEntry?.feedKg ?? undefined} min="0" name="feedKg" step="0.001" type="number" />
                    </FormField>
                    <FormField label="Valor/kg da ração">
                      <input className="field" defaultValue={editingEntry?.feedPricePerKg ?? undefined} min="0" name="feedPricePerKg" step="0.0001" type="number" />
                    </FormField>
                    <FormField label="Kg de silagem">
                      <input className="field" defaultValue={editingEntry?.silageKg ?? undefined} min="0" name="silageKg" step="0.001" type="number" />
                    </FormField>
                    <FormField label="Valor/kg da silagem">
                      <input className="field" defaultValue={editingEntry?.silagePricePerKg ?? undefined} min="0" name="silagePricePerKg" step="0.0001" type="number" />
                    </FormField>
                  </div>

                  <FormField label="Outros custos do dia">
                    <input className="field" defaultValue={editingEntry?.otherCosts ?? undefined} min="0" name="otherCosts" step="0.01" type="number" />
                  </FormField>
                  <FormField label="Observações">
                    <textarea className="field min-h-24 resize-y" defaultValue={editingEntry?.notes ?? undefined} maxLength={500} name="notes" />
                  </FormField>

                  <div className="flex flex-wrap gap-3">
                    <SubmitButton className="primary-button flex-1" pendingLabel={editingEntry ? "Atualizando..." : "Salvando..."}>
                      {editingEntry ? "Atualizar lançamento" : "Salvar lançamento"}
                    </SubmitButton>
                    {editingEntry ? (
                      <Link className="edit-cancel-link inline-flex min-h-12 items-center justify-center" href={`/vacas?${activeEvaluationQuery}`}>
                        Cancelar
                      </Link>
                    ) : null}
                  </div>
                </form>

                <div className="grid gap-4">
                  {activeSummary ? (
                    <div className="grid gap-3 md:grid-cols-3">
                      <ResultBox label="Média sem ração" value={formatLiters(activeSummary.baseline.averageDailyLiters)} />
                      <ResultBox label="Média com ração" value={formatLiters(activeSummary.test.averageDailyLiters)} />
                      <ResultBox label="Aumento/dia" value={formatLiters(activeSummary.comparison.extraDailyLiters)} />
                      <ResultBox label="Custo alimentação" value={formatCurrency(activeSummary.total.nutritionCost)} />
                      <ResultBox label="Lucro livre" value={formatCurrency(activeSummary.total.freeProfitAfterNutrition)} />
                      <ResultBox label="Lucro líquido" value={formatCurrency(activeSummary.total.netProfit)} />
                    </div>
                  ) : null}

                  {activeEntries.length === 0 ? (
                    <SetupCallout title="Sem lançamentos">
                      Registre dias sem ração e com ração para calcular a comparação.
                    </SetupCallout>
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-[var(--border)]">
                      <table className="w-full border-collapse text-sm">
                        <thead className="bg-[var(--milk-white)]">
                          <tr>
                            <th className="border-b border-[var(--border)] px-3 py-2 text-left">Data</th>
                            <th className="border-b border-[var(--border)] px-3 py-2 text-left">Fase</th>
                            <th className="border-b border-[var(--border)] px-3 py-2 text-right">Litros</th>
                            <th className="border-b border-[var(--border)] px-3 py-2 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeEntries.map((entry) => (
                            <tr key={entry.id}>
                              <td className="border-t border-[var(--border)] px-3 py-2">{entry.date}</td>
                              <td className="border-t border-[var(--border)] px-3 py-2">{phaseLabel(entry.phase)}</td>
                              <td className="border-t border-[var(--border)] px-3 py-2 text-right font-bold">
                                {formatLiters(entry.liters)}
                              </td>
                              <td className="border-t border-[var(--border)] px-3 py-2">
                                <div className="row-actions">
                                  <Link
                                    className="action-link"
                                    href={`/vacas?${activeEvaluationQuery}&editEntryId=${entry.id}`}
                                  >
                                    Editar
                                  </Link>
                                  <form
                                    action={submitDeleteCowEvaluationEntryForm}
                                    data-feedback-pending="Excluindo lançamento..."
                                    data-feedback-success="Lançamento processado. Confira os resultados atualizados."
                                  >
                                    <input name="farmId" type="hidden" value={context.activeFarmId} />
                                    <input name="evaluationId" type="hidden" value={activeEvaluation.id} />
                                    <input name="entryId" type="hidden" value={entry.id} />
                                    <ConfirmSubmitButton className="danger-action" message="Excluir este lançamento?">
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
                </div>
              </div>
            )}
          </PageCard>
        </div>
      </div>
    </AppShell>
  );
}

function ResultPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-white px-3 py-2">
      <span className="block text-xs font-semibold text-[color:var(--muted)]">{label}</span>
      <strong className="mt-1 block">{value}</strong>
    </div>
  );
}

function ResultBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--milk-white)] p-3">
      <span className="block text-xs font-semibold text-[color:var(--muted)]">{label}</span>
      <strong className="mt-1 block text-lg">{value}</strong>
    </div>
  );
}

function groupEntriesByEvaluation(entries: CowEvaluationEntryRecord[]) {
  const grouped = new Map<string, CowEvaluationEntryRecord[]>();

  for (const entry of entries) {
    grouped.set(entry.evaluationId, [...(grouped.get(entry.evaluationId) ?? []), entry]);
  }

  return grouped;
}

function toCalculationEntries(entries: CowEvaluationEntryRecord[]): CowEvaluationEntryInput[] {
  return entries.map((entry) => ({
    date: entry.date,
    feedKg: entry.feedKg,
    feedPricePerKg: entry.feedPricePerKg,
    liters: entry.liters,
    otherCosts: entry.otherCosts,
    phase: entry.phase,
    silageKg: entry.silageKg,
    silagePricePerKg: entry.silagePricePerKg,
  }));
}

function phaseLabel(phase: CowEvaluationEntryRecord["phase"]) {
  return phase === "baseline" ? "Sem ração" : "Com ração";
}
