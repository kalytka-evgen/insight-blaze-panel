import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AlertTriangle, Check, Download, Pencil, Search, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { EmptyState, ErrorState, LoadingRows } from "@/components/DataState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { exportCsv, fmtNum } from "@/lib/format";
import type { Product } from "@/lib/types";

export const Route = createFileRoute("/min-stock")({
  head: () => ({
    meta: [
      { title: "Мінімальні залишки — GERTS адмін" },
      { name: "description", content: "Налаштування мінімальних залишків товарів і комплектуючих." },
      { property: "og:title", content: "Мінімальні залишки — GERTS адмін" },
      { property: "og:description", content: "Пороги залишків і товари нижче мінімуму." },
    ],
  }),
  component: MinStockPage,
});

export const isBelowMin = (p: Pick<Product, "stock" | "minStock">) => p.stock < p.minStock;

function MinStockPage() {
  const qc = useQueryClient();
  const products = useQuery({ queryKey: ["products"], queryFn: api.getProducts });
  const [q, setQ] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [value, setValue] = useState("");

  const rows = useMemo(
    () => (products.data ?? []).filter((p) => (!q || `${p.sku} ${p.name}`.toLowerCase().includes(q.toLowerCase())) && (!onlyLow || isBelowMin(p))),
    [products.data, q, onlyLow],
  );
  const low = (products.data ?? []).filter(isBelowMin);

  const save = useMutation({
    mutationFn: ({ sku, v }: { sku: string; v: number }) => api.updateMinStock(sku, v),
    onSuccess: (p) => {
      toast.success("Збережено");
      if (isBelowMin(p)) toast.warning(`${p.name}: залишок ${fmtNum(p.stock)} нижче мінімуму ${fmtNum(p.minStock)}`);
      setEditing(null);
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(`Помилка: ${e.message}`),
  });

  const submit = (sku: string) => {
    const v = Number(value.replace(",", "."));
    if (value.trim() === "" || !Number.isFinite(v) || v < 0) return toast.error("Помилка: введіть число ≥ 0");
    save.mutate({ sku, v });
  };

  const th = "th-ops sticky top-0 z-10 bg-card px-3 py-2";

  return (
    <>
      <PageHeader
        title="Мінімальні залишки"
        context="Поріг, нижче якого товар потрапляє у потребу до замовлення"
        actions={
          <Button variant="outline" className="h-10" onClick={() => exportCsv("minimalni-zalyshky.csv", ["Артикул", "Назва", "Категорія", "Поточний залишок", "Мінімальний залишок", "Стан"], rows.map((p) => [p.sku, p.name, p.category, p.stock, p.minStock, isBelowMin(p) ? "нижче мінімуму" : "ок"]))}>
            <Download />Експорт CSV
          </Button>
        }
      />
      <div className="space-y-3 p-4 md:p-6">
        {low.length > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
            <span className="flex-1"><span className="font-semibold text-warning">{low.length}</span> позицій нижче мінімуму: {low.slice(0, 4).map((p) => p.name).join(", ")}{low.length > 4 ? "…" : ""}</span>
            {!onlyLow && <Button variant="outline" size="sm" className="shrink-0" onClick={() => setOnlyLow(true)}>Показати</Button>}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1 md:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-10 pl-8" placeholder="Пошук за назвою або артикулом" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch checked={onlyLow} onCheckedChange={setOnlyLow} />лише нижче мінімуму
          </label>
        </div>

        <div className="max-h-[75vh] overflow-auto rounded-lg border bg-card">
          {products.isLoading ? <LoadingRows rows={8} /> : products.isError ? <ErrorState /> : !rows.length ? <EmptyState /> : (
            <table className="w-full min-w-[760px] text-sm">
              <thead><tr className="border-b">
                <th className={`${th} text-left`}>Артикул</th><th className={`${th} text-left`}>Назва</th><th className={`${th} text-left`}>Категорія</th>
                <th className={`${th} num`}>Поточний залишок</th><th className={`${th} num`}>Мінімальний залишок</th><th className={`${th} text-left`}>Стан</th><th className={th} />
              </tr></thead>
              <tbody>
                {rows.map((p) => {
                  const isEd = editing === p.sku;
                  return (
                    <tr key={p.sku} className="border-b last:border-0 hover:bg-accent">
                      <td className="whitespace-nowrap px-3 py-1.5 font-mono text-xs text-muted-foreground">{p.sku}</td>
                      <td className="px-3 py-1.5">{p.name}</td>
                      <td className="whitespace-nowrap px-3 py-1.5 text-xs text-muted-foreground">{p.category}</td>
                      <td className="num px-3 py-1.5">{fmtNum(p.stock)} <span className="text-muted-foreground">{p.unit}</span></td>
                      <td className="num px-3 py-1.5">
                        {isEd ? (
                          <Input autoFocus inputMode="numeric" aria-label="Мінімальний залишок" className="ml-auto h-9 w-24 text-right tabular-nums" value={value}
                            onChange={(e) => setValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") submit(p.sku); if (e.key === "Escape") setEditing(null); }} />
                        ) : fmtNum(p.minStock)}
                      </td>
                      <td className="px-3 py-1.5">
                        {isBelowMin(p)
                          ? <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning">нижче мінімуму</span>
                          : <span className="rounded-full bg-success/20 px-2 py-0.5 text-[11px] font-medium text-success-foreground">ок</span>}
                      </td>
                      <td className="whitespace-nowrap px-3 py-1.5 text-right">
                        {isEd ? (
                          <span className="inline-flex gap-1">
                            <Button size="icon" className="h-9 w-9" aria-label="Зберегти" disabled={save.isPending} onClick={() => submit(p.sku)}><Check /></Button>
                            <Button size="icon" variant="ghost" className="h-9 w-9" aria-label="Скасувати" onClick={() => setEditing(null)}><X /></Button>
                          </span>
                        ) : (
                          <Button size="icon" variant="ghost" className="h-9 w-9" aria-label="Редагувати" onClick={() => { setEditing(p.sku); setValue(String(p.minStock)); }}><Pencil /></Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
