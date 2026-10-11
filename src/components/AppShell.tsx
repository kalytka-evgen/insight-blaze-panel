import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { navItems } from "@/lib/nav";
import { api } from "@/lib/api";

export function AppShell({ children }: { children: ReactNode }) {
  const products = useQuery({ queryKey: ["products"], queryFn: api.getProducts });
  const lowCount = (products.data ?? []).filter((p) => p.stock < p.minStock).length;
  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r bg-sidebar md:flex">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">G</div>
          <span className="font-semibold tracking-wide">GERTS</span>
          <span className="text-xs text-muted-foreground">адмін</span>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {navItems.map((i) => (
            <Link
              key={i.to}
              to={i.to}
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
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t bg-sidebar md:hidden">
        {navItems.map((i) => (
          <Link
            key={i.to}
            to={i.to}
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
