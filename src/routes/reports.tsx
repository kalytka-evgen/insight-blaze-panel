import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/AppShell";
import { EmptyState, ErrorState, LoadingRows } from "@/components/DataState";
import { ExportButton, NativeSelect, Panel, td, tdNum, th, thNum, Toolbar, tr } from "@/components/ops";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, periodLabel, type ReportPeriod, type ReportResult } from "@/lib/api";
import { exportCsv, fmtDate, fmtMoney, fmtNum } from "@/lib/format";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Звіти по маржі — GERTS адмін" },
      { name: "description", content: "Виручка, собівартість (FIFO + збірки) і маржа по замовленнях, товарах і періодах." },
      { property: "og:title", content: "Звіти — GERTS адмін" },
      { property: "og:description", content: "Звіти по маржі." },
    ],
  }),
  component: ReportsPage,
});

type Kind = ReportResult["kind"];
const pct = (v: number) => `${fmtNum(Math.round(v * 10) / 10)} %`;

function ReportsPage() {
  const [kind, setKind] = useState<Kind>("orders");
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const r = useQuery({ queryKey: ["reports", kind, period], queryFn: () => api.getReports(kind, period) });
  const prods = useQuery({ queryKey: ["products"], queryFn: api.getProducts });
  const data = r.data?.kind === kind ? r.data : undefined;

  const abcCounts = { A: 0, B: 0, C: 0 };
  for (const p of prods.data ?? []) {
    if (p.abc) abcCounts[p.abc]++;
  }

  const totals = data ? data.rows.reduce((s, x) => ({ revenue: s.revenue + x.revenue, cost: s.cost + x.cost }), { revenue: 0, cost: 0 }) : { revenue: 0, cost: 0 };
  const tMargin = totals.revenue - totals.cost;

  const onExport = () => {
    if (!data) return;
    if (data.kind === "orders") exportCsv("zvit-zamovlennia.csv", ["№ замовлення", "Дата", "Клієнт", "Виручка", "Собівартість", "Маржа", "Маржа %"], data.rows.map((x) => [x.orderId, fmtDate(x.date), x.buyer, x.revenue, x.cost.toFixed(2), x.margin.toFixed(2), x.marginPct.toFixed(1)]));
    else if (data.kind === "products") exportCsv("zvit-tovary.csv", ["Артикул", "Назва", "Продано (шт)", "Виручка", "Собівартість", "Маржа", "Маржа %"], data.rows.map((x) => [x.sku, x.name, x.qty, x.revenue, x.cost.toFixed(2), x.margin.toFixed(2), x.marginPct.toFixed(1)]));
    else exportCsv("zvit-periody.csv", ["Період", "Виручка", "Собівартість", "Маржа", "Маржа %"], data.rows.map((x) => [periodLabel(x.period), x.revenue, x.cost.toFixed(2), x.margin.toFixed(2), x.marginPct.toFixed(1)]));
  };

  const Totals = ({ span }: { span: number }) => (
    <tfoot><tr className="border-t bg-muted/40 font-semibold">
      <td className={td} colSpan={span}>Разом</td><td className={tdNum}>{fmtMoney(totals.revenue)}</td><td className={tdNum}>{fmtMoney(totals.cost)}</td>
      <td className={tdNum}>{fmtMoney(tMargin)}</td><td className={tdNum}>{pct(totals.revenue ? (tMargin / totals.revenue) * 100 : 0)}</td>
    </tr></tfoot>
  );
  const Money = ({ x }: { x: { revenue: number; cost: number; margin: number; marginPct: number } }) => (
    <><td className={tdNum}>{fmtMoney(x.revenue)}</td><td className={tdNum}>{fmtMoney(x.cost)}</td>
      <td className={`${tdNum} ${x.margin < 0 ? "text-destructive" : "text-success-foreground"}`}>{fmtMoney(x.margin)}</td><td className={tdNum}>{pct(x.marginPct)}</td></>
  );
  const moneyHead = <><th className={thNum}>Виручка</th><th className={thNum}>Собівартість</th><th className={thNum}>Маржа</th><th className={thNum}>Маржа %</th></>;

  return (
    <>
      <PageHeader title="Звіти" context="Собівартість = списання партій за FIFO (закупки та збірки)" actions={<ExportButton onClick={onExport} />} />
      <div className="space-y-3 p-4 md:p-6">
        <Toolbar>
          <Tabs value={kind} onValueChange={(v) => setKind(v as Kind)}>
            <TabsList><TabsTrigger value="orders">По замовленнях</TabsTrigger><TabsTrigger value="products">По товарах</TabsTrigger><TabsTrigger value="periods">За періодами</TabsTrigger></TabsList>
          </Tabs>
          {kind === "periods" && (
            <NativeSelect aria-label="Період" value={period} onChange={(e) => setPeriod(e.target.value as ReportPeriod)}>
              <option value="month">Місяць</option><option value="quarter">Квартал</option><option value="year">Рік</option>
            </NativeSelect>
          )}
        </Toolbar>

        <section className="rounded-lg border bg-card p-4">
          <h2 className="text-sm font-medium">ABC-аналіз продажів</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">A — ключові позиції (80% виручки), B — середні (15%), C — рідкісні (5%). A-товари контролюємо найуважніше.</p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="rounded-lg bg-success px-3 py-1.5 font-semibold text-white">A · {abcCounts.A} товарів</span>
            <span className="rounded-lg bg-primary/10 px-3 py-1.5 font-semibold text-primary">B · {abcCounts.B} товарів</span>
            <span className="rounded-lg bg-muted px-3 py-1.5 font-semibold text-muted-foreground">C · {abcCounts.C} товарів</span>
          </div>
        </section>

        {r.isLoading || !data ? (r.isError ? <ErrorState /> : <LoadingRows rows={6} />) : !data.rows.length ? <EmptyState /> : (
          <>
            {data.kind === "periods" && (
              <div className="h-72 rounded-lg border bg-card p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.rows.map((x) => ({ ...x, label: periodLabel(x.period) }))}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v: number) => fmtNum(v)} />
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} formatter={(v: number) => fmtMoney(v)} />
                    <Legend />
                    <Bar dataKey="revenue" name="Виручка" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="cost" name="Собівартість" fill="var(--chart-5)" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="margin" name="Маржа" fill="var(--chart-3)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <Panel className="max-h-[70vh]">
              <table className="w-full min-w-[760px] text-sm">
                {data.kind === "orders" && (<>
                  <thead><tr className="border-b"><th className={th}>№ замовлення</th><th className={th}>Дата</th><th className={th}>Клієнт</th>{moneyHead}</tr></thead>
                  <tbody>{data.rows.map((x) => <tr key={x.orderId} className={tr}><td className={`${td} font-medium`}>#{x.orderId}</td><td className={`${td} tabular-nums`}>{fmtDate(x.date)}</td><td className={td}>{x.buyer}</td><Money x={x} /></tr>)}</tbody>
                  <Totals span={3} />
                </>)}
                {data.kind === "products" && (<>
                  <thead><tr className="border-b"><th className={th}>Артикул</th><th className={th}>Назва</th><th className={thNum}>Продано (шт)</th>{moneyHead}</tr></thead>
                  <tbody>{data.rows.map((x) => <tr key={x.sku} className={tr}><td className={`${td} font-mono text-xs text-muted-foreground`}>{x.sku}</td><td className={td}>{x.name}</td><td className={tdNum}>{fmtNum(x.qty)}</td><Money x={x} /></tr>)}</tbody>
                  <Totals span={3} />
                </>)}
                {data.kind === "periods" && (<>
                  <thead><tr className="border-b"><th className={th}>Період</th>{moneyHead}</tr></thead>
                  <tbody>{data.rows.map((x) => <tr key={x.period} className={tr}><td className={td}>{periodLabel(x.period)}</td><Money x={x} /></tr>)}</tbody>
                  <Totals span={1} />
                </>)}
              </table>
            </Panel>
          </>
        )}
      </div>
    </>
  );
}
