import { AppShell } from "@/components/app-shell/app-shell";
import { FormField } from "@/components/ui/form-field";
import { PageCard } from "@/components/ui/page-card";
import { SetupCallout } from "@/components/ui/setup-callout";
import { getDb } from "@/db/client";
import { getOperationalContext } from "@/lib/app/operational-context";
import type { PageSearchParams } from "@/lib/app/search-params";
import { formatReferenceMonth } from "@/lib/dates/month";
import { listReportExports } from "@/lib/repositories/report-exports";
import {
  reportFormatLabels,
  reportFormats,
  reportTypeLabels,
  reportTypes,
} from "@/lib/validations/report-export";

export const dynamic = "force-dynamic";

type RelatoriosPageProps = {
  searchParams?: PageSearchParams;
};

export default async function RelatoriosPage({ searchParams }: RelatoriosPageProps) {
  const context = await getOperationalContext(searchParams);
  const history = context.activeFarm ? await listReportExports(getDb(), context.activeFarm.id) : [];

  return (
    <AppShell
      activeFarmId={context.activeFarmId}
      activeHref="/relatorios"
      eyebrow="Exportação"
      farms={context.farms}
      referenceMonth={context.referenceMonth}
      referenceMonthLabel={context.referenceMonthLabel}
      title="Relatórios"
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_0.75fr]">
        <PageCard
          description="Os arquivos são gerados somente com dados gravados no banco da fazenda ativa."
          title="Gerar relatório"
        >
          <form action="/api/relatorios/export" className="grid gap-4" method="get">
            <input name="farmId" type="hidden" value={context.activeFarmId} />
            <FormField label="Mês de referência">
              <input
                className="field"
                defaultValue={context.referenceMonth}
                name="referenceMonth"
                required
                type="month"
              />
            </FormField>

            <FormField label="Tipo">
              <select className="field" name="type" required>
                {reportTypes.map((type) => (
                  <option key={type} value={type}>
                    {reportTypeLabels[type]}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Formato">
              <select className="field" name="format" required>
                {reportFormats.map((format) => (
                  <option key={format} value={format}>
                    {reportFormatLabels[format]}
                  </option>
                ))}
              </select>
            </FormField>

            <button className="primary-button" disabled={!context.activeFarm} type="submit">
              Exportar relatório
            </button>
          </form>

          {!context.activeFarm ? (
            <div className="mt-4">
              <SetupCallout title="Cadastre uma fazenda">
                Relatórios precisam de uma fazenda ativa para consultar dados reais.
              </SetupCallout>
            </div>
          ) : null}
        </PageCard>

        <PageCard title="Histórico de exportações">
          {history.length === 0 ? (
            <SetupCallout>Nenhum relatório foi exportado para esta fazenda.</SetupCallout>
          ) : (
            <div className="grid gap-3">
              {history.map((item) => (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--milk-white)] p-4" key={item.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">
                        {reportTypeLabels[item.type as keyof typeof reportTypeLabels] ?? item.type}
                      </p>
                      <p className="text-sm text-[color:var(--muted)]">
                        {item.referenceStart ? formatReferenceMonth(item.referenceStart.slice(0, 7)) : "Período aberto"}
                      </p>
                    </div>
                    <span className="rounded-md border border-[var(--border)] bg-white px-2 py-1 text-xs font-black">
                      {item.format.toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-[color:var(--muted)]">
                    {item.fileName ?? "arquivo sem nome"} | {item.createdAt.toLocaleString("pt-BR")}
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
