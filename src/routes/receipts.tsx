import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { EmptyState, ErrorState, LoadingRows } from "@/components/DataState";
import { ExportButton, Field, matches, NativeSelect, Panel, SearchBox, td, tdNum, th, thNum, todayIso, Toolbar, tr } from "@/components/ops";
import { ItemsEditor, emptyItem, toItems, type EditItem } from "@/components/ItemsEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { exportCsv, fmtDate, fmtMoney, fmtNum } from "@/lib/format";

export const Route = createFileRoute("/receipts")({
  validateSearch: (s: Record<string, unknown>): { purchase?: string } => (typeof s["purchase"] === "string" ? { purchase: s["purchase"] } : {}),
  head: () => ({
    meta: [
      { title: "Приходи та партії — GERTS адмін" },
      { name: "description", content: "Оприбуткування товарів і партії складу за FIFO." },
      { property: "og:title", content: "Приходи — GERTS адмін" },
      { property: "og:description", content: "Приходи та партії складу." },
    ],
  }),
  component: ReceiptsPage,
});

function ReceiptsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [tab, setTab] = useState("receipts");
  const [form, setForm] = useState<{ purchaseId?: string | undefined } | null>(null);
  useEffect(() => {
    if (search.purchase) { setForm({ purchaseId: search.purchase }); navigate({ to: ".", search: {}, replace: true }); }
  }, [search.purchase, navigate]);

  return (
    <>
      <PageHeader title="Приходи" context="Кожна позиція приходу створює партію; списання — найстаріші партії першими"
        actions={<Button className="h-10" onClick={() => setForm({})}><Plus />Новий прихід</Button>} />
      <div className="p-4 md:p-6">
        <Tabs value={tab} onValueChange={setTab} className="space-y-3">
          <TabsList><TabsTrigger value="receipts">Приходи</TabsTrigger><TabsTrigger value="batches">Партії</TabsTrigger></TabsList>
          <TabsContent value="receipts"><ReceiptsList /></TabsContent>
          <TabsContent value="batches"><BatchesView /></TabsContent>
        </Tabs>
      </div>
      {form && <ReceiptForm purchaseId={form.purchaseId} onClose={() => setForm(null)} />}
    </>
  );
}

function ReceiptsList() {
  const receipts = useQuery({ queryKey: ["receipts"], queryFn: api.getReceipts });
  const contractors = useQuery({ queryKey: ["contractors"], queryFn: api.getContractors });
  const purchases = useQuery({ queryKey: ["purchases"], queryFn: api.getPurchases });
  const [q, setQ] = useState("");
  const cname = (id: string) => contractors.data?.find((c) => c.id === id)?.name ?? "—";
  const pnum = (id?: string) => (id ? purchases.data?.find((p) => p.id === id)?.number : undefined);
  const rows = (receipts.data ?? []).filter((r) => matches(q, r.number, cname(r.contractorId), ...r.items.map((i) => `${i.sku} ${i.name}`)));
  return (
    <div className="space-y-3">
      <Toolbar>
        <SearchBox value={q} onChange={setQ} placeholder="Пошук за №, постачальником, товаром" />
        <ExportButton onClick={() => exportCsv("prykhody.csv", ["№", "Дата", "Постачальник", "Пов'язана закупка", "Позицій", "Сума"], rows.map((r) => [r.number, fmtDate(r.date), cname(r.contractorId), pnum(r.purchaseId) ?? "", r.items.length, r.total]))} />
      </Toolbar>
      <Panel className="max-h-[70vh]">
        {receipts.isLoading ? <LoadingRows /> : receipts.isError ? <ErrorState /> : !rows.length ? <EmptyState /> : (
          <table className="w-full min-w-[680px] text-sm">
            <thead><tr className="border-b"><th className={th}>№</th><th className={th}>Дата</th><th className={th}>Постачальник</th><th className={th}>Пов'язана закупка</th><th className={thNum}>Позицій</th><th className={thNum}>Сума</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id} className={tr}>
                <td className={`${td} font-medium`}>{r.number}</td>
                <td className={`${td} tabular-nums`}>{fmtDate(r.date)}</td>
                <td className={td}>{cname(r.contractorId)}</td>
                <td className={td}>{pnum(r.purchaseId) ? <Link to="/purchases" className="text-primary hover:underline">{pnum(r.purchaseId)}</Link> : <span className="text-muted-foreground">—</span>}</td>
                <td className={tdNum}>{r.items.length}</td>
                <td className={tdNum}>{fmtMoney(r.total)}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}

function BatchesView() {
  const products = useQuery({ queryKey: ["products"], queryFn: api.getProducts });
  const all = useQuery({ queryKey: ["batches"], queryFn: () => api.getBatches() });
  const [sku, setSku] = useState("");
  const skus = useMemo(() => [...new Set((all.data ?? []).map((b) => b.sku))], [all.data]);
  const current = sku || skus[0] || "";
  const rows = (all.data ?? []).filter((b) => b.sku === current);
  const remaining = rows.reduce((s, b) => s + b.qtyRemaining, 0);
  const value = rows.reduce((s, b) => s + b.qtyRemaining * b.unitCost, 0);
  const pname = (s: string) => products.data?.find((p) => p.sku === s)?.name ?? s;

  return (
    <div className="space-y-3">
      <Toolbar>
        <Input list="batch-skus" aria-label="Артикул" className="h-10 max-w-xs" placeholder="Артикул (пошук)" value={sku} onChange={(e) => setSku(e.target.value)} />
        <datalist id="batch-skus">{skus.map((s) => <option key={s} value={s}>{pname(s)}</option>)}</datalist>
        <NativeSelect aria-label="Товар" value={current} onChange={(e) => setSku(e.target.value)}>
          {skus.map((s) => <option key={s} value={s}>{s} — {pname(s)}</option>)}
        </NativeSelect>
        <ExportButton onClick={() => exportCsv(`partii-${current}.csv`, ["Дата", "Джерело", "Початкова к-сть", "Залишок", "Ціна за од.", "Сума залишку"], rows.map((b) => [fmtDate(b.date), b.source, b.qtyInitial, b.qtyRemaining, b.unitCost, b.qtyRemaining * b.unitCost]))} />
      </Toolbar>
      {current && (
        <div className="flex flex-wrap gap-6 rounded-lg border bg-card px-4 py-3 text-sm">
          <div><div className="text-xs text-muted-foreground">Товар</div>{pname(current)}</div>
          <div><div className="text-xs text-muted-foreground">Залишок у партіях</div><span className="font-semibold tabular-nums">{fmtNum(remaining)}</span></div>
          <div><div className="text-xs text-muted-foreground">Середньозважена ціна</div><span className="font-semibold tabular-nums">{fmtMoney(remaining ? value / remaining : 0)}</span></div>
        </div>
      )}
      <Panel className="max-h-[60vh]">
        {all.isLoading ? <LoadingRows /> : all.isError ? <ErrorState /> : !rows.length ? <EmptyState /> : (
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="border-b"><th className={th}>Дата</th><th className={th}>Джерело</th><th className={thNum}>Початкова к-сть</th><th className={thNum}>Залишок</th><th className={thNum}>Ціна за од.</th><th className={thNum}>Сума залишку</th></tr></thead>
            <tbody>{rows.map((b) => (
              <tr key={b.id} className={`${tr} ${b.qtyRemaining === 0 ? "text-muted-foreground opacity-60" : ""}`}>
                <td className={`${td} tabular-nums`}>{fmtDate(b.date)}</td>
                <td className={td}>{b.source}</td>
                <td className={tdNum}>{fmtNum(b.qtyInitial)}</td>
                <td className={`${tdNum} font-medium`}>{fmtNum(b.qtyRemaining)}</td>
                <td className={tdNum}>{fmtMoney(b.unitCost)}</td>
                <td className={tdNum}>{fmtMoney(b.qtyRemaining * b.unitCost)}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}

function ReceiptForm({ purchaseId, onClose }: { purchaseId?: string | undefined; onClose: () => void }) {
  const qc = useQueryClient();
  const contractors = useQuery({ queryKey: ["contractors"], queryFn: api.getContractors });
  const purchases = useQuery({ queryKey: ["purchases"], queryFn: api.getPurchases });
  const [f, setF] = useState({ contractorId: "", purchaseId: purchaseId ?? "", date: todayIso(), comment: "" });
  const [items, setItems] = useState<EditItem[]>([emptyItem()]);

  const prefill = (pid: string) => {
    const p = purchases.data?.find((x) => x.id === pid);
    if (!p) return setF((s) => ({ ...s, purchaseId: pid }));
    const rec = api.receivedFor(p.id);
    const left = p.items.map((i) => ({ sku: i.sku, name: i.name, qty: String(Math.max(0, i.qty - (rec[i.sku] ?? 0))), price: String(i.price) })).filter((i) => Number(i.qty) > 0);
    setF((s) => ({ ...s, purchaseId: pid, contractorId: p.contractorId }));
    setItems(left.length ? left : [emptyItem()]);
  };
  useEffect(() => { if (purchaseId && purchases.data) prefill(purchaseId); }, [purchaseId, purchases.data]);

  const open = (purchases.data ?? []).filter((p) => p.status !== "received" && p.status !== "draft" && (!f.contractorId || p.contractorId === f.contractorId));
  const save = useMutation({
    mutationFn: () => api.createReceipt({ contractorId: f.contractorId, purchaseId: f.purchaseId || undefined, date: f.date, items: toItems(items), comment: f.comment }),
    onSuccess: (r) => { toast.success(`Збережено: ${r.number}`); qc.invalidateQueries(); onClose(); },
    onError: (e: Error) => toast.error(`Помилка: ${e.message}`),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle>Новий прихід</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Постачальник">
            <NativeSelect value={f.contractorId} onChange={(e) => setF({ ...f, contractorId: e.target.value })}>
              <option value="">— оберіть —</option>
              {contractors.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </NativeSelect>
          </Field>
          <Field label="Пов'язана закупка">
            <NativeSelect value={f.purchaseId} onChange={(e) => prefill(e.target.value)}>
              <option value="">— без закупки —</option>
              {open.map((p) => <option key={p.id} value={p.id}>{p.number} · {fmtDate(p.date)}</option>)}
            </NativeSelect>
          </Field>
          <Field label="Дата"><Input type="date" className="h-10" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        </div>
        <div className="text-xs text-muted-foreground">Позиції</div>
        <ItemsEditor rows={items} onChange={setItems} priceLabel="Ціна закупки" />
        <Field label="Коментар"><Textarea value={f.comment} onChange={(e) => setF({ ...f, comment: e.target.value })} /></Field>
        <DialogFooter>
          <Button variant="outline" className="h-10" onClick={onClose}>Скасувати</Button>
          <Button className="h-10" disabled={save.isPending} onClick={() => save.mutate()}>Оформити прихід</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
