import { LayoutDashboard, ShoppingCart, Gauge, Users, Receipt, PackagePlus, Factory, Truck, ScrollText, ListTree, BarChart3 } from "lucide-react";

export type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };
export type NavGroup = { title?: string; items: NavItem[] };

export const navGroups: NavGroup[] = [
  {
    title: "Часто",
    items: [
      { to: "/", label: "Головна", icon: LayoutDashboard },
      { to: "/demand", label: "Потреба", icon: ShoppingCart },
      { to: "/production", label: "Виробництво", icon: Factory },
      { to: "/packing", label: "Комплектація", icon: Truck },
      { to: "/purchases", label: "Закупки", icon: Receipt },
      { to: "/receipts", label: "Приходи", icon: PackagePlus },
    ],
  },
  {
    title: "Рідко",
    items: [
      { to: "/min-stock", label: "Мінімальні залишки", icon: Gauge },
      { to: "/contractors", label: "Контрагенти", icon: Users },
      { to: "/specs", label: "Специфікації", icon: ListTree },
      { to: "/journal", label: "Журнал", icon: ScrollText },
      { to: "/reports", label: "Звіти", icon: BarChart3 },
    ],
  },
] as const;

export const navItems = navGroups.flatMap((g) => g.items);
