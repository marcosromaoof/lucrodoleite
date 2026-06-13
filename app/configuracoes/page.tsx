import { AppShell } from "@/components/app-shell/app-shell";
import { FormField } from "@/components/ui/form-field";
import { PageCard } from "@/components/ui/page-card";
import { SetupCallout } from "@/components/ui/setup-callout";

export default function ConfiguracoesPage() {
  return (
    <AppShell activeHref="/configuracoes" eyebrow="Configuração" title="Configurações">
      <div className="grid gap-5 p-5 sm:p-8 xl:grid-cols-[1fr_0.75fr]">
        <PageCard
          description="A primeira fazenda será persistida no banco depois que autenticação e migrations estiverem prontas."
          title="Dados da fazenda"
        >
          <form className="grid gap-4">
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

            <button className="primary-button" disabled type="button">
              Salvar fazenda
            </button>
          </form>
        </PageCard>

        <PageCard title="Checklist de produção">
          <SetupCallout>
            Configure `DATABASE_URL` no projeto da Vercel, rode `npm run db:migrate` e depois
            avance para autenticação antes de liberar cadastros.
          </SetupCallout>
        </PageCard>
      </div>
    </AppShell>
  );
}
