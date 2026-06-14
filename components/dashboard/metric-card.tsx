import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  icon: LucideIcon;
  label: string;
  helper: string;
  negative?: boolean;
  status?: string;
  tone?: "green" | "blue" | "wood";
  value: string;
};

export function MetricCard({ icon: Icon, label, helper, negative = false, status, tone = "green", value }: MetricCardProps) {
  return (
    <div className="metric-card">
      <p className="text-sm font-bold">{label}</p>
      <Icon aria-hidden="true" className={`metric-icon metric-icon-${tone}`} size={38} />
      <p className={`metric-value ${negative ? "financial-negative" : ""}`}>{value}</p>
      <p className="mt-1 text-sm text-[color:var(--muted)]">{helper}</p>
      {status ? (
        <span className="mt-4 inline-flex rounded-md border border-[var(--border)] bg-[var(--milk-white)] px-2 py-1 text-xs font-bold text-[color:var(--muted)]">
          {status}
        </span>
      ) : null}
    </div>
  );
}
