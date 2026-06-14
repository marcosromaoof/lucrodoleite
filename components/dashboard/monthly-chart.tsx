import { formatCurrency, formatLiters } from "@/lib/formatters/number";

type MonthlyChartRow = {
  date: string;
  expenseAmount: number;
  liters: number;
};

type MonthlyChartProps = {
  rows: MonthlyChartRow[];
};

export function MonthlyChart({ rows }: MonthlyChartProps) {
  const visibleRows = rows.slice(0, 12);
  const maxLiters = Math.max(...rows.map((row) => row.liters), 0);
  const maxExpenses = Math.max(...rows.map((row) => row.expenseAmount), 0);

  return (
    <div className="panel-card h-full min-h-[245px]">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Produção x Despesas</h2>
          <p className="panel-subtitle">Dias com registros reais no período</p>
        </div>
        <a className="text-xs font-bold text-[color:var(--farm-green)]" href="/relatorios">
          Ver relatório completo →
        </a>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-[color:var(--muted)]">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block size-3 rounded-sm bg-[var(--chart-muted)]" />
          Produção (L)
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block size-3 rounded-sm bg-[var(--wood)]" />
          Despesas (R$)
        </span>
      </div>

      <div
        className="mt-5 grid h-36 items-end gap-3 border-b border-l border-[var(--border)] px-3"
        style={{ gridTemplateColumns: `repeat(${Math.max(visibleRows.length, 1)}, minmax(28px, 1fr))` }}
      >
        {visibleRows.map((row) => {
          const productionHeight = maxLiters > 0 ? Math.max((row.liters / maxLiters) * 100, 8) : 0;
          const expenseHeight = maxExpenses > 0 ? Math.max((row.expenseAmount / maxExpenses) * 100, 8) : 0;

          return (
            <div
              className="flex h-full items-end justify-center gap-1.5"
              key={row.date}
              title={`${row.date}: ${formatLiters(row.liters)} | ${formatCurrency(row.expenseAmount)}`}
            >
              <div
                aria-label={`Produção em ${row.date}`}
                className="w-full max-w-5 rounded-t-sm bg-[var(--chart-muted)]"
                style={{ height: `${productionHeight}%` }}
              />
              <div
                aria-label={`Despesa em ${row.date}`}
                className="w-full max-w-5 rounded-t-sm bg-[var(--wood)]"
                style={{ height: `${expenseHeight}%` }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-2 text-xs text-[color:var(--muted)] sm:grid-cols-2">
        <span>Maior produção diária: {formatLiters(maxLiters)}</span>
        <span>Maior despesa diária: {formatCurrency(maxExpenses)}</span>
      </div>
    </div>
  );
}
