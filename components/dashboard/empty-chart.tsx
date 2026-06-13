export function EmptyChart() {
  return (
    <div className="h-full min-h-[245px] rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Produção x Despesas</h2>
          <p className="mt-1 text-xs text-[color:var(--muted)]">Aguardando registros reais do mês</p>
        </div>
        <span className="text-xs font-bold text-[color:var(--farm-green)]">Ver relatório completo →</span>
      </div>

      <div className="mt-7 grid h-36 place-items-center border-b border-l border-[var(--border)] bg-[linear-gradient(to_right,rgba(216,209,193,0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(216,209,193,0.35)_1px,transparent_1px)] bg-[length:56px_36px] px-3">
        <div className="rounded-md border border-dashed border-[var(--border)] bg-white/80 px-4 py-3 text-center text-sm font-bold text-[color:var(--muted)]">
          Sem pontos lançados
        </div>
      </div>

      <p className="mt-4 rounded-md bg-[var(--milk-white)] px-3 py-2 text-center text-sm font-semibold text-[color:var(--muted)]">
        O gráfico será preenchido automaticamente quando houver produção e despesas no banco.
      </p>
    </div>
  );
}
