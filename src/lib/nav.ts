import { LayoutDashboard, ShoppingCart, Gauge, Users, Receipt, PackagePlus, Factory, Truck, ClipboardList, ScrollText, ListTree, BarChart3 } from "lucide-react";

export const navItems = [
  { to: "/", label: "Головна", icon: LayoutDashboard },
  { to: "/demand", label: "Потреба", icon: ShoppingCart },
  { to: "/min-stock", label: "Мінімальні залишки", icon: Gauge },
  { to: "/contractors", label: "Контрагенти", icon: Users },
  { to: "/purchases", label: "Закупки", icon: Receipt },
  { to: "/receipts", label: "Приходи", icon: PackagePlus },
  { to: "/production", label: "Виробництво", icon: Factory },
  { to: "/shipping", label: "Відвантаження", icon: Truck },
  { to: "/packing", label: "Комплектація", icon: ClipboardList },
  { to: "/journal", label: "Журнал", icon: ScrollText },
  { to: "/specs", label: "Специфікації", icon: ListTree },
  { to: "/reports", label: "Звіти", icon: BarChart3 },
] as const;
