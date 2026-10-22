import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { RefreshCw, Zap } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { EmptyState, ErrorState, LoadingRows } from "@/components/DataState";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { fmtDateTime, fmtMoney, fmtNum } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Головна — GERTS адмін" },
      { name: "description", content: "Зведення: дефіцит, виробництво, борги постачальникам, відвантаження." },
      { property: "og:title", content: "Головна — GERTS адмін" },
      { property: "og:description", content: "Зведення операцій виробництва GERTS." },
    ],
  }),
  component: Dashboard,
});

function SyncBlock() {
  const qc = useQueryClient();
  const st = useQuery({ queryKey: ["mrp-status"], queryFn: api.mrpStatus, refetchInterval: 15000 });
  const [running, setRunning] = useState(false);
  const run = useMutation({
    mutationFn: (force: boolean) => api.mrpRun(force),
    onSuccess: (r) => {
      setRunning(true);
      toast.success(r.mode === "force" ? "Запущено повне оновлення (2-4 хв)" : "Запущено швидке оновлення (~15 с)");
      setTimeout(() => { setRunning(false); void qc.invalidateQueries(); }, 30000);
    },
    onError: (e: Error) => toast.error(`Помилка: ${e.message}`),
  });
  const finished = st.data?.status.finished_at;
  const result = st.data?.status.result;
  return (
    <section className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-4 py-3">
      <div className="mr-auto text-sm">
        <span className="text-muted-foreground">Синхронізація з CRM: </span>
        <span className="font-medium">{finished || "ще не було"}</span>
        <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${running ? "bg-warning/15 text-warning" : result === "ok" ? "bg-success-foreground/15 text-success-foreground" : "bg-destructive/15 text-destructive"}`}>
          {running ? "виконується…" : result === "ok" ? "ok" : (result || "немає даних")}
        </span>
      </div>
      <Button variant="outline" size="sm" disabled={running || run.isPending} onClick={() => run.mutate(false)}>
        <RefreshCw className="mr-2 h-4 w-4" /> Швидке оновлення
      </Button>
      <Button size="sm" disabled={running || run.isPending} onClick={() => run.mutate(true)}>
        <Zap className="mr-2 h-4 w-4" /> Повне оновлення
      </Button>
    </section>
  );
}

function Dashboard() {
  const summary = useQuery({ queryKey: ["summary"], queryFn: api.getSummary });
  const journal = useQuery({ queryKey: ["journal"], queryFn: () => api.getJournal() });
  const demand = useQuery({ queryKey: ["demand"], queryFn: api.getDemand });
  const today = useQuery({ queryKey: ["today"], queryFn: api.getToday });

  const s = summary.data;
  const cards = [
    { label: "Сумарний дефіцит до закупки", value: s && fmtMoney(s.deficitValue), to: "/demand" },
    { label: "Активні задачі виробництва", value: s && fmtNum(s.activeTasks), to: "/production" },
    { label: "Борг постачальникам", value: s && fmtMoney(s.supplierDebt), to: "/contractors" },
    { label: "Готово до відвантаження", value: s && `${fmtNum(s.readyToShip)} замовл.`, to: "/packing" },
    { label: "Чекають виробництва", value: s && `${fmtNum(s.toPack)} замовл.`, to: "/packing" },
  ] as const;

  const top = (demand.data ?? []).flatMap((g) => g.rows).filter((r) => r.deficit > 0).sort((a, b) => b.deficit - a.deficit).slice(0, 5);

  return (
    <>
      <PageHeader title="Головна" context="Зведення по складу, закупках і виробництву" />
      <div className="space-y-4 p-4 md:p-6">
        <SyncBlock />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {cards.map((c) => (
            <Link key={c.to} to={c.to} className="rounded-lg border bg-card p-4 transition-colors hover:border-primary">
              <div className="text-xs text-muted-foreground">{c.label}</div>
              <div className="mt-2 text-xl font-semibold tabular-nums">
                {summary.isError ? "—" : (c.value ?? <span className="text-muted-foreground">Завантаження…</span>)}
              </div>
            </Link>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          <section className="rounded-lg border bg-card lg:col-span-3">
            <h2 className="border-b px-4 py-3 text-sm font-medium">Що робити сьогодні</h2>
            {today.isLoading ? <LoadingRows rows={4} /> : today.isError ? <ErrorState /> : !today.data ? null : (
              <div className="divide-y text-sm">
                {today.data.ready.length > 0 && (
                  <div className="flex items-center justify-between gap-2 px-4 py-2">
                    <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-success-foreground" /> Відвантажити готові</span>
                    <span className="text-muted-foreground">
                      {today.data.ready.map((r) => `${r.id}${r.date ? ` (${r.date.slice(5)})` : ""}`).join(", ")}
                    </span>
                  </div>
                )}
                {today.data.pack.length > 0 && (
                  <div className="flex items-center justify-between gap-2 px-4 py-2">
                    <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-warning" /> Чекають виробництва</span>
                    <span className="text-muted-foreground">{today.data.pack.map((r) => r.id).join(", ")}</span>
                  </div>
                )}
                {today.data.tasks.length > 0 && (
                  <div className="flex items-center justify-between gap-2 px-4 py-2">
                    <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary" /> У виробництві</span>
                    <span className="text-muted-foreground">
                      {today.data.tasks.slice(0, 4).map((t) => `${t.name}${t.due ? ` до ${t.due.slice(5)}` : ""}`).join(" · ")}
                    </span>
                  </div>
                )}
                {today.data.deficit.length > 0 && (
                  <div className="flex items-center justify-between gap-2 px-4 py-2">
                    <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-destructive" /> Дозакупити терміново</span>
                    <span className="text-muted-foreground">
                      {today.data.deficit.map((d) => `${d.name.split(" (")[0]} −${d.deficit}`).join(" · ")}
                    </span>
                  </div>
                )}
                {!today.data.ready.length && !today.data.pack.length && !today.data.tasks.length && !today.data.deficit.length && (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">Сьогодні все спокійно 🎉</div>
                )}
              </div>
            )}
          </section>

          <section className="rounded-lg border bg-card lg:col-span-2">
            <h2 className="border-b px-4 py-3 text-sm font-medium">Топ дефіциту</h2>
            {demand.isLoading ? <LoadingRows /> : demand.isError ? <ErrorState /> : !top.length ? <EmptyState /> : (
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="th-ops px-4 py-2 text-left">Артикул</th><th className="th-ops px-4 py-2 text-left">Найменування</th><th className="th-ops num px-4 py-2">До замовлення</th></tr></thead>
                <tbody>
                  {top.map((r) => (
                    <tr key={r.sku + (r.parentSku ?? "")} className="border-b last:border-0 hover:bg-accent">
                      <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-muted-foreground">{r.sku}</td>
                      <td className="px-4 py-2">{r.name}</td>
                      <td className="num px-4 py-2 font-medium text-warning">{fmtNum(r.deficit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>

        <section className="rounded-lg border bg-card">
          <h2 className="border-b px-4 py-3 text-sm font-medium">Останні операції</h2>
          {journal.isLoading ? <LoadingRows /> : journal.isError ? <ErrorState /> : !journal.data?.length ? <EmptyState /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="th-ops px-4 py-2 text-left">Час</th><th className="th-ops px-4 py-2 text-left">Дія</th><th className="th-ops px-4 py-2 text-left">Деталі</th></tr></thead>
                <tbody>
                  {journal.data.slice(0, 10).map((j, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-accent">
                      <td className="whitespace-nowrap px-4 py-2 tabular-nums text-muted-foreground">{fmtDateTime(j.ts)}</td>
                      <td className="whitespace-nowrap px-4 py-2">{j.action}</td>
                      <td className="px-4 py-2 text-muted-foreground">{j.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
