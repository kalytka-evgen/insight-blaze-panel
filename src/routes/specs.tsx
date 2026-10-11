import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { EmptyState, ErrorState, LoadingRows } from "@/components/DataState";
import { Confirm, ExportButton, Field, matches, NativeSelect, Panel, Pill, SearchBox, td, tdNum, th, thNum, Toolbar, tr } from "@/components/ops";
import { parseNum } from "@/components/ItemsEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { api, validateSpec } from "@/lib/api";
import { exportCsv, fmtMoney, fmtNum } from "@/lib/format";
import type { Product, Specification } from "@/lib/types";

export const Route = createFileRoute("/specs")({
  head: () => ({
    meta: [
      { title: "Специфікації — GERTS адмін" },
      { name: "description", content: "Склад виробів: комплектуючі, кількість і оцінка собівартості." },
      { property: "og:title", content: "Специфікації — GERTS адмін" },
      { property: "og:description", content: "Редактор специфікацій виробів." },
    ],
  }),
  component: SpecsPage,
});

const SELLABLE = ["СТАЛЬНІ МІШЕНІ", "КАРТОННІ МІШЕНІ", "ПАПЕРОВІ МІШЕНІ", "ІНШЕ"];
type Editing = { spec: Specification; isNew: boolean; category: string };

function SpecsPage() {
  const qc = useQueryClient();
  const specs = useQuery({ queryKey: ["specs"], queryFn: api.getSpecifications });
  const products = useQuery({ queryKey: ["products"], queryFn: api.getProducts });
  const [q, setQ] = useState("");
  const [missing, setMissing] = useState(false);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [del, setDel] = useState<Specification | null>(null);

  const remove = useMutation({
    mutationFn: (sku: string) => api.deleteSpecification(sku),
    onSuccess: () => { toast.success("Збережено"); qc.invalidateQueries(); },
    onError: (e: Error) => toast.error(`Помилка: ${e.message}`),
  });

  const sellable = (products.data ?? []).filter((p) => SELLABLE.includes(p.category));
  const rows = sellable
    .map((p) => ({ p, spec: specs.data?.find((s) => s.productSku === p.sku) }))
    .filter(({ p, spec }) => matches(q, p.sku, p.name) && (missing ? !spec : !!spec));
  const loading = specs.isLoading || products.isLoading;

  return (
    <>
      <PageHeader title="Специфікації" context="Склад виробу з комплектуючих; без специфікації виробництво недоступне"
        actions={<>
          <ExportButton onClick={() => exportCsv("spetsyfikatsii.csv", ["Артикул виробу", "Виріб", "Артикул компонента", "Компонент", "Кількість"], (specs.data ?? []).flatMap((s) => s.components.map((c) => [s.productSku, s.productName, c.sku, c.name, c.qty])))} />
          <Button className="h-10" onClick={() => setEditing({ spec: { productSku: "", productName: "", components: [] }, isNew: true, category: "СТАЛЬНІ МІШЕНІ" })}><Plus />Нова специфікація</Button>
        </>} />
      <div className="space-y-3 p-4 md:p-6">
        <Toolbar>
          <SearchBox value={q} onChange={setQ} />
          <label className="flex items-center gap-2 text-sm text-muted-foreground"><Switch checked={missing} onCheckedChange={setMissing} />без специфікації</label>
        </Toolbar>
        <Panel>
          {loading ? <LoadingRows /> : specs.isError || products.isError ? <ErrorState /> : !rows.length ? <EmptyState /> : (
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr className="border-b"><th className={th}>Артикул</th><th className={th}>Виріб</th><th className={thNum}>Компонентів</th><th className={thNum}>Оцінка собівартості</th><th className={th} /></tr></thead>
              <tbody>{rows.map(({ p, spec }) => (
                <tr key={p.sku} className={tr}>
                  <td className={`${td} font-mono text-xs text-muted-foreground`}>{p.sku}</td>
                  <td className={td}>{p.name}</td>
                  <td className={tdNum}>{spec ? fmtNum(spec.components.length) : <Pill tone="warning">немає</Pill>}</td>
                  <td className={tdNum}>{spec ? fmtMoney(api.specUnitCost(spec)) : "—"}</td>
                  <td className={`${td} whitespace-nowrap text-right`}>
                    <Button size="sm" variant="outline" className="h-9" onClick={() => setEditing({ spec: spec ? structuredClone(spec) : { productSku: p.sku, productName: p.name, components: [] }, isNew: false, category: p.category })}>
                      {spec ? <><Pencil />Редагувати</> : <><Plus />Додати</>}
                    </Button>
                    {spec && <Button size="icon" variant="ghost" className="ml-1 h-9 w-9" aria-label="Видалити специфікацію" onClick={() => setDel(spec)}><Trash2 /></Button>}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </Panel>
      </div>
      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          {editing && <SpecEditor initial={editing} products={products.data ?? []} onDone={() => setEditing(null)} />}
        </SheetContent>
      </Sheet>
      <Confirm open={!!del} onOpenChange={(o) => !o && setDel(null)} destructive confirmLabel="Видалити" onConfirm={() => del && remove.mutate(del.productSku)}
        description={`Видалити специфікацію «${del?.productName}»? Виробництво цього виробу буде недоступне.`} />
    </>
  );
}

type Row = { sku: string; name: string; qty: string };

function SpecEditor({ initial, products, onDone }: { initial: Editing; products: Product[]; onDone: () => void }) {
  const qc = useQueryClient();
  const [head, setHead] = useState({ sku: initial.spec.productSku, name: initial.spec.productName, category: initial.category });
  const [rows, setRows] = useState<Row[]>(initial.spec.components.map((c) => ({ sku: c.sku, name: c.name, qty: String(c.qty) })));
  const [confirm, setConfirm] = useState(false);
  const existing = products.find((p) => p.sku === head.sku.trim());
  const locked = !initial.isNew;
  const cost = (sku: string) => products.find((p) => p.sku === sku)?.cost ?? 0;
  const spec: Specification = { productSku: head.sku.trim(), productName: (existing?.name ?? head.name).trim(), components: rows.map((r) => ({ sku: r.sku.trim(), name: r.name.trim(), qty: parseNum(r.qty) })) };
  const total = api.specUnitCost(spec);
  const set = (i: number, patch: Partial<Row>) => setRows(rows.map((r, k) => (k === i ? { ...r, ...patch } : r)));

  const save = useMutation({
    mutationFn: () => api.saveSpecification(spec, existing ? undefined : { category: head.category }),
    onSuccess: () => { toast.success("Збережено"); qc.invalidateQueries(); onDone(); },
    onError: (e: Error) => toast.error(`Помилка: ${e.message}`),
  });
  const trySave = () => { const err = validateSpec(spec); if (err) toast.error(`Помилка: ${err}`); else setConfirm(true); };

  return (
    <>
      <SheetHeader><SheetTitle>{initial.isNew ? "Нова специфікація" : `Специфікація: ${initial.spec.productName}`}</SheetTitle></SheetHeader>
      <div className="mt-4 space-y-4 text-sm">
        <datalist id="spec-skus">{products.map((p) => <option key={p.sku} value={p.sku}>{p.name}</option>)}</datalist>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Артикул виробу"><Input list="spec-skus" className="h-10 font-mono" readOnly={locked} value={head.sku} onChange={(e) => setHead({ ...head, sku: e.target.value })} /></Field>
          <Field label="Назва виробу"><Input className="h-10" readOnly={locked || !!existing} value={existing?.name ?? head.name} onChange={(e) => setHead({ ...head, name: e.target.value })} /></Field>
          {initial.isNew && !existing && head.sku.trim() && (
            <Field label="Категорія нового виробу">
              <NativeSelect value={head.category} onChange={(e) => setHead({ ...head, category: e.target.value })}>{SELLABLE.map((c) => <option key={c}>{c}</option>)}</NativeSelect>
            </Field>
          )}
        </div>
        <div className="text-xs text-muted-foreground">Компоненти</div>
        {!rows.length && <EmptyState text="Немає компонентів" />}
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_70px_100px_40px] gap-2 rounded-md border p-2 sm:grid-cols-[130px_1fr_70px_100px_40px] sm:border-0 sm:p-0">
            <Input list="spec-skus" aria-label="Артикул" placeholder="Артикул" className="h-10 font-mono text-xs" value={r.sku}
              onChange={(e) => { const p = products.find((x) => x.sku === e.target.value.trim()); set(i, { sku: e.target.value, ...(p ? { name: p.name } : {}) }); }} />
            <Input aria-label="Назва" placeholder="Назва" className="col-span-4 h-10 sm:col-span-1" value={r.name} onChange={(e) => set(i, { name: e.target.value })} />
            <Input aria-label="Кількість" inputMode="numeric" className="h-10 text-right tabular-nums" value={r.qty} onChange={(e) => set(i, { qty: e.target.value })} />
            <div className="flex h-10 items-center justify-end tabular-nums text-muted-foreground">{fmtMoney(parseNum(r.qty) * cost(r.sku.trim()) || 0)}</div>
            <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Видалити компонент" onClick={() => setRows(rows.filter((_, k) => k !== i))}><Trash2 /></Button>
          </div>
        ))}
        <div className="flex items-center justify-between">
          <Button variant="outline" className="h-10" onClick={() => setRows([...rows, { sku: "", name: "", qty: "1" }])}><Plus />Додати компонент</Button>
          <span>Оцінка собівартості: <span className="font-semibold tabular-nums text-primary">{fmtMoney(total)}</span></span>
        </div>
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" className="h-10" onClick={onDone}>Скасувати</Button>
          <Button className="h-10" disabled={save.isPending} onClick={trySave}>Зберегти</Button>
        </div>
      </div>
      <Confirm open={confirm} onOpenChange={setConfirm} confirmLabel="Зберегти" onConfirm={() => save.mutate()} description="Зберегти специфікацію?" />
    </>
  );
}
