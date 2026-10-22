import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Factory } from "lucide-react";
import { navGroups, type NavGroup } from "@/lib/nav";
import { api, enableLiveApi, hydrate } from "@/lib/api";
import { getRole, type Role } from "@/lib/role";
import { RoleGate, RoleSwitcher } from "@/components/RoleGate";

export function AppShell({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const router = useRouter();
  const [role, setRoleState] = useState<Role | null>(getRole());

  useEffect(() => {
    enableLiveApi();
    hydrate().then(() => qc.invalidateQueries());
    if (!document.getElementById("gerts-fonts")) {
      const pre = document.createElement("link");
      pre.rel = "preconnect";
      pre.href = "https://fonts.googleapis.com";
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.id = "gerts-fonts";
      css.href = "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap";
      document.head.append(pre, css);
    }
  }, [qc]);

  // виконавець завжди потрапляє на «Моя робота»
  useEffect(() => {
    if (role === "worker" && router.state.location.pathname !== "/work") {
      router.navigate({ to: "/work" });
    }
  }, [role, router]);

  const products = useQuery({ queryKey: ["products"], queryFn: api.getProducts });
  const lowCount = (products.data ?? []).filter((p) => p.stock < p.minStock).length;

  if (!role) {
    return <RoleGate onDone={(r) => setRoleState(r)} />;
  }
  if (role === "packer") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sidebar p-4 text-center text-sm text-muted-foreground">
        Перенаправляємо на комплектацію…
      </div>
    );
  }

  const groups: NavGroup[] = role === "worker"
    ? [{ items: [{ to: "/work", label: "Моя робота", icon: Factory } as const] }]
    : navGroups;

  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r bg-sidebar md:flex">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">G</div>
          <span className="font-semibold tracking-wide">GERTS</span>
          <span className="text-xs text-muted-foreground">{role === "worker" ? "виробництво" : "адмін"}</span>
        </div>
        <nav className="flex-1 space-y-3 overflow-y-auto p-2">
          {groups.map((g, gi) => (
            <div key={gi} className="space-y-0.5">
              {g.title && <div className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">{g.title}</div>}
              {g.items.map((i) => (
                <Link
                  key={i.to}
                  to={i.to as never}
                  activeOptions={{ exact: i.to === "/" }}
                  className="flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                  activeProps={{ className: "bg-sidebar-accent !text-foreground font-medium" }}
                >
                  <i.icon className="h-4 w-4" />
                  {i.label}
                  {i.to === "/min-stock" && lowCount > 0 && (
                    <span title="Позицій нижче мінімуму" className="ml-auto rounded-full bg-warning/20 px-1.5 text-[11px] font-semibold tabular-nums text-warning">{lowCount}</span>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="border-t p-2">
          <RoleSwitcher role={role} />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t bg-sidebar md:hidden">
        {groups.flatMap((g) => g.items).map((i) => (
          <Link
            key={i.to}
            to={i.to as never}
            activeOptions={{ exact: i.to === "/" }}
            className="flex min-h-14 min-w-[76px] flex-col items-center justify-center gap-1 px-2 text-[10px] text-muted-foreground"
            activeProps={{ className: "!text-primary" }}
          >
            <span className="relative">
              <i.icon className="h-5 w-5" />
              {i.to === "/min-stock" && lowCount > 0 && <span className="absolute -right-2 -top-1 rounded-full bg-warning px-1 text-[9px] font-bold text-warning-foreground">{lowCount}</span>}
            </span>
            <span className="whitespace-nowrap">{i.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageHeader({ title, context, actions }: { title: string; context?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 border-b px-4 py-4 md:px-6">
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        {context && <p className="mt-0.5 text-sm text-muted-foreground">{context}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
