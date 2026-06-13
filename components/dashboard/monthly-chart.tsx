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
  const maxLiters = Math.max(...rows.map((row) => row.liters), 0);
  const maxExpenses = Math.max(...rows.map((row) => row.expenseAmount), 0);

  return (
    <div className="h-full min-h-[245px] rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Produção x Despesas</h2>
          <p className="mt-1 text-xs text-[color:var(--muted)]">Dias com registros reais no mês</p>
        </div>
        <a className="text-xs font-bold text-[color:var(--farm-green)]" href="/relatorios">
          Ver relatório completo →
        </a>
      </div>

      <div className="mt-7 grid h-36 grid-cols-12 items-end gap-2 border-b border-l border-[var(--border)] px-3">
        {rows.slice(0, 12).map((row) => {
          const height = maxLiters > 0 ? Math.max((row.liters / maxLiters) * 100, 8) : 8;

          return (
            <div className="grid gap-1" key={row.date} title={`${row.date}: ${formatLiters(row.liters)}`}>
              <div className="rounded-t-sm bg-[var(--chart-muted)]" style={{ height: `${height}%` }} />
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
