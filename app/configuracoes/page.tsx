import Link from "next/link";
import { submitDeleteFarmForm, submitFarmForm } from "@/app/configuracoes/actions";
import { AppShell } from "@/components/app-shell/app-shell";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { FormField } from "@/components/ui/form-field";
import { PageCard } from "@/components/ui/page-card";
import { SetupCallout } from "@/components/ui/setup-callout";
import { getOperationalContext } from "@/lib/app/operational-context";
import { getSearchParam, type PageSearchParams } from "@/lib/app/search-params";
import { formatCurrency } from "@/lib/formatters/number";

export const dynamic = "force-dynamic";

type ConfiguracoesPageProps = {
  searchParams?: PageSearchParams;
};

export default async function ConfiguracoesPage({ searchParams }: ConfiguracoesPageProps) {
  const context = await getOperationalContext(searchParams);
  const editFarmId = await getSearchParam(searchParams, "editFarmId");
  const editingFarm = context.farms.find((farm) => farm.id === editFarmId) ?? null;
  const baseQuery = `farmId=${context.activeFarmId}&referenceMonth=${context.referenceMonth}`;

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
      <div className="grid gap-5 p-5 sm:p-8 xl:grid-cols-[1fr_0.75fr]">
        <PageCard
          description="Cadastre a fazenda, preço padrão do leite e ciclo de fechamento do laticínio. Exemplo 25 a 24 para notas que fecham fora do mês civil."
          title={editingFarm ? "Editar fazenda" : "Dados da fazenda"}
        >
          <form action={submitFarmForm} className="grid gap-4">
            {editingFarm ? <input name="farmId" type="hidden" value={editingFarm.id} /> : null}
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
              <button className="primary-button flex-1" type="submit">
                {editingFarm ? "Atualizar fazenda" : "Salvar fazenda"}
              </button>
              {editingFarm ? (
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[var(--border)] px-4 font-black text-[color:var(--farm-green)]"
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
            <SetupCallout title="Nenhuma fazenda cadastrada">
              Cadastre a primeira fazenda para liberar produção, despesas, rações e relatórios.
            </SetupCallout>
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
                    <div className="flex gap-2">
                      <Link
                        className="rounded-md border border-[var(--border)] px-2 py-1 text-sm font-bold text-[color:var(--farm-green)]"
                        href={`/configuracoes?${baseQuery}&editFarmId=${farm.id}`}
                      >
                        Editar
                      </Link>
                      <form action={submitDeleteFarmForm}>
                        <input name="farmId" type="hidden" value={farm.id} />
                        <ConfirmSubmitButton
                          className="rounded-md border border-[var(--wood)] px-2 py-1 text-sm font-bold text-[color:var(--wood)]"
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
