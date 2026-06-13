import { AppShell } from "@/components/app-shell/app-shell";
import { FormField } from "@/components/ui/form-field";
import { PageCard } from "@/components/ui/page-card";
import { SetupCallout } from "@/components/ui/setup-callout";

export default function ProducaoPage() {
  return (
    <AppShell activeHref="/producao" eyebrow="Produção diária" title="Registrar produção">
      <div className="grid gap-5 p-5 sm:p-8 xl:grid-cols-[1fr_0.75fr]">
        <PageCard
          description="O formulário já segue as regras do projeto. A gravação será liberada depois da autenticação e da fazenda ativa."
          title="Lançamento do dia"
        >
          <form className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Data">
                <input className="field" name="date" required type="date" />
              </FormField>
              <FormField label="Litros produzidos">
                <input className="field" min="0" name="liters" required step="0.001" type="number" />
              </FormField>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Vacas em lactação">
                <input className="field" min="1" name="lactatingCows" step="1" type="number" />
              </FormField>
              <FormField label="Lote">
                <input className="field" maxLength={80} name="batchName" type="text" />
              </FormField>
            </div>

            <FormField label="Observação">
              <textarea className="field min-h-32 resize-y" maxLength={500} name="notes" />
            </FormField>

            <button className="primary-button" disabled type="button">
              Salvar produção
            </button>
          </form>
        </PageCard>

        <PageCard title="Histórico do mês">
          <SetupCallout>
            Ainda não há consulta de produção porque nenhum banco/fazenda foi ativado nesta
            interface. Assim que houver registros reais, esta área mostrará a lista do mês.
          </SetupCallout>
        </PageCard>
      </div>
    </AppShell>
  );
}
