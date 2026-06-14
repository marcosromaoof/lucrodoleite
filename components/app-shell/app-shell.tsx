import Link from "next/link";
import { Bell, CalendarDays, LogOut, Milk, MoreHorizontal, RefreshCcw } from "lucide-react";
import { signOut } from "@/auth";
import { getDatabaseStatusLabel, isDatabaseConfigured } from "@/lib/app/environment";
import { navigationItems } from "@/lib/app/navigation";
import { getOptionalSession } from "@/lib/auth/session";
import type { FarmOption } from "@/lib/repositories/farms";
import { SubmitButton } from "@/components/ui/submit-button";

type AppShellProps = {
  activeHref: string;
  activeFarmId?: string;
  title: string;
  eyebrow: string;
  farms?: FarmOption[];
  referenceMonth?: string;
  referenceMonthLabel?: string;
  children: React.ReactNode;
};

export async function AppShell({
  activeFarmId = "",
  activeHref,
  title,
  eyebrow,
  farms = [],
  referenceMonth = "",
  referenceMonthLabel = "Mês de referência",
  children,
}: AppShellProps) {
  const databaseConfigured = isDatabaseConfigured();
  const session = await getOptionalSession();
  const activeFarm = farms.find((farm) => farm.id === activeFarmId) ?? null;
  const userInitials = getInitials(session?.user?.name ?? session?.user?.email ?? "LL");
  const mobilePrimaryHrefs = new Set(["/painel", "/producao", "/despesas", "/racoes"]);
  const mobilePrimaryItems = navigationItems.filter((item) => mobilePrimaryHrefs.has(item.href));
  const mobileMoreItems = navigationItems.filter((item) => !mobilePrimaryHrefs.has(item.href));
  const mobileMoreActive = mobileMoreItems.some((item) => item.href === activeHref);

  async function signOutAction() {
    "use server";

    await signOut({ redirectTo: "/" });
  }

  return (
    <main className="app-root">
      <div className="app-frame">
        <aside className="app-sidebar">
          <Link className="brand-panel" href="/painel">
            <div className="brand-mark">
              <Milk aria-hidden="true" size={42} strokeWidth={2.4} />
            </div>
            <p className="brand-title">
              Lucro
              <br />
              do Leite
            </p>
            <p className="brand-ribbon">Gestão que dá resultado</p>
          </Link>

          <nav className="sidebar-nav">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = item.href === activeHref;

              return (
                <Link
                  className={`sidebar-link ${active ? "sidebar-link-active" : ""}`}
                  href={item.href}
                  key={item.href}
                >
                  <Icon aria-hidden="true" size={20} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="sidebar-farm-card">
            <p className="text-sm font-bold">{activeFarm?.name ?? "Fazenda não configurada"}</p>
            <p className="mt-1 text-xs text-white/70">
              {activeFarm?.ownerName ?? activeFarm?.city ?? "Cadastre a primeira fazenda"}
            </p>
          </div>
        </aside>

        <section className="app-main">
          <header className="topbar">
            <div className="topbar-content">
              <form
                className="context-form"
                data-feedback-pending="Aplicando filtros..."
                data-feedback-success="Filtros aplicados. Confira o período atualizado."
                method="get"
              >
                <label className="sr-only" htmlFor="farmId">
                  Fazenda
                </label>
                <select
                  className="topbar-control farm-select"
                  disabled={farms.length === 0}
                  id="farmId"
                  name="farmId"
                  defaultValue={activeFarmId}
                >
                  {farms.length === 0 ? <option value="">Cadastre uma fazenda</option> : null}
                  {farms.map((farm) => (
                    <option key={farm.id} value={farm.id}>
                      {farm.name}
                    </option>
                  ))}
                </select>

                <label
                  className="topbar-control month-control"
                  htmlFor="referenceMonth"
                >
                  <CalendarDays aria-hidden="true" size={19} />
                  <span className="sr-only">Mês de referência</span>
                  <input
                    id="referenceMonth"
                    name="referenceMonth"
                    type="month"
                    defaultValue={referenceMonth}
                  />
                </label>

                <SubmitButton
                  className="topbar-apply"
                  pendingLabel="Aplicando..."
                >
                  <RefreshCcw aria-hidden="true" size={18} />
                  Aplicar
                </SubmitButton>
              </form>

              <div className="topbar-tools">
                <span className="status-chip">
                  {eyebrow}: {title}
                </span>
                <span className="status-chip status-chip-secondary">
                  {referenceMonthLabel}
                </span>
                <span className="status-chip">
                  Banco:{" "}
                  <span className={databaseConfigured ? "text-[color:var(--success)]" : "text-[color:var(--warning)]"}>
                    {getDatabaseStatusLabel()}
                  </span>
                </span>
                <span className="topbar-icon-button" title="Filtros atualizados ao aplicar">
                  <RefreshCcw aria-hidden="true" size={18} />
                </span>
                <span className="topbar-icon-button" title="Notificações">
                  <Bell aria-hidden="true" size={18} />
                </span>
                <span className="topbar-avatar" title={session?.user?.email ?? session?.user?.name ?? "Usuário"}>
                  {userInitials}
                </span>
                <form
                  action={signOutAction}
                  data-feedback-pending="Saindo da conta..."
                  data-feedback-success="Sessão encerrada."
                >
                  <button
                    aria-label="Sair"
                    className="topbar-icon-button"
                    title="Sair"
                    type="submit"
                  >
                    <LogOut aria-hidden="true" size={18} />
                  </button>
                </form>
              </div>
            </div>
          </header>

          <div className="app-content">{children}</div>
        </section>

        <nav className="mobile-tabbar" aria-label="Navegação principal">
          {mobilePrimaryItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === activeHref;

            return (
              <Link className={active ? "mobile-tab-active" : ""} href={item.href} key={item.href}>
                <Icon aria-hidden="true" size={17} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <details className={`mobile-more ${mobileMoreActive ? "mobile-tab-active" : ""}`}>
            <summary>
              <MoreHorizontal aria-hidden="true" size={17} />
              <span>Mais</span>
            </summary>
            <div className="mobile-more-menu">
              {mobileMoreItems.map((item) => {
                const Icon = item.icon;
                const active = item.href === activeHref;

                return (
                  <Link className={active ? "mobile-more-active" : ""} href={item.href} key={item.href}>
                    <Icon aria-hidden="true" size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </details>
        </nav>
      </div>
    </main>
  );
}

function getInitials(value: string) {
  return value
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
