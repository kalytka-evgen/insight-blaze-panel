import { Link } from "@tanstack/react-router";
import { Factory, PackageCheck, LayoutDashboard, X } from "lucide-react";
import { getRole, setRole, type Role } from "@/lib/role";

/** Перший екран: вибір ролі. Одна кнопка — і людина бачить тільки своє. */
export function RoleGate({ onDone }: { onDone: (r: Role) => void }) {
  const pick = (r: Role) => {
    setRole(r);
    if (r === "packer") {
      window.location.href = "https://pricegen.feedstream.com.ua/legacy/packer/";
      return;
    }
    onDone(r);
  };
  const items = [
    { r: "worker" as Role, icon: Factory, title: "Виробництво", desc: "Я зварюю, фарбую, збираю вироби", cta: "Моя робота" },
    { r: "packer" as Role, icon: PackageCheck, title: "Комплектація", desc: "Я збираю замовлення і друкую ТТН", cta: "Мої замовлення" },
    { r: "manager" as Role, icon: LayoutDashboard, title: "Менеджер", desc: "Закупки, склад, відвантаження, звіти", cta: "Адмінка" },
  ];
  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar p-4">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">G</div>
          <h1 className="text-xl font-semibold">GERTS · склад</h1>
          <p className="mt-1 text-sm text-muted-foreground">Хто ти сьогодні?</p>
        </div>
        <div className="space-y-3">
          {items.map((i) => (
            <button key={i.r} onClick={() => pick(i.r)}
              className="flex w-full items-center gap-4 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-sidebar-accent">
                <i.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-base font-semibold">{i.title}</div>
                <div className="text-sm text-muted-foreground">{i.desc}</div>
              </div>
              <span className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">{i.cta}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Кнопка зміни ролі (в шапці). */
export function RoleSwitcher({ role }: { role: Role }) {
  const labels: Record<Role, string> = { worker: "Виробництво", packer: "Комплектація", manager: "Менеджер" };
  return (
    <Link
      to="/"
      search={{ role: true } as never}
      onClick={(e) => {
        e.preventDefault();
        try { localStorage.removeItem("gerts-role"); } catch { /* noop */ }
        window.location.href = "/legacy/admin/";
      }}
      className="flex h-9 items-center gap-2 rounded-md px-2.5 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
    >
      <X className="h-4 w-4" />
      {labels[role]} · змінити
    </Link>
  );
}
