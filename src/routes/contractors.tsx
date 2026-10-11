import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { EmptyState, ErrorState, LoadingRows } from "@/components/DataState";
import { ExportButton, Field, matches, Panel, Pill, SearchBox, td, tdNum, th, thNum, todayIso, tr } from "@/components/ops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, PURCHASE_STATUS } from "@/lib/api";
import { exportCsv, fmtDate, fmtMoney } from "@/lib/format";
import { parseNum } from "@/components/ItemsEditor";
import type { Contractor } from "@/lib/types";

export const Route = createFileRoute("/contractors")({
  head: () => ({
    meta: [
      { title: "Контрагенти та взаєморозрахунки — GERTS адмін" },
      { name: "description", content: "Постачальники, борги, закупки та оплати." },
      { property: "og:title", content: "Контрагенти — GERTS адмін" },
      { property: "og:description", content: "Взаєморозрахунки з постачальниками." },
    ],
  }),
  component: ContractorsPage,
});

export const BalanceBadge = ({ v }: { v: number }) =>
  v > 0 ? <Pill tone="danger">борг {fmtMoney(v)}</Pill> : v < 0 ? <Pill tone="success">переплата {fmtMoney(-v)}</Pill> : <Pill>0,00 грн</Pill>;

function ContractorsPage() {
  const contractors = useQuery({ queryKey: ["contractors"], queryFn: api.getContractors });
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const rows = (contractors.data ?? []).filter((c) => matches(q, c.name, c.phone));
  const current = contractors.data?.find((c) => c.id === (sel ?? contractors.data?.[0]?.id));

  return (
    <>
      <PageHeader title="Контрагенти" context="Борг: додатне — ми винні постачальнику, від'ємне — переплата"
        actions={<ExportButton onClick={() => exportCsv("kontrahenty.csv", ["Назва", "Телефон", "Баланс"], rows.map((c) => [c.name, c.phone, c.balance]))} />} />
      <div className="grid gap-4 p-4 md:p-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          <SearchBox value={q} onChange={setQ} placeholder="Пошук контрагента" />
          <Panel>
            {contractors.isLoading ? <LoadingRows /> : contractors.isError ? <ErrorState /> : !rows.length ? <EmptyState /> : (
              <ul>
                {rows.map((c) => (
                  <li key={c.id}>
                    <button onClick={() => setSel(c.id)} className={`flex w-full items-center justify-between gap-2 border-b px-3 py-3 text-left last:border-0 hover:bg-accent ${current?.id === c.id ? "bg-accent" : ""}`}>
                      <span><span className="block font-medium">{c.name}</span><span className="text-xs text-muted-foreground">{c.phone}</span></span>
                      <BalanceBadge v={c.balance} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
        {current ? <ContractorDetail c={current} /> : !contractors.isLoading && <EmptyState text="Оберіть контрагента" />}
      </div>
    </>
  );
}

function ContractorDetail({ c }: { c: Contractor }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const purchases = useQuery({ queryKey: ["purchases"], queryFn: api.getPurchases });
  const payments = useQuery({ queryKey: ["payments", c.id], queryFn: () => api.getPayments(c.id) });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ amount: "", date: todayIso(), comment: "" });
  const add = useMutation({
    mutationFn: () => api.addPayment({ contractorId: c.id, amount: parseNum(form.amount), date: form.date, comment: form.comment }),
    onSuccess: () => { toast.success("Збережено"); setOpen(false); setForm({ amount: "", date: todayIso(), comment: "" }); qc.invalidateQueries(); },
    onError: (e: Error) => toast.error(`Помилка: ${e.message}`),
  });
  const own = (purchases.data ?? []).filter((p) => p.contractorId === c.id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg border bg-card p-4">
        <div>
          <div className="text-sm text-muted-foreground">{c.name} · {c.phone}</div>
          <div className={`mt-1 text-3xl font-semibold tabular-nums ${c.balance > 0 ? "text-destructive" : c.balance < 0 ? "text-success-foreground" : ""}`}>{fmtMoney(c.balance)}</div>
          <div className="text-xs text-muted-foreground">{c.balance > 0 ? "ми винні" : c.balance < 0 ? "переплата" : "розрахунки закриті"}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-10" onClick={() => navigate({ to: "/purchases", search: { new: c.id } })}><Plus />Додати закупку</Button>
          <Button className="h-10" onClick={() => setOpen(true)}><Wallet />Додати оплату</Button>
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-medium">Закупки</h2>
        <Panel>
          {purchases.isLoading ? <LoadingRows rows={3} /> : purchases.isError ? <ErrorState /> : !own.length ? <EmptyState /> : (
            <table className="w-full min-w-[480px] text-sm">
              <thead><tr className="border-b"><th className={th}>Дата</th><th className={th}>№</th><th className={thNum}>Сума</th><th className={th}>Статус</th></tr></thead>
              <tbody>{own.map((p) => (
                <tr key={p.id} className={tr}><td className={`${td} tabular-nums`}>{fmtDate(p.date)}</td><td className={td}>{p.number}</td><td className={tdNum}>{fmtMoney(p.total)}</td><td className={td}><Pill tone={p.status === "received" ? "success" : p.status === "paid" ? "primary" : "muted"}>{PURCHASE_STATUS[p.status]}</Pill></td></tr>
              ))}</tbody>
            </table>
          )}
        </Panel>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium">Оплати</h2>
        <Panel>
          {payments.isLoading ? <LoadingRows rows={3} /> : payments.isError ? <ErrorState /> : !payments.data?.length ? <EmptyState /> : (
            <table className="w-full min-w-[480px] text-sm">
              <thead><tr className="border-b"><th className={th}>Дата</th><th className={thNum}>Сума</th><th className={th}>Коментар</th></tr></thead>
              <tbody>{payments.data.map((p) => (
                <tr key={p.id} className={tr}><td className={`${td} tabular-nums`}>{fmtDate(p.date)}</td><td className={tdNum}>{fmtMoney(p.amount)}</td><td className={`${td} text-muted-foreground`}>{p.comment || "—"}</td></tr>
              ))}</tbody>
            </table>
          )}
        </Panel>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Додати оплату — {c.name}</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Сума, грн"><Input autoFocus inputMode="decimal" className="h-10" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
            <Field label="Дата"><Input type="date" className="h-10" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
            <Field label="Коментар" className="sm:col-span-2"><Input className="h-10" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" className="h-10" onClick={() => setOpen(false)}>Скасувати</Button>
            <Button className="h-10" disabled={add.isPending} onClick={() => add.mutate()}>Зберегти</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
