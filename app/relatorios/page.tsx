import { AppShell } from "@/components/app-shell/app-shell";
import { FormField } from "@/components/ui/form-field";
import { PageCard } from "@/components/ui/page-card";
import { SetupCallout } from "@/components/ui/setup-callout";

const reportTypes = [
  "Produção diária",
  "Fechamento mensal",
  "Despesas por categoria",
  "Comparativo de ração",
  "Relatório anual",
];

const formats = ["PDF", "CSV", "XLSX", "HTML"];

export default function RelatoriosPage() {
  return (
    <AppShell activeHref="/relatorios" eyebrow="Exportação" title="Relatórios">
      <div className="grid gap-5 p-5 sm:p-8 xl:grid-cols-[1fr_0.75fr]">
        <PageCard
          description="A exportação só deve usar dados gravados no banco. Nenhum relatório será gerado com amostras."
          title="Gerar relatório"
        >
          <form className="grid gap-4">
            <FormField label="Tipo">
              <select className="field" name="type" required>
                <option value="">Selecione</option>
                {reportTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Data inicial">
                <input className="field" name="startDate" type="date" />
              </FormField>
              <FormField label="Data final">
                <input className="field" name="endDate" type="date" />
              </FormField>
            </div>

            <FormField label="Formato">
              <select className="field" name="format" required>
                <option value="">Selecione</option>
                {formats.map((format) => (
                  <option key={format} value={format}>
                    {format}
                  </option>
                ))}
              </select>
            </FormField>

            <button className="primary-button" disabled type="button">
              Exportar relatório
            </button>
          </form>
        </PageCard>

        <PageCard title="Histórico de exportações">
          <SetupCallout>
            Quando os relatórios reais forem gerados, o histórico ficará disponível aqui.
          </SetupCallout>
        </PageCard>
      </div>
    </AppShell>
  );
}
