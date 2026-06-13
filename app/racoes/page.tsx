import { AppShell } from "@/components/app-shell/app-shell";
import { FormField } from "@/components/ui/form-field";
import { PageCard } from "@/components/ui/page-card";
import { SetupCallout } from "@/components/ui/setup-callout";

export default function RacoesPage() {
  return (
    <AppShell activeHref="/racoes" eyebrow="Teste de ração" title="Rações">
      <div className="grid gap-5 p-5 sm:p-8 xl:grid-cols-[1fr_0.75fr]">
        <PageCard
          description="Cadastre marcas e compare custo, aumento de litros e lucro adicional por período."
          title="Nova marca de ração"
        >
          <form className="grid gap-4">
            <input name="farmId" type="hidden" value="" />
            <FormField label="Nome da marca">
              <input className="field" maxLength={120} name="name" required type="text" />
            </FormField>

            <FormField label="Fabricante">
              <input className="field" maxLength={120} name="manufacturer" type="text" />
            </FormField>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Peso do saco em kg">
                <input className="field" min="0" name="bagWeightKg" step="0.001" type="number" />
              </FormField>
              <FormField label="Preço do saco">
                <input className="field" min="0" name="pricePerBag" step="0.01" type="number" />
              </FormField>
            </div>

            <FormField label="Proteína (%)">
              <input className="field" max="100" min="0" name="proteinPercent" step="0.01" type="number" />
            </FormField>

            <FormField label="Observações">
              <textarea className="field min-h-28 resize-y" maxLength={500} name="notes" />
            </FormField>

            <button className="primary-button" disabled type="button">
              Salvar marca
            </button>
          </form>
        </PageCard>

        <PageCard title="Comparativo de marcas">
          <SetupCallout>
            O comparativo entre marcas será calculado com produção e despesas reais vinculadas
            aos testes de ração.
          </SetupCallout>
        </PageCard>
      </div>
    </AppShell>
  );
}
