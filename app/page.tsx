import Link from "next/link";
import { ArrowRight, BarChart3, FileDown, Milk, Scale, Wallet } from "lucide-react";
import type { ComponentType } from "react";
import { signInWithGoogleAction } from "@/app/entrar/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { getOptionalSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await getOptionalSession();
  const isAuthenticated = Boolean(session?.user);

  return (
    <main className="min-h-screen bg-[var(--background)] text-[color:var(--foreground)]">
      <section className="relative isolate min-h-screen overflow-hidden border-b-4 border-[var(--farm-green-dark)]">
        <div className="absolute inset-0 bg-[url('/assets/pasture-header.png')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,253,248,0.98)_0%,rgba(255,253,248,0.9)_42%,rgba(255,253,248,0.42)_100%)]" />
        <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl content-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-3 rounded-lg border border-[var(--border)] bg-white/80 px-3 py-2 text-sm font-black uppercase text-[color:var(--farm-green)] shadow-sm">
              <Milk aria-hidden="true" size={20} />
              Lucro do Leite
            </div>
            <h1 className="mt-6 font-serif text-5xl font-black leading-[0.95] text-[color:var(--farm-green-dark)] sm:text-6xl">
              Gestao leiteira com resultado na ponta do lapis
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[color:var(--muted)]">
              Controle producao, despesas, racoes, fechamento mensal e relatorios da fazenda em uma area segura,
              preparada para integracao futura com aplicativo Android.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {isAuthenticated ? (
                <Link className="primary-button inline-flex items-center justify-center gap-2 px-6" href="/painel">
                  Ir para o painel
                  <ArrowRight aria-hidden="true" size={20} />
                </Link>
              ) : (
                <>
                  <form
                    action={signInWithGoogleAction}
                    data-feedback-pending="Abrindo login do Google..."
                    data-feedback-success="Login processado."
                  >
                    <input name="callbackUrl" type="hidden" value="/painel" />
                    <SubmitButton
                      className="primary-button inline-flex w-full items-center justify-center gap-2 px-6"
                      pendingLabel="Abrindo Google..."
                    >
                      Criar conta com Google
                      <ArrowRight aria-hidden="true" size={20} />
                    </SubmitButton>
                  </form>
                  <Link
                    className="inline-flex min-h-[52px] items-center justify-center rounded-lg border border-[var(--farm-green)] bg-white/86 px-6 font-black text-[color:var(--farm-green)] shadow-sm"
                    href="/entrar"
                  >
                    Entrar
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border border-[var(--border)] bg-white/82 p-4 shadow-[0_20px_60px_rgba(41,32,16,0.12)]">
            <Feature icon={BarChart3} title="Producao real" text="Litros por dia e leitura mensal sem dados ficticios." />
            <Feature icon={Wallet} title="Despesas" text="Lancamentos por mes, categoria e impacto no resultado." />
            <Feature icon={Scale} title="Racoes" text="Comparativo de custo, aumento de litros e lucro adicional." />
            <Feature icon={FileDown} title="Relatorios" text="Exportacao em PDF, CSV, XLSX, HTML e JSON." />
          </div>
        </div>
      </section>
    </main>
  );
}

function Feature({
  icon: Icon,
  text,
  title,
}: {
  icon: ComponentType<{ "aria-hidden"?: boolean; size?: number }>;
  text: string;
  title: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-[var(--border)] bg-[var(--milk-white)] p-4">
      <Icon aria-hidden={true} size={24} />
      <div>
        <h2 className="font-black text-[color:var(--farm-green-dark)]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">{text}</p>
      </div>
    </div>
  );
}
