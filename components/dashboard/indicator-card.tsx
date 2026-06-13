import type { LucideIcon } from "lucide-react";

type IndicatorCardProps = {
  icon: LucideIcon;
  label: string;
  helper: string;
  tone?: "green" | "wood";
  value: string;
};

export function IndicatorCard({ icon: Icon, label, helper, tone = "green", value }: IndicatorCardProps) {
  return (
    <div className="grid min-h-48 place-items-center border-r border-[var(--border)] px-4 text-center last:border-r-0">
      <div>
        <Icon
          aria-hidden="true"
          className={tone === "green" ? "mx-auto text-[color:var(--farm-green)]" : "mx-auto text-[color:var(--wood)]"}
          size={43}
        />
        <p className="mt-3 text-sm font-semibold leading-5">{label}</p>
        <p className="mt-3 text-3xl font-black text-[color:var(--farm-green)]">{value}</p>
        <p className="mt-2 text-xs text-[color:var(--muted)]">{helper}</p>
      </div>
    </div>
  );
}
