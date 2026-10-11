import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { PackagePlus, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { EmptyState, ErrorState, LoadingRows } from "@/components/DataState";
import { ExportButton, Field, matches, NativeSelect, Panel, Pill, SearchBox, td, tdNum, th, thNum, todayIso, Toolbar, tr, type Tone } from "@/components/ops";
import { ItemsEditor, emptyItem, toItems, type EditItem } from "@/components/ItemsEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { api, PURCHASE_STATUS } from "@/lib/api";
import { exportCsv, fmtDate, fmtMoney, fmtNum } from "@/lib/format";
import type { Purchase, PurchaseStatus } from "@/lib/types";

export const Route = createFileRoute("/purchases")({
  validateSearch: (s: Record<string, unknown>): { new?: string } => (typeof s.new === "string" ? { new: s.new } : {}),
  head: () => ({
    meta: [
      { title: "Закупки — GERTS адмін" },
      { name: "description", content: "Закупки у постачальників: статуси, оплати, отримання." },
      { property: "og:title", content: "Закупки — GERTS адмін" },
      { property: "og:description", content: "Облік закупок у постачальників." },
    ],
  }),
  component: PurchasesPage,
});

const statusTone: Record<PurchaseStatus, Tone> = { draft: "muted", ordered: "warning", paid: "primary", received: "success" };
const FLOW: PurchaseStatus[] = ["ordered", "paid", "received"];

function receivedStats(p: Purchase) {
  const rec = api.receivedFor(p.id);
  const got = p.items.reduce((s, i) => s + Math.min(rec[i.sku] ?? 0, i.qty), 0);
  const all = p.items.reduce((s, i) => s + i.qty, 0);
  return { got, all, rec };
}

function PurchasesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const purchases = useQuery({ queryKey: ["purchases"], queryFn: api.getPurchases });
  const contractors = useQuery({ queryKey: ["contractors"], queryFn: api.getContractors });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [cid, setCid] = useState("");
  const [formFor, setFormFor] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (search.new !== undefined) { setFormFor(search.new); navigate({ to: ".", search: {}, replace: true }); }
  }, [search.new, navigate]);

  const name = (id: string) => contractors.data?.find((c) => c.id === id)?.name ?? "—";
  const rows = (purchases.data ?? []).filter((p) => matches(q, p.number, name(p.contractorId), ...p.items.map((i) => `${i.sku} ${i.name}`)) && (!status || p.status === status) && (!cid || p.contractorId === cid));
  const current = purchases.data?.find((p) => p.id === openId);

  return (
    <>
      <PageHeader title="Закупки" context="Замовлено → Оплачено → Отримано"
        actions={<>
          <ExportButton onClick={() => exportCsv("zakupky.csv", ["№", "Дата", "Постачальник", "Позицій", "Сума", "Статус", "Очікувана дата", "Отримано"], rows.map((p) => { const s = receivedStats(p); return [p.number, fmtDate(p.date), name(p.contractorId), p.items.length, p.total, PURCHASE_STATUS[p.status], fmtDate(p.expectedDate), `${s.got} / ${s.all}`]; }))} />
          <Button className="h-10" onClick={() => setFormFor("")}><Plus />Нова закупка</Button>
        </>} />
      <div className="space-y-3 p-4 md:p-6">
        <Toolbar>
          <SearchBox value={q} onChange={setQ} placeholder="Пошук за №, постачальником, товаром" />
          <NativeSelect aria-label="Статус" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Усі статуси</option>
            {Object.entries(PURCHASE_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </NativeSelect>
          <NativeSelect aria-label="Постачальник" value={cid} onChange={(e) => setCid(e.target.value)}>
            <option value="">Усі постачальники</option>
            {contractors.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </NativeSelect>
        </Toolbar>
        <Panel className="max-h-[75vh]">
          {purchases.isLoading ? <LoadingRows rows={6} /> : purchases.isError ? <ErrorState /> : !rows.length ? <EmptyState /> : (
            <table className="w-full min-w-[860px] text-sm">
              <thead><tr className="border-b">
                <th className={th}>№</th><th className={th}>Дата</th><th className={th}>Постачальник</th><th className={thNum}>Позицій</th><th className={thNum}>Сума</th>
                <th className={th}>Статус</th><th className={th}>Отримано</th><th className={th}>Очікувана дата</th><th className={th} />
              </tr></thead>
              <tbody>
                {rows.map((p) => {
                  const s = receivedStats(p);
                  return (
                    <tr key={p.id} className={`${tr} cursor-pointer`} onClick={() => setOpenId(p.id)}>
                      <td className={`${td} font-medium`}>{p.number}</td>
                      <td className={`${td} tabular-nums`}>{fmtDate(p.date)}</td>
                      <td className={td}>{name(p.contractorId)}</td>
                      <td className={tdNum}>{p.items.length}</td>
                      <td className={tdNum}>{fmtMoney(p.total)}</td>
                      <td className={td}><Pill tone={statusTone[p.status]}>{PURCHASE_STATUS[p.status]}</Pill></td>
                      <td className={td}><Pill tone={s.got === s.all ? "success" : s.got > 0 || p.status === "received" ? "warning" : "muted"}>{fmtNum(s.got)} / {fmtNum(s.all)}</Pill></td>
                      <td className={`${td} tabular-nums text-muted-foreground`}>{fmtDate(p.expectedDate)}</td>
                      <td className={`${td} text-right`}>
                        {s.got < s.all && p.status !== "draft" && (
                          <Button size="sm" variant="outline" className="h-9" onClick={(e) => { e.stopPropagation(); navigate({ to: "/receipts", search: { purchase: p.id } }); }}><PackagePlus />Оформити прихід</Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
      {formFor !== null && <PurchaseForm contractorId={formFor} onClose={() => setFormFor(null)} />}
      <Sheet open={!!current} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">{current && <PurchaseDetail p={current} supplier={name(current.contractorId)} />}</SheetContent>
      </Sheet>
    </>
  );
}

function PurchaseDetail({ p, supplier }: { p: Purchase; supplier: string }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const payments = useQuery({ queryKey: ["payments", p.contractorId], queryFn: () => api.getPayments(p.contractorId) });
  const s = receivedStats(p);
  const set = useMutation({
    mutationFn: (st: PurchaseStatus) => api.updatePurchaseStatus(p.id, st),
    onSuccess: () => { toast.success("Збережено"); qc.invalidateQueries(); },
    onError: (e: Error) => toast.error(`Помилка: ${e.message}`),
  });
  return (
    <>
      <SheetHeader><SheetTitle>Закупка {p.number}</SheetTitle></SheetHeader>
      <div className="mt-4 space-y-5 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div><div className="text-xs text-muted-foreground">Постачальник</div>{supplier}</div>
          <div><div className="text-xs text-muted-foreground">Дата / очікується</div>{fmtDate(p.date)} / {fmtDate(p.expectedDate)}</div>
          {p.comment && <div className="col-span-2"><div className="text-xs text-muted-foreground">Коментар</div>{p.comment}</div>}
        </div>
        <div>
          <div className="mb-2 text-xs text-muted-foreground">Статус</div>
          <div className="flex flex-wrap gap-2">
            {FLOW.map((st) => (
              <Button key={st} size="sm" className="h-10" variant={p.status === st ? "default" : "outline"} disabled={set.isPending || p.status === st} onClick={() => set.mutate(st)}>{PURCHASE_STATUS[st]}</Button>
            ))}
          </div>
        </div>
        <table className="w-full">
          <thead><tr className="border-b"><th className="th-ops py-1.5 text-left">Позиція</th><th className="th-ops num py-1.5">К-сть</th><th className="th-ops num py-1.5">Отримано</th><th className="th-ops num py-1.5">Сума</th></tr></thead>
          <tbody>{p.items.map((i) => {
            const got = s.rec[i.sku] ?? 0;
            return (
              <tr key={i.sku} className="border-b">
                <td className="py-1.5"><div>{i.name}</div><div className="font-mono text-xs text-muted-foreground">{i.sku} · {fmtMoney(i.price)}</div></td>
                <td className="num py-1.5">{fmtNum(i.qty)}</td>
                <td className={`num py-1.5 ${got < i.qty ? "text-warning" : "text-success-foreground"}`}>{fmtNum(got)}</td>
                <td className="num py-1.5">{fmtMoney(i.qty * i.price)}</td>
              </tr>
            );
          })}</tbody>
          <tfoot><tr><td colSpan={3} className="py-2 font-medium">Разом</td><td className="num py-2 font-semibold">{fmtMoney(p.total)}</td></tr></tfoot>
        </table>
        {s.got < s.all && <Button className="h-10 w-full" onClick={() => navigate({ to: "/receipts", search: { purchase: p.id } })}><PackagePlus />Оформити прихід</Button>}
        <div>
          <div className="mb-2 text-xs text-muted-foreground">Оплати постачальнику</div>
          {!payments.data?.length ? <EmptyState /> : payments.data.map((pay) => (
            <div key={pay.id} className="flex justify-between border-b py-1.5"><span>{fmtDate(pay.date)} · <span className="text-muted-foreground">{pay.comment || "—"}</span></span><span className="tabular-nums">{fmtMoney(pay.amount)}</span></div>
          ))}
        </div>
      </div>
    </>
  );
}

function PurchaseForm({ contractorId, onClose }: { contractorId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const contractors = useQuery({ queryKey: ["contractors"], queryFn: api.getContractors });
  const [f, setF] = useState({ contractorId, newName: "", number: "", date: todayIso(), expectedDate: "", comment: "" });
  const [items, setItems] = useState<EditItem[]>([emptyItem()]);
  const save = useMutation({
    mutationFn: async () => {
      let cid = f.contractorId;
      if (cid === "__new") cid = (await api.createContractor(f.newName)).id;
      if (!f.number.trim()) throw new Error("Вкажіть номер рахунку");
      return api.createPurchase({ contractorId: cid, number: f.number.trim(), date: f.date, expectedDate: f.expectedDate || f.date, comment: f.comment, items: toItems(items) });
    },
    onSuccess: () => { toast.success("Збережено"); qc.invalidateQueries(); onClose(); },
    onError: (e: Error) => toast.error(`Помилка: ${e.message}`),
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle>Нова закупка</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Постачальник">
            <NativeSelect value={f.contractorId} onChange={(e) => setF({ ...f, contractorId: e.target.value })}>
              <option value="">— оберіть —</option>
              {contractors.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value="__new">+ Новий постачальник…</option>
            </NativeSelect>
          </Field>
          {f.contractorId === "__new"
            ? <Field label="Назва нового постачальника"><Input className="h-10" value={f.newName} onChange={(e) => setF({ ...f, newName: e.target.value })} /></Field>
            : <Field label="Номер рахунку"><Input className="h-10" value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} /></Field>}
          {f.contractorId === "__new" && <Field label="Номер рахунку"><Input className="h-10" value={f.number} onChange={(e) => setF({ ...f, number: e.target.value })} /></Field>}
          <Field label="Дата"><Input type="date" className="h-10" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label="Очікувана дата"><Input type="date" className="h-10" value={f.expectedDate} onChange={(e) => setF({ ...f, expectedDate: e.target.value })} /></Field>
        </div>
        <div className="text-xs text-muted-foreground">Позиції</div>
        <ItemsEditor rows={items} onChange={setItems} />
        <Field label="Коментар"><Textarea value={f.comment} onChange={(e) => setF({ ...f, comment: e.target.value })} /></Field>
        <DialogFooter>
          <Button variant="outline" className="h-10" onClick={onClose}>Скасувати</Button>
          <Button className="h-10" disabled={save.isPending} onClick={() => save.mutate()}>Зберегти</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
