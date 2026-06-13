import Link from "next/link";
import { Bell, CalendarDays, ChevronDown, Milk, RefreshCcw } from "lucide-react";
import { getDatabaseStatusLabel, isDatabaseConfigured } from "@/lib/app/environment";
import { navigationItems } from "@/lib/app/navigation";

type AppShellProps = {
  activeHref: string;
  title: string;
  eyebrow: string;
  children: React.ReactNode;
};

export function AppShell({ activeHref, title, eyebrow, children }: AppShellProps) {
  const databaseConfigured = isDatabaseConfigured();

  return (
    <main className="min-h-screen bg-[var(--background)] px-2 py-2 text-[color:var(--foreground)] sm:px-3">
      <div className="mx-auto flex min-h-[calc(100vh-1rem)] max-w-[1500px] flex-col overflow-hidden rounded-[12px] border-4 border-[var(--farm-green-dark)] bg-[var(--surface)] shadow-[0_24px_70px_rgba(19,35,24,0.12)] lg:flex-row">
        <aside className="relative border-b border-[var(--border)] bg-[var(--farm-green)] text-white lg:w-[250px] lg:border-b-0 lg:border-r">
          <Link className="flex min-h-[154px] flex-col items-center justify-center gap-2 border-b border-[var(--border)] bg-[var(--logo-panel)] px-5 py-6 text-[color:var(--farm-green)]" href="/painel">
            <div className="relative grid size-20 place-items-center rounded-full border-4 border-[var(--farm-green)] bg-[var(--milk-white)]">
              <Milk aria-hidden="true" size={42} strokeWidth={2.4} />
            </div>
            <div className="text-center">
              <p className="font-serif text-3xl font-black uppercase leading-[0.9] tracking-tight">
                Lucro
                <br />
                do Leite
              </p>
              <p className="mt-2 rounded-sm bg-[var(--wood)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-white">
                Gestão que dá resultado
              </p>
            </div>
          </Link>

          <nav className="grid grid-cols-2 gap-2 bg-[linear-gradient(180deg,#0d4d2d,#07351f)] p-4 sm:grid-cols-4 lg:grid-cols-1 lg:gap-3">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = item.href === activeHref;

              return (
                <Link
                  className={`flex min-h-12 items-center gap-3 rounded-lg px-4 text-sm font-bold transition ${
                    active ? "bg-white/12 text-white shadow-inner" : "text-white/88 hover:bg-white/8 hover:text-white"
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  <Icon aria-hidden="true" size={20} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden px-4 pb-5 lg:absolute lg:bottom-0 lg:block lg:w-full">
            <div className="rounded-lg border border-white/22 bg-white/8 p-3">
              <p className="text-sm font-bold">Fazenda não configurada</p>
              <p className="text-xs text-white/70">Aguardando autenticação</p>
            </div>
            <div className="mt-4 h-20 rounded-lg border border-white/12 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.08)),linear-gradient(135deg,transparent_0_40%,rgba(181,123,54,0.45)_40%_44%,transparent_44%_100%)]" />
          </div>
        </aside>

        <section className="flex-1">
          <header className="relative min-h-[154px] overflow-hidden border-b border-[var(--border)] bg-[var(--pasture)]">
            <div className="absolute inset-0 bg-[url('/assets/pasture-header.png')] bg-cover bg-center opacity-95" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,253,248,0.96)_0%,rgba(255,253,248,0.74)_36%,rgba(255,253,248,0.28)_100%)]" />
            <div className="relative z-10 flex flex-col justify-between gap-4 px-5 py-5 sm:px-8 lg:flex-row lg:items-start">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <button className="inline-flex min-h-12 items-center gap-3 rounded-lg border border-[var(--border)] bg-white/86 px-4 text-base font-bold shadow-sm" type="button">
                  Selecionar fazenda
                  <ChevronDown aria-hidden="true" size={18} />
                </button>
                <button className="inline-flex min-h-12 items-center gap-3 rounded-lg border border-[var(--border)] bg-white/86 px-4 text-base font-bold shadow-sm" type="button">
                  <CalendarDays aria-hidden="true" size={19} />
                  Mês de referência
                  <ChevronDown aria-hidden="true" size={18} />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
                <span className="rounded-lg border border-[var(--border)] bg-white/88 px-3 py-2 text-[color:var(--muted)] shadow-sm">
                  {eyebrow}: {title}
                </span>
                <span className="rounded-lg border border-[var(--border)] bg-white/88 px-3 py-2 shadow-sm">
                  Banco:{" "}
                  <span className={databaseConfigured ? "text-[color:var(--success)]" : "text-[color:var(--warning)]"}>
                    {getDatabaseStatusLabel()}
                  </span>
                </span>
                <RefreshCcw aria-hidden="true" className="text-[color:var(--farm-green)]" size={20} />
                <Bell aria-hidden="true" className="text-[color:var(--farm-green)]" size={20} />
                <span className="grid size-10 place-items-center rounded-full bg-[var(--farm-green)] text-sm font-black text-white">
                  LL
                </span>
              </div>
            </div>
          </header>

          {children}
        </section>
      </div>
    </main>
  );
}
