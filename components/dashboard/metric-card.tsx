import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  icon: LucideIcon;
  label: string;
  helper: string;
  tone?: "green" | "blue" | "wood";
};

export function MetricCard({ icon: Icon, label, helper, tone = "green" }: MetricCardProps) {
  return (
    <div className="metric-card">
      <p className="text-sm font-bold">{label}</p>
      <Icon aria-hidden="true" className={`metric-icon metric-icon-${tone}`} size={38} />
      <p className="mt-3 text-3xl font-black tracking-tight">--</p>
      <p className="mt-1 text-sm text-[color:var(--muted)]">{helper}</p>
      <span className="mt-4 inline-flex rounded-md border border-[var(--border)] bg-[var(--milk-white)] px-2 py-1 text-xs font-bold text-[color:var(--muted)]">
        Sem dados reais
      </span>
    </div>
  );
}
