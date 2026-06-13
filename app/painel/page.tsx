import { Database } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { PageCard } from "@/components/ui/page-card";
import { SetupCallout } from "@/components/ui/setup-callout";

const requiredSetup = [
  "Conectar DATABASE_URL do Neon Postgres na Vercel",
  "Rodar migrations Drizzle no banco real",
  "Ativar autenticação e criar a primeira fazenda",
  "Registrar produção real antes de exibir indicadores",
];

export default function PainelPage() {
  return (
    <AppShell activeHref="/painel" eyebrow="Projeto em implantação" title="Painel inicial">
      <div className="grid gap-5 p-5 sm:p-8 xl:grid-cols-[1.2fr_0.8fr]">
        <PageCard>
          <div className="flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-md bg-[var(--pasture)] text-[var(--farm-green)]">
              <Database aria-hidden="true" size={25} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Sem dados reais cadastrados</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                Esta primeira tela não usa dados fictícios. Os indicadores de produção,
                despesas, fechamento e ração só serão exibidos depois da conexão com o banco,
                autenticação e registros reais da fazenda.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {requiredSetup.map((item) => (
              <div className="rounded-md border border-[var(--border)] bg-[var(--milk-white)] p-4 text-sm font-medium" key={item}>
                {item}
              </div>
            ))}
          </div>
        </PageCard>

        <PageCard title="Próxima entrega técnica">
          <ul className="space-y-3 text-sm leading-6 text-[var(--muted)]">
            <li>1. Configurar Neon na Vercel e aplicar migrations.</li>
            <li>2. Ativar autenticação e criação da primeira fazenda.</li>
            <li>3. Persistir produção, despesas e fechamento mensal.</li>
            <li>4. Gerar relatórios exportáveis com dados reais.</li>
          </ul>
        </PageCard>

        <div className="xl:col-span-2">
          <SetupCallout title="Validação de banco">
            Depois de configurar `DATABASE_URL`, acesse <code>/api/health</code> no deploy para
            confirmar se o Postgres responde antes de liberar cadastros.
          </SetupCallout>
        </div>
      </div>
    </AppShell>
  );
}
