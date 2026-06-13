import { AppShell } from "@/components/app-shell/app-shell";
import { FormField } from "@/components/ui/form-field";
import { PageCard } from "@/components/ui/page-card";
import { SetupCallout } from "@/components/ui/setup-callout";
import { expenseCategories } from "@/lib/validations/expense";

export default function DespesasPage() {
  return (
    <AppShell activeHref="/despesas" eyebrow="Controle de gastos" title="Despesas">
      <div className="grid gap-5 p-5 sm:p-8 xl:grid-cols-[1fr_0.75fr]">
        <PageCard
          description="Cadastre despesas por categoria, mês de referência e vínculo opcional com ração quando a persistência estiver ativa."
          title="Nova despesa"
        >
          <form className="grid gap-4">
            <input name="farmId" type="hidden" value="" />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Data">
                <input className="field" name="date" required type="date" />
              </FormField>
              <FormField label="Mês de referência">
                <input className="field" name="referenceMonth" required type="month" />
              </FormField>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Categoria">
                <select className="field" name="category" required>
                  <option value="">Selecione</option>
                  {expenseCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Valor">
                <input className="field" min="0" name="amount" required step="0.01" type="number" />
              </FormField>
            </div>

            <FormField label="Fornecedor">
              <input className="field" maxLength={120} name="supplier" type="text" />
            </FormField>

            <FormField label="Descrição">
              <textarea className="field min-h-28 resize-y" maxLength={240} name="description" required />
            </FormField>

            <button className="primary-button" disabled type="button">
              Lançar despesa
            </button>
          </form>
        </PageCard>

        <PageCard title="Resumo por categoria">
          <SetupCallout>
            O resumo será calculado somente com despesas reais gravadas no Postgres.
          </SetupCallout>
        </PageCard>
      </div>
    </AppShell>
  );
}
