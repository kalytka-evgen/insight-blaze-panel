import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download, Factory, Package, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { EmptyState, ErrorState, LoadingRows } from "@/components/DataState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import { exportCsv, fmtNum } from "@/lib/format";
import type { DemandRow } from "@/lib/types";

export const Route = createFileRoute("/demand")({
  head: () => ({
    meta: [
      { title: "Потреба — GERTS адмін" },
      { name: "description", content: "Потреба в закупках і виробництві за замовленнями та мінімальними залишками." },
      { property: "og:title", content: "Потреба — GERTS адмін" },
      { property: "og:description", content: "Розрахунок дефіциту товарів і комплектуючих." },
    ],
  }),
  component: DemandPage,
});

const CSV_HEADERS = ["Артикул", "Найменування", "Потрібно", "На складі", "Замовлено", "До замовлення", "Джерело", "Тендер"];
const toCsv = (r: DemandRow) => [r.sku, r.name, r.need, r.stock, r.ordered, r.deficit, r.sources.map((s) => s.orderId).join(", "), r.tender ? "так" : ""];

function Sources({ r }: { r: DemandRow }) {
  if (!r.sources.length) return <span className="text-muted-foreground">мін. залишок</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {r.sources.map((s) => (
        <a key={s.orderId} href="#" title={`Замовлення ${s.orderId}`} className="text-primary hover:underline">#{s.orderId}</a>
      ))}
    </span>
  );
}

const TenderBadge = () => <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[11px] text-primary">Тендер</span>;
const Deficit = ({ v }: { v: number }) => <span className={v > 0 ? "font-semibold text-warning" : "text-muted-foreground"}>{fmtNum(Math.max(v, 0))}</span>;

function DemandPage() {
  const qc = useQueryClient();
  const demand = useQuery({ queryKey: ["demand"], queryFn: api.getDemand });
  const [q, setQ] = useState("");
  const [onlyDeficit, setOnlyDeficit] = useState(false);
  const [tab, setTab] = useState("cat");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState(false);

  const match = (r: DemandRow) => (!q || `${r.sku} ${r.name}`.toLowerCase().includes(q.toLowerCase())) && (!onlyDeficit || r.deficit > 0);

  const groups = useMemo(() => (demand.data ?? []).map((g) => ({ ...g, rows: g.rows.filter(match) })), [demand.data, q, onlyDeficit]);

  const components = useMemo(() => {
    const map = new Map<string, DemandRow>();
    for (const r of (demand.data ?? []).flatMap((g) => g.rows).filter((r) => r.parentSku)) {
      const e = map.get(r.sku);
      if (!e) map.set(r.sku, { ...r, sources: [...r.sources] });
      else {
        e.need += r.need;
        e.tender ||= r.tender;
        for (const s of r.sources) if (!e.sources.some((x) => x.orderId === s.orderId)) e.sources.push(s);
      }
    }
    return [...map.values()].map((r) => ({ ...r, deficit: r.need - r.stock - r.ordered })).filter(match);
  }, [demand.data, q, onlyDeficit]);

  const productRows = (demand.data ?? []).flatMap((g) => g.rows).filter((r) => r.isProduct);
  const selectedRows = productRows.filter((r) => selected.has(r.sku));

  const create = useMutation({
    mutationFn: () => api.createProductionTasksFromDemand(selectedRows.map((r) => ({ sku: r.sku, qty: r.deficit }))),
    onSuccess: (n) => {
      toast.success(`Збережено: створено задач — ${n}`);
      setSelected(new Set());
      qc.invalidateQueries();
    },
    onError: () => toast.error("Помилка створення задач"),
  });

  const toggle = (sku: string) => setSelected((s) => { const n = new Set(s); n.has(sku) ? n.delete(sku) : n.add(sku); return n; });

  const onExport = () =>
    tab === "cat"
      ? exportCsv("potreba-kategorii.csv", ["Група", ...CSV_HEADERS], groups.flatMap((g) => g.rows.map((r) => [g.title, ...toCsv(r)])))
      : exportCsv("potreba-komplektuiuchi.csv", CSV_HEADERS, components.map(toCsv));

  const th = "th-ops sticky top-0 z-10 bg-card px-3 py-2";

  return (
    <>
      <PageHeader
        title="Потреба"
        context="До замовлення = max(Потрібно за замовленнями, Мінімальний залишок) − На складі − Замовлено"
        actions={
          <>
            <Button variant="outline" className="h-10" onClick={onExport}><Download />Експорт CSV</Button>
            <Button className="h-10" disabled={!selectedRows.length} onClick={() => setConfirm(true)}>
              <Factory />Створити задачі виробництва{selectedRows.length ? ` (${selectedRows.length})` : ""}
            </Button>
          </>
        }
      />
      <div className="space-y-3 p-4 md:p-6">
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex flex-wrap items-center gap-3">
            <TabsList>
              <TabsTrigger value="cat">За категоріями</TabsTrigger>
              <TabsTrigger value="comp">Комплектуючі</TabsTrigger>
            </TabsList>
            <div className="relative min-w-[220px] flex-1 md:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="h-10 pl-8" placeholder="Пошук за назвою або артикулом" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch checked={onlyDeficit} onCheckedChange={setOnlyDeficit} />лише дефіцит
            </label>
          </div>

          {demand.isLoading ? <LoadingRows rows={8} /> : demand.isError ? <ErrorState /> : (
            <>
              <TabsContent value="cat" className="space-y-4">
                {groups.every((g) => !g.rows.length) && <EmptyState />}
                {groups.filter((g) => g.rows.length).map((g) => {
                  const total = g.rows.filter((r) => r.isProduct).reduce((s, r) => s + Math.max(r.deficit, 0), 0);
                  return (
                    <section key={g.title} className="overflow-hidden rounded-lg border bg-card">
                      <div className="flex items-center justify-between border-b px-3 py-2.5">
                        <h2 className="text-xs font-semibold tracking-wider">{g.title}</h2>
                        <span className="text-xs text-muted-foreground">Дефіцит: <span className="font-semibold tabular-nums text-warning">{fmtNum(total)}</span></span>
                      </div>
                      <div className="max-h-[70vh] overflow-auto">
                        <table className="w-full min-w-[820px] text-sm">
                          <thead><tr className="border-b">
                            <th className={`${th} w-10`} /><th className={`${th} text-left`}>Артикул</th><th className={`${th} text-left`}>Найменування</th>
                            <th className={`${th} num`}>Потрібно</th><th className={`${th} num`}>На складі</th><th className={`${th} num`}>Замовлено</th>
                            <th className={`${th} num`}>До замовлення</th><th className={`${th} text-left`}>Джерело</th><th className={`${th} text-left`}>Тендер</th>
                          </tr></thead>
                          <tbody>
                            {g.rows.map((r) => {
                              const canProduce = r.isProduct && r.deficit > 0 && api.hasSpecification(r.sku);
                              return (
                                <tr key={r.sku + (r.parentSku ?? "")} className={`border-b last:border-0 hover:bg-accent ${r.isProduct ? "" : "text-muted-foreground"}`}>
                                  <td className="px-3 py-1.5">
                                    {canProduce && <Checkbox aria-label={`Обрати ${r.name}`} checked={selected.has(r.sku)} onCheckedChange={() => toggle(r.sku)} />}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-1.5 font-mono text-xs">
                                    {r.isProduct ? <span className="inline-flex items-center gap-1.5 text-foreground"><Package className="h-3.5 w-3.5 text-primary" />{r.sku}</span> : <span className="pl-5">↳ {r.sku}</span>}
                                  </td>
                                  <td className={`px-3 py-1.5 ${r.isProduct ? "font-medium" : "pl-8"}`}>{r.name}</td>
                                  <td className="num px-3 py-1.5">{fmtNum(r.need)}</td>
                                  <td className="num px-3 py-1.5">{fmtNum(r.stock)}</td>
                                  <td className="num px-3 py-1.5">{fmtNum(r.ordered)}</td>
                                  <td className="num px-3 py-1.5"><Deficit v={r.deficit} /></td>
                                  <td className="px-3 py-1.5">{r.isProduct && <Sources r={r} />}</td>
                                  <td className="px-3 py-1.5">{r.isProduct && r.tender && <TenderBadge />}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  );
                })}
              </TabsContent>

              <TabsContent value="comp">
                <div className="max-h-[75vh] overflow-auto rounded-lg border bg-card">
                  {!components.length ? <EmptyState /> : (
                    <table className="w-full min-w-[820px] text-sm">
                      <thead><tr className="border-b">
                        <th className={`${th} text-left`}>Артикул</th><th className={`${th} text-left`}>Назва</th><th className={`${th} num`}>Потрібно</th>
                        <th className={`${th} num`}>На складі</th><th className={`${th} num`}>Замовлено</th><th className={`${th} num`}>До замовлення</th>
                        <th className={`${th} text-left`}>Джерело</th><th className={`${th} text-left`}>Тендер</th>
                      </tr></thead>
                      <tbody>
                        {components.map((r) => (
                          <tr key={r.sku} className="border-b last:border-0 hover:bg-accent">
                            <td className="whitespace-nowrap px-3 py-1.5 font-mono text-xs text-muted-foreground">{r.sku}</td>
                            <td className="px-3 py-1.5">{r.name}</td>
                            <td className="num px-3 py-1.5">{fmtNum(r.need)}</td>
                            <td className="num px-3 py-1.5">{fmtNum(r.stock)}</td>
                            <td className="num px-3 py-1.5">{fmtNum(r.ordered)}</td>
                            <td className={`num px-3 py-1.5 ${r.deficit > 0 ? "bg-warning/10" : ""}`}><Deficit v={r.deficit} /></td>
                            <td className="px-3 py-1.5"><Sources r={r} /></td>
                            <td className="px-3 py-1.5">{r.tender && <TenderBadge />}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ви впевнені?</AlertDialogTitle>
            <AlertDialogDescription>Створити {selectedRows.length} задач на виробництво?</AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="space-y-1 text-sm">
            {selectedRows.map((r) => <li key={r.sku} className="flex justify-between"><span>{r.name}</span><span className="tabular-nums text-warning">×{fmtNum(r.deficit)}</span></li>)}
          </ul>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={() => create.mutate()}>Створити</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
