import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/AppShell";
import { EmptyState, ErrorState, LoadingRows } from "@/components/DataState";
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

function Dashboard() {
  const summary = useQuery({ queryKey: ["summary"], queryFn: api.getSummary });
  const journal = useQuery({ queryKey: ["journal"], queryFn: () => api.getJournal() });
  const demand = useQuery({ queryKey: ["demand"], queryFn: api.getDemand });

  const s = summary.data;
  const cards = [
    { label: "Сумарний дефіцит до закупки", value: s && fmtMoney(s.deficitValue), to: "/demand" },
    { label: "Активні задачі виробництва", value: s && fmtNum(s.activeTasks), to: "/production" },
    { label: "Борг постачальникам", value: s && fmtMoney(s.supplierDebt), to: "/contractors" },
    { label: "Готово до відвантаження", value: s && `${fmtNum(s.readyToShip)} замовл.`, to: "/shipping" },
    { label: "До комплектації", value: s && `${fmtNum(s.toPack)} замовл.`, to: "/packing" },
  ] as const;

  const top = (demand.data ?? []).flatMap((g) => g.rows).filter((r) => r.deficit > 0).sort((a, b) => b.deficit - a.deficit).slice(0, 5);

  return (
    <>
      <PageHeader title="Головна" context="Зведення по складу, закупках і виробництву" />
      <div className="space-y-4 p-4 md:p-6">
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
      </div>
    </>
  );
}
