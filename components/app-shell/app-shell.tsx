import Link from "next/link";
import { Milk } from "lucide-react";
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
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col border-x border-[var(--border)] bg-[var(--surface)] lg:flex-row">
        <aside className="border-b border-[var(--border)] bg-[var(--farm-green)] text-white lg:w-72 lg:border-b-0 lg:border-r">
          <Link className="flex items-center gap-3 border-b border-white/15 px-6 py-6" href="/painel">
            <div className="grid size-12 place-items-center rounded-lg bg-[var(--milk-white)] text-[var(--farm-green)]">
              <Milk aria-hidden="true" size={28} strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-xl font-bold leading-tight">Lucro do Leite</p>
              <p className="text-sm text-white/75">Gestão que dá resultado</p>
            </div>
          </Link>

          <nav className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4 lg:grid-cols-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = item.href === activeHref;

              return (
                <Link
                  className={`flex min-h-12 items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
                    active ? "bg-white/14 text-white" : "text-white/84 hover:bg-white/8 hover:text-white"
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
        </aside>

        <section className="flex-1">
          <header className="border-b border-[var(--border)] bg-[var(--pasture)] px-5 py-5 sm:px-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                  {eyebrow}
                </p>
                <h1 className="mt-1 text-3xl font-bold text-[var(--farm-green)]">{title}</h1>
              </div>

              <div className="rounded-md border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold">
                Banco:{" "}
                <span className={databaseConfigured ? "text-[var(--success)]" : "text-[var(--warning)]"}>
                  {getDatabaseStatusLabel()}
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
