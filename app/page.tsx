import {
  BarChart3,
  ClipboardList,
  Database,
  FileDown,
  Milk,
  Scale,
  Settings,
  Wallet,
} from "lucide-react";

const navigation = [
  { label: "Painel", icon: BarChart3 },
  { label: "Produção", icon: Milk },
  { label: "Despesas", icon: Wallet },
  { label: "Fechamento", icon: ClipboardList },
  { label: "Rações", icon: Scale },
  { label: "Relatórios", icon: FileDown },
  { label: "Configurações", icon: Settings },
];

const requiredSetup = [
  "Conectar DATABASE_URL do Neon Postgres",
  "Rodar migrations Drizzle",
  "Ativar autenticação e primeira fazenda",
  "Registrar produção real antes de exibir indicadores",
];

export default function Home() {
  const databaseConfigured = Boolean(process.env.DATABASE_URL);

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col border-x border-[var(--border)] bg-[var(--surface)] lg:flex-row">
        <aside className="border-b border-[var(--border)] bg-[var(--farm-green)] text-white lg:w-72 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 border-b border-white/15 px-6 py-6">
            <div className="grid size-12 place-items-center rounded-lg bg-[var(--milk-white)] text-[var(--farm-green)]">
              <Milk aria-hidden="true" size={28} strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-xl font-bold leading-tight">Lucro do Leite</p>
              <p className="text-sm text-white/75">Gestão que dá resultado</p>
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4 lg:grid-cols-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <span
                  className="flex min-h-12 items-center gap-3 rounded-md px-3 text-sm font-semibold text-white/86 first:bg-white/12"
                  key={item.label}
                >
                  <Icon aria-hidden="true" size={20} />
                  {item.label}
                </span>
              );
            })}
          </nav>
        </aside>

        <section className="flex-1">
          <header className="border-b border-[var(--border)] bg-[var(--pasture)] px-5 py-5 sm:px-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                  Projeto em implantação
                </p>
                <h1 className="mt-1 text-3xl font-bold text-[var(--farm-green)]">
                  Painel inicial
                </h1>
              </div>

              <div className="rounded-md border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold">
                Banco:{" "}
                <span className={databaseConfigured ? "text-[var(--success)]" : "text-[var(--warning)]"}>
                  {databaseConfigured ? "configurado" : "aguardando DATABASE_URL"}
                </span>
              </div>
            </div>
          </header>

          <div className="grid gap-5 p-5 sm:p-8 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-lg border border-[var(--border)] bg-white p-6 shadow-sm">
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
            </section>

            <section className="rounded-lg border border-[var(--border)] bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Próxima entrega técnica</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
                <li>1. Migrations do banco Neon com Drizzle.</li>
                <li>2. Autenticação e criação da primeira fazenda.</li>
                <li>3. Formulários reais de produção e despesas.</li>
                <li>4. Relatórios exportáveis sem dados de demonstração.</li>
              </ul>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
