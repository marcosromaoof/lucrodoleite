import { submitFarmForm } from "@/app/configuracoes/actions";
import { AppShell } from "@/components/app-shell/app-shell";
import { FormField } from "@/components/ui/form-field";
import { PageCard } from "@/components/ui/page-card";
import { SetupCallout } from "@/components/ui/setup-callout";
import { getOperationalContext } from "@/lib/app/operational-context";
import type { PageSearchParams } from "@/lib/app/search-params";
import { formatCurrency } from "@/lib/formatters/number";

export const dynamic = "force-dynamic";

type ConfiguracoesPageProps = {
  searchParams?: PageSearchParams;
};

export default async function ConfiguracoesPage({ searchParams }: ConfiguracoesPageProps) {
  const context = await getOperationalContext(searchParams);

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
          description="Cadastre as fazendas que terão produção, despesas, rações e fechamentos acompanhados no banco."
          title="Dados da fazenda"
        >
          <form action={submitFarmForm} className="grid gap-4">
            <FormField label="Nome da fazenda">
              <input className="field" maxLength={120} name="name" required type="text" />
            </FormField>

            <FormField label="Responsável">
              <input className="field" maxLength={120} name="ownerName" type="text" />
            </FormField>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Cidade">
                <input className="field" maxLength={120} name="city" type="text" />
              </FormField>
              <FormField label="Estado">
                <input className="field" maxLength={2} name="state" type="text" />
              </FormField>
            </div>

            <FormField label="Preço padrão por litro">
              <input className="field" min="0" name="defaultPricePerLiter" step="0.0001" type="number" />
            </FormField>

            <FormField label="Laticínio comprador">
              <input className="field" maxLength={120} name="milkCompany" type="text" />
            </FormField>

            <button className="primary-button" type="submit">
              Salvar fazenda
            </button>
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
                  <p className="font-bold">{farm.name}</p>
                  <p className="text-sm text-[color:var(--muted)]">
                    {[farm.city, farm.state].filter(Boolean).join(" - ") || "Localidade não informada"}
                  </p>
                  <p className="mt-2 text-sm">
                    Preço padrão:{" "}
                    <strong>
                      {farm.defaultPricePerLiter !== null
                        ? formatCurrency(farm.defaultPricePerLiter)
                        : "Não informado"}
                    </strong>
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
