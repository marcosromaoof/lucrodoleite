import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type DashboardActionProps = {
  href: string;
  icon: LucideIcon;
  label: string;
  variant?: "primary" | "wood" | "outline";
};

export function DashboardAction({ href, icon: Icon, label, variant = "primary" }: DashboardActionProps) {
  return (
    <Link className={`dashboard-action dashboard-action-${variant}`} href={href}>
      <Icon aria-hidden="true" size={23} />
      {label}
    </Link>
  );
}
