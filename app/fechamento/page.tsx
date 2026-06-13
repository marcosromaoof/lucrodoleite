import { AppShell } from "@/components/app-shell/app-shell";
import { FormField } from "@/components/ui/form-field";
import { PageCard } from "@/components/ui/page-card";
import { SetupCallout } from "@/components/ui/setup-callout";

export default function FechamentoPage() {
  return (
    <AppShell activeHref="/fechamento" eyebrow="Fechamento mensal" title="Fechamento">
      <div className="grid gap-5 p-5 sm:p-8 xl:grid-cols-[1fr_0.75fr]">
        <PageCard
          description="O total de litros e despesas será carregado automaticamente do banco depois que a fazenda tiver registros reais."
          title="Fechar mês"
        >
          <form className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Mês de referência">
                <input className="field" name="referenceMonth" required type="month" />
              </FormField>
              <FormField label="Valor total da nota">
                <input className="field" min="0" name="milkInvoiceAmount" required step="0.01" type="number" />
              </FormField>
            </div>

            <button className="primary-button" disabled type="button">
              Calcular e salvar fechamento
            </button>
          </form>
        </PageCard>

        <PageCard title="Indicadores calculados">
          <SetupCallout>
            Preço por litro, custo por litro, resultado livre após ração e lucro líquido
            aparecerão aqui depois do fechamento real.
          </SetupCallout>
        </PageCard>
      </div>
    </AppShell>
  );
}
