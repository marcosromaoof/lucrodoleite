import { Scale } from "lucide-react";
import { formatCurrency, formatLiters } from "@/lib/formatters/number";
import type { FeedBrandRecord } from "@/lib/repositories/feed-brands";
import type { FeedTestResultRecord } from "@/lib/repositories/feed-tests";

type FeedComparisonPanelProps = {
  brands: FeedBrandRecord[];
  tests: FeedTestResultRecord[];
};

export function FeedComparisonPanel({ brands, tests }: FeedComparisonPanelProps) {
  const bestResult = tests.reduce<FeedTestResultRecord | null>(
    (best, current) => (!best || current.additionalProfit > best.additionalProfit ? current : best),
    null,
  );

  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-xl font-bold">Comparativo de rações</h2>
          <p className="text-sm text-[color:var(--muted)]">
            Marcas cadastradas e testes calculados com dados gravados no banco.
          </p>
        </div>
        <a className="text-sm font-bold text-[color:var(--farm-green)]" href="/racoes">
          Novo teste →
        </a>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <div className="overflow-hidden rounded-lg border border-[var(--border)]">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-[var(--milk-white)]">
              <tr>
                <th className="border-b border-r border-[var(--border)] px-4 py-3 text-left">Ração</th>
                <th className="border-b border-r border-[var(--border)] px-4 py-3 text-center">Aumento</th>
                <th className="border-b border-r border-[var(--border)] px-4 py-3 text-center">Lucro adicional</th>
                <th className="border-b border-[var(--border)] px-4 py-3 text-center">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {tests.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-[color:var(--muted)]" colSpan={4}>
                    Nenhum teste de ração registrado.
                  </td>
                </tr>
              ) : (
                tests.slice(0, 6).map((test) => (
                  <tr key={test.id}>
                    <td className="border-r border-t border-[var(--border)] px-4 py-2.5 font-medium">
                      {test.label}
                      <span className="block text-xs text-[color:var(--muted)]">{test.testName}</span>
                    </td>
                    <td className="border-r border-t border-[var(--border)] px-4 py-2.5 text-center">
                      {formatLiters(test.extraDailyLiters ?? 0)}/dia
                    </td>
                    <td className="border-r border-t border-[var(--border)] px-4 py-2.5 text-center">
                      {formatCurrency(test.additionalProfit)}
                    </td>
                    <td className="border-t border-[var(--border)] px-4 py-2.5 text-center">
                      {test.compensated === "yes"
                        ? "Compensou"
                        : test.compensated === "no"
                          ? "Não compensou"
                          : "Empatou"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="grid place-items-center rounded-lg border border-[var(--border)] bg-[var(--milk-white)] p-5 text-center">
          <div>
            <Scale aria-hidden="true" className="mx-auto text-[color:var(--wood)]" size={40} />
            <p className="mt-3 text-lg font-bold">
              {bestResult ? `${bestResult.label} teve o melhor lucro` : `${brands.length} marcas cadastradas`}
            </p>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
              {bestResult
                ? `${formatCurrency(bestResult.additionalProfit)} de lucro adicional e ${formatLiters(
                    bestResult.extraDailyLiters ?? 0,
                  )}/dia de variação na produção.`
                : "Cadastre um teste para comparar aumento de produção, custo e lucro por marca."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
