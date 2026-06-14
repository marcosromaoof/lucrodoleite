import type { LucideIcon } from "lucide-react";

type IndicatorCardProps = {
  icon: LucideIcon;
  label: string;
  helper: string;
  negative?: boolean;
  tone?: "green" | "wood";
  value: string;
};

export function IndicatorCard({ icon: Icon, label, helper, negative = false, tone = "green", value }: IndicatorCardProps) {
  return (
    <div className="indicator-card">
      <div>
        <Icon
          aria-hidden="true"
          className={tone === "green" ? "text-[color:var(--farm-green)]" : "text-[color:var(--wood)]"}
          size={38}
        />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-black leading-5">{label}</p>
        <p className={`indicator-value ${negative ? "financial-negative" : "text-[color:var(--farm-green)]"}`}>
          {value}
        </p>
        <p className="mt-1 text-xs leading-4 text-[color:var(--muted)]">{helper}</p>
      </div>
    </div>
  );
}
