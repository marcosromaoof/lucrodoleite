import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Milk } from "lucide-react";
import { signInWithGoogleAction } from "@/app/entrar/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import type { PageSearchParams } from "@/lib/app/search-params";
import { getSearchParam } from "@/lib/app/search-params";
import { getOptionalSession } from "@/lib/auth/session";

type EntrarPageProps = {
  searchParams?: PageSearchParams;
};

export default async function EntrarPage({ searchParams }: EntrarPageProps) {
  const session = await getOptionalSession();
  const callbackUrl = getSafeCallbackUrl((await getSearchParam(searchParams, "callbackUrl")) ?? "/painel");

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)] px-4 py-8 text-[color:var(--foreground)]">
      <section className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_24px_70px_rgba(19,35,24,0.12)]">
        <Link className="inline-flex items-center gap-2 text-sm font-bold text-[color:var(--farm-green)]" href="/">
          <ArrowLeft aria-hidden="true" size={17} />
          Inicio
        </Link>
        <div className="mt-6 flex items-center gap-3">
          <div className="grid size-14 place-items-center rounded-full border-2 border-[var(--farm-green)] bg-[var(--milk-white)] text-[color:var(--farm-green)]">
            <Milk aria-hidden="true" size={30} />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-black leading-none text-[color:var(--farm-green-dark)]">
              Lucro do Leite
            </h1>
            <p className="mt-1 text-sm text-[color:var(--muted)]">Acesse sua fazenda com seguranca.</p>
          </div>
        </div>

        <form
          action={signInWithGoogleAction}
          className="mt-8"
          data-feedback-pending="Abrindo login do Google..."
          data-feedback-success="Login processado."
        >
          <input name="callbackUrl" type="hidden" value={callbackUrl} />
          <SubmitButton
            className="primary-button inline-flex w-full items-center justify-center gap-2"
            pendingLabel="Abrindo Google..."
          >
            Entrar com Google
            <ArrowRight aria-hidden="true" size={20} />
          </SubmitButton>
        </form>

        <p className="mt-5 text-sm leading-6 text-[color:var(--muted)]">
          O primeiro acesso cria sua conta automaticamente. Depois disso, suas fazendas e lancamentos ficam vinculados
          ao seu usuario.
        </p>
      </section>
    </main>
  );
}

function getSafeCallbackUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return "/painel";
}
