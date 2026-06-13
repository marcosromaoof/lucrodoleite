import { Database } from "lucide-react";

type SetupCalloutProps = {
  title?: string;
  children: React.ReactNode;
};

export function SetupCallout({ title = "Aguardando configuração real", children }: SetupCalloutProps) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--milk-white)] p-4">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-md bg-[var(--pasture)] text-[var(--farm-green)]">
          <Database aria-hidden="true" size={21} />
        </div>
        <div>
          <p className="font-bold">{title}</p>
          <div className="mt-1 text-sm leading-6 text-[var(--muted)]">{children}</div>
        </div>
      </div>
    </div>
  );
}
