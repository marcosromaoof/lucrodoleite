import {
  BarChart3,
  Beef,
  ClipboardList,
  FileDown,
  Milk,
  Scale,
  Settings,
  Wallet,
} from "lucide-react";

export const navigationItems = [
  { href: "/painel", label: "Painel", icon: BarChart3 },
  { href: "/producao", label: "Produção", icon: Milk },
  { href: "/vacas", label: "Vacas", icon: Beef },
  { href: "/despesas", label: "Despesas", icon: Wallet },
  { href: "/fechamento", label: "Fechamento", icon: ClipboardList },
  { href: "/racoes", label: "Rações", icon: Scale },
  { href: "/relatorios", label: "Relatórios", icon: FileDown },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
] as const;
