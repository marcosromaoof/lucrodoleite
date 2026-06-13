import {
  Beef,
  CircleDollarSign,
  Droplet,
  FlaskConical,
  HandCoins,
  Milk,
  PlusCircle,
  Sprout,
  Tag,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { SetupCallout } from "@/components/ui/setup-callout";
import { DashboardAction } from "@/components/dashboard/dashboard-action";
import { EmptyChart } from "@/components/dashboard/empty-chart";
import { FeedComparisonPanel } from "@/components/dashboard/feed-comparison-panel";
import { IndicatorCard } from "@/components/dashboard/indicator-card";
import { MetricCard } from "@/components/dashboard/metric-card";

const requiredSetup = [
  "Conectar DATABASE_URL do Neon Postgres na Vercel",
  "Rodar migrations Drizzle no banco real",
  "Ativar autenticação e criar a primeira fazenda",
  "Registrar produção real antes de exibir indicadores",
];

export default function PainelPage() {
  return (
    <AppShell activeHref="/painel" eyebrow="Projeto em implantação" title="Painel">
      <div className="space-y-4 p-4 sm:p-6">
        <section className="grid gap-3 xl:grid-cols-6">
          <MetricCard helper="Sem registro hoje" icon={Milk} label="Produção do dia" />
          <MetricCard helper="Total do mês" icon={Droplet} label="Litros no mês" tone="blue" />
          <MetricCard helper="Médio no mês" icon={Tag} label="Preço por litro" />
          <MetricCard helper="Total no mês" icon={Wallet} label="Despesas do mês" />
          <MetricCard helper="No mês" icon={HandCoins} label="Lucro estimado" />
          <MetricCard helper="No mês" icon={CircleDollarSign} label="Resultado por litro" />
        </section>

        <section className="grid gap-3 lg:grid-cols-3">
          <DashboardAction href="/producao" icon={PlusCircle} label="Registrar produção" />
          <DashboardAction href="/despesas" icon={Wallet} label="Lançar despesa" variant="wood" />
          <DashboardAction href="/racoes" icon={FlaskConical} label="Novo teste de ração" variant="outline" />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Indicadores do mês</h2>
            <div className="mt-4 grid divide-y divide-[var(--border)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <IndicatorCard icon={CircleDollarSign} label="Resultado líquido por litro" />
              <IndicatorCard icon={Beef} label="Custo da ração por litro" tone="wood" />
              <IndicatorCard icon={Sprout} label="Resultado livre após ração" />
            </div>
          </div>

          <EmptyChart />
        </section>

        <FeedComparisonPanel />

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <SetupCallout title="Validação de banco">
            Depois de configurar `DATABASE_URL`, acesse <code>/api/health</code> no deploy para
            confirmar se o Postgres responde antes de liberar cadastros.
          </SetupCallout>
          <div className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold">Checklist técnico</h2>
            <div className="mt-4 grid gap-2">
              {requiredSetup.map((item) => (
                <div className="rounded-md border border-[var(--border)] bg-[var(--milk-white)] px-3 py-2 text-sm font-semibold" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
