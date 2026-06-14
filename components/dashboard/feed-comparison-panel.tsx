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
    <section className="panel-card h-full">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Comparativo de rações</h2>
          <p className="panel-subtitle">
            Marcas cadastradas e testes calculados com dados gravados no banco.
          </p>
        </div>
        <a className="whitespace-nowrap text-xs font-bold text-[color:var(--farm-green)]" href="/racoes">
          Novo teste →
        </a>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-[var(--border)]">
        <table className="w-full border-collapse text-xs">
          <thead className="bg-[var(--milk-white)]">
            <tr>
              <th className="border-b border-r border-[var(--border)] px-3 py-2 text-left">Ração</th>
              <th className="border-b border-r border-[var(--border)] px-3 py-2 text-center">Aumento</th>
              <th className="border-b border-r border-[var(--border)] px-3 py-2 text-center">Lucro</th>
              <th className="border-b border-[var(--border)] px-3 py-2 text-center">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {tests.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-[color:var(--muted)]" colSpan={4}>
                  Nenhum teste de ração registrado.
                </td>
              </tr>
            ) : (
              tests.slice(0, 5).map((test) => (
                <tr key={test.id}>
                  <td className="border-r border-t border-[var(--border)] px-3 py-2 font-medium">
                    {test.label}
                    <span className="block text-[0.68rem] text-[color:var(--muted)]">{test.testName}</span>
                  </td>
                  <td className="border-r border-t border-[var(--border)] px-3 py-2 text-center">
                    {formatLiters(test.extraDailyLiters ?? 0)}/dia
                  </td>
                  <td className="border-r border-t border-[var(--border)] px-3 py-2 text-center">
                    {formatCurrency(test.additionalProfit)}
                  </td>
                  <td className="border-t border-[var(--border)] px-3 py-2 text-center">
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

      <div className="mt-4 flex items-start gap-3 border-t border-[var(--border)] pt-3">
        <Scale aria-hidden="true" className="mt-0.5 shrink-0 text-[color:var(--wood)]" size={32} />
        <div>
          <p className="font-black">
            {bestResult ? `${bestResult.label} teve o melhor lucro` : `${brands.length} marcas cadastradas`}
          </p>
          <p className="mt-1 text-sm leading-5 text-[color:var(--muted)]">
            {bestResult
              ? `${formatCurrency(bestResult.additionalProfit)} de lucro adicional e ${formatLiters(
                  bestResult.extraDailyLiters ?? 0,
                )}/dia de variação na produção.`
              : "Cadastre um teste para comparar aumento de produção, custo e lucro por marca."}
          </p>
        </div>
      </div>
    </section>
  );
}
