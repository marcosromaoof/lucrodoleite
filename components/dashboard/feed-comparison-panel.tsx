import { Scale } from "lucide-react";

const rows = [
  "Período avaliado",
  "Produção média diária",
  "Aumento de litros",
  "Custo da ração por kg",
  "Gasto com ração no período",
  "Lucro adicional no período",
  "Compensou?",
];

export function FeedComparisonPanel() {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-xl font-bold">Comparativo de rações</h2>
          <p className="text-sm text-[color:var(--muted)]">A estrutura está pronta para testes reais por marca.</p>
        </div>
        <span className="text-sm font-bold text-[color:var(--farm-green)]">Novo teste →</span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        <div className="overflow-hidden rounded-lg border border-[var(--border)]">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-[var(--milk-white)]">
              <tr>
                <th className="border-b border-r border-[var(--border)] px-4 py-3 text-left">Indicador</th>
                <th className="border-b border-r border-[var(--border)] px-4 py-3 text-center">Primeira marca</th>
                <th className="border-b border-[var(--border)] px-4 py-3 text-center">Segunda marca</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row}>
                  <td className="border-r border-t border-[var(--border)] px-4 py-2.5 font-medium">{row}</td>
                  <td className="border-r border-t border-[var(--border)] px-4 py-2.5 text-center text-[color:var(--muted)]">--</td>
                  <td className="border-t border-[var(--border)] px-4 py-2.5 text-center text-[color:var(--muted)]">--</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid place-items-center rounded-lg border border-[var(--border)] bg-[var(--milk-white)] p-5 text-center">
          <div>
            <p className="text-lg font-bold">Conclusão parcial</p>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
              Cadastre marcas e registros reais para calcular se a ração aumentou lucro ou apenas produção.
            </p>
            <Scale aria-hidden="true" className="mx-auto mt-5 text-[color:var(--wood)]" size={44} />
          </div>
        </div>
      </div>
    </section>
  );
}
