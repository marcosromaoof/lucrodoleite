import Link from "next/link";
import { recoverLegacyFarmDataAction, submitDeleteFarmForm, submitFarmForm } from "@/app/configuracoes/actions";
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
import { formatCurrency } from "@/lib/formatters/number";
import { listLegacyOrphanFarms } from "@/lib/repositories/farms";

export const dynamic = "force-dynamic";

type ConfiguracoesPageProps = {
  searchParams?: PageSearchParams;
};

export default async function ConfiguracoesPage({ searchParams }: ConfiguracoesPageProps) {
  const context = await getOperationalContext(searchParams);
  const editFarmId = await getSearchParam(searchParams, "editFarmId");
  const editingFarm = context.farms.find((farm) => farm.id === editFarmId) ?? null;
  const baseQuery = `farmId=${context.activeFarmId}&referenceMonth=${context.referenceMonth}`;
  const legacyFarms =
    context.databaseConfigured && context.farms.length === 0 ? await listLegacyOrphanFarms(getDb()) : [];

  return (
    <AppShell
      activeFarmId={context.activeFarmId}
      activeHref="/configuracoes"
      eyebrow="Configuração"
      farms={context.farms}
      referenceMonth={context.referenceMonth}
      referenceMonthLabel={context.referenceMonthLabel}
      title="Configurações"
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_0.75fr]">
        <PageCard
          description="Cadastre a fazenda, preço padrão do leite e ciclo de fechamento do laticínio. Exemplo 25 a 24 para notas que fecham fora do mês civil."
          title={editingFarm ? "Editar fazenda" : "Dados da fazenda"}
        >
          <form
            action={submitFarmForm}
            className="grid gap-4"
            data-feedback-pending={editingFarm ? "Atualizando fazenda..." : "Salvando fazenda..."}
            data-feedback-success="Fazenda processada. Confira os dados atualizados."
          >
            {editingFarm ? <input name="farmId" type="hidden" value={editingFarm.id} /> : null}
            {editingFarm ? (
              <EditModeBanner
                cancelHref={`/configuracoes?${baseQuery}`}
                entity="Fazenda selecionada"
                summary={`${editingFarm.name} - ciclo dia ${editingFarm.closingCycleStartDay} a ${editingFarm.closingCycleEndDay}`}
              />
            ) : null}
            <FormField label="Nome da fazenda">
              <input
                className="field"
                defaultValue={editingFarm?.name}
                maxLength={120}
                name="name"
                required
                type="text"
              />
            </FormField>

            <FormField label="Responsável">
              <input
                className="field"
                defaultValue={editingFarm?.ownerName ?? undefined}
                maxLength={120}
                name="ownerName"
                type="text"
              />
            </FormField>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Cidade">
                <input
                  className="field"
                  defaultValue={editingFarm?.city ?? undefined}
                  maxLength={120}
                  name="city"
                  type="text"
                />
              </FormField>
              <FormField label="Estado">
                <input
                  className="field"
                  defaultValue={editingFarm?.state ?? undefined}
                  maxLength={2}
                  name="state"
                  type="text"
                />
              </FormField>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField label="Preço padrão por litro">
                <input
                  className="field"
                  defaultValue={editingFarm?.defaultPricePerLiter ?? undefined}
                  min="0"
                  name="defaultPricePerLiter"
                  step="0.0001"
                  type="number"
                />
              </FormField>
              <FormField label="Início do ciclo">
                <input
                  className="field"
                  defaultValue={editingFarm?.closingCycleStartDay ?? 1}
                  max="31"
                  min="1"
                  name="closingCycleStartDay"
                  required
                  step="1"
                  type="number"
                />
              </FormField>
              <FormField label="Fechamento do ciclo">
                <input
                  className="field"
                  defaultValue={editingFarm?.closingCycleEndDay ?? 31}
                  max="31"
                  min="1"
                  name="closingCycleEndDay"
                  required
                  step="1"
                  type="number"
                />
              </FormField>
            </div>

            <FormField label="Laticínio comprador">
              <input
                className="field"
                defaultValue={editingFarm?.milkCompany ?? undefined}
                maxLength={120}
                name="milkCompany"
                type="text"
              />
            </FormField>

            <div className="flex flex-wrap gap-3">
              <SubmitButton
                className="primary-button flex-1"
                pendingLabel={editingFarm ? "Atualizando..." : "Salvando..."}
              >
                {editingFarm ? "Atualizar fazenda" : "Salvar fazenda"}
              </SubmitButton>
              {editingFarm ? (
                <Link
                  className="edit-cancel-link inline-flex min-h-12 items-center justify-center"
                  href={`/configuracoes?${baseQuery}`}
                >
                  Cancelar
                </Link>
              ) : null}
            </div>
          </form>
        </PageCard>

        <PageCard title="Fazendas cadastradas">
          {context.farms.length === 0 ? (
            <div className="grid gap-4">
              <SetupCallout title={legacyFarms.length > 0 ? "Dados antigos encontrados" : "Tentar recuperar dados antigos"}>
                <p>
                  {legacyFarms.length > 0
                    ? `Existem ${legacyFarms.length} fazenda(s) antigas sem usuario vinculado.`
                    : "Se seus dados sumiram apos o login no dominio novo, use esta recuperacao para vincular registros legados a sua conta atual."}
                </p>
                <form
                  action={recoverLegacyFarmDataAction}
                  className="mt-3"
                  data-feedback-pending="Recuperando dados antigos..."
                  data-feedback-success="Dados recuperados. Confira a lista de fazendas."
                >
                  <SubmitButton className="primary-button w-full" pendingLabel="Recuperando...">
                    Recuperar dados antigos
                  </SubmitButton>
                </form>
              </SetupCallout>
              <SetupCallout title="Nenhuma fazenda cadastrada">
                Cadastre a primeira fazenda para liberar producao, vacas, despesas, racoes e relatorios.
              </SetupCallout>
            </div>
          ) : (
            <div className="grid gap-3">
              {context.farms.map((farm) => (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--milk-white)] p-4" key={farm.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{farm.name}</p>
                      <p className="text-sm text-[color:var(--muted)]">
                        {[farm.city, farm.state].filter(Boolean).join(" - ") || "Localidade não informada"}
                      </p>
                    </div>
                    <div className="row-actions">
                      <Link
                        className="action-link"
                        href={`/configuracoes?${baseQuery}&editFarmId=${farm.id}`}
                      >
                        Editar
                      </Link>
                      <form
                        action={submitDeleteFarmForm}
                        data-feedback-pending="Excluindo fazenda..."
                        data-feedback-success="Fazenda processada. Confira a lista atualizada."
                      >
                        <input name="farmId" type="hidden" value={farm.id} />
                        <ConfirmSubmitButton
                          className="danger-action"
                          message="Excluir esta fazenda? Só será permitido se não houver dados vinculados."
                        >
                          Excluir
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </div>
                  <p className="mt-2 text-sm">
                    Preço padrão:{" "}
                    <strong>
                      {farm.defaultPricePerLiter !== null ? formatCurrency(farm.defaultPricePerLiter) : "Não informado"}
                    </strong>
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    Ciclo do laticínio: dia {farm.closingCycleStartDay} a dia {farm.closingCycleEndDay}
                  </p>
                </div>
              ))}
            </div>
          )}
        </PageCard>
      </div>
    </AppShell>
  );
}
