import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, Hammer, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { EmptyState, ErrorState, LoadingRows } from "@/components/DataState";
import { Confirm, ExportButton, Field, matches, NativeSelect, Pill, SearchBox, Toolbar } from "@/components/ops";
import { parseNum } from "@/components/ItemsEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { api, TASK_ORDER, TASK_STATUS } from "@/lib/api";
import { exportCsv, fmtDate, fmtMoney, fmtNum } from "@/lib/format";
import type { ProductionTask, TaskStatus } from "@/lib/types";

export const Route = createFileRoute("/production")({
  head: () => ({
    meta: [
      { title: "Виробництво — GERTS адмін" },
      { name: "description", content: "Задачі виробництва: зварювання, шліфовка, фарбування, збірка." },
      { property: "og:title", content: "Виробництво — GERTS адмін" },
      { property: "og:description", content: "Канбан задач виробництва зі списанням за FIFO." },
    ],
  }),
  component: ProductionPage,
});

const enough = (t: ProductionTask) => t.materials.every((m) => m.have >= m.need);

function ProductionPage() {
  const qc = useQueryClient();
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: api.getProductionTasks });
  const inProd = useQuery({ queryKey: ["in-production"], queryFn: api.getInProduction });
  const [q, setQ] = useState("");
  const [bomOnly, setBomOnly] = useState(true);
  const shownOrders = (inProd.data ?? []).filter((o) => !bomOnly || o.hasBom);
  const genTasks = useMutation({
    mutationFn: (orderId: string) => api.createTasksFromOrder(orderId),
    onSuccess: (r) => {
      toast.success(r.skipped
        ? `Створено ${r.created} задач, пропущено ${r.skipped} (вже є)`
        : `Створено ${r.created} задач: ${r.tasks.map((t) => `${t.sku} ×${t.qty}`).join(", ")}`);
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(`Помилка: ${e.message}`),
  });
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);
  const move = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => api.moveTask(id, status),
    onSuccess: () => qc.invalidateQueries(),
    onError: (e: Error) => toast.error(`Помилка: ${e.message}`),
  });
  const rows = (tasks.data ?? []).filter((t) => matches(q, t.productSku, t.productName, t.assignee));
  const current = tasks.data?.find((t) => t.id === openId);

  return (
    <>
      <PageHeader title="Виробництво" context="Перетягуйте картки між етапами. «Готово» — лише через «Виконати збірку»"
        actions={<>
          <ExportButton onClick={() => exportCsv("vyrobnytstvo.csv", ["Артикул", "Виріб", "Кількість", "Статус", "Відповідальний", "Створено", "Додаткові витрати", "Собівартість од."], rows.map((t) => [t.productSku, t.productName, t.qty, TASK_STATUS[t.status], t.assignee, fmtDate(t.createdAt), t.extraCosts.reduce((s, e) => s + e.amount, 0), t.unitCost ?? ""]))} />
          <Button className="h-10" onClick={() => setCreating(true)}><Plus />Нова задача</Button>
        </>} />
      <div className="space-y-3 p-4 md:p-6">
        <Toolbar><SearchBox value={q} onChange={setQ} /></Toolbar>
        {tasks.isLoading ? <LoadingRows rows={6} /> : tasks.isError ? <ErrorState /> : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {TASK_ORDER.map((st) => {
              const col = rows.filter((t) => t.status === st);
              return (
                <div key={st}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(st); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(null); const id = e.dataTransfer.getData("text/plain"); const t = tasks.data?.find((x) => x.id === id); if (t && t.status !== st) move.mutate({ id, status: st }); }}
                  className={`flex w-64 shrink-0 flex-col rounded-lg border bg-card/60 ${dragOver === st ? "border-primary" : ""}`}>
                  <div className="flex items-center justify-between border-b px-3 py-2">
                    <span className="th-ops">{TASK_STATUS[st]}</span><span className="text-xs tabular-nums text-muted-foreground">{col.length}</span>
                  </div>
                  <div className="flex min-h-32 flex-col gap-2 p-2">
                    {!col.length && <div className="py-6 text-center text-xs text-muted-foreground">Немає даних</div>}
                    {col.map((t) => {
                      const ok = enough(t);
                      const extra = t.extraCosts.reduce((s, e) => s + e.amount, 0);
                      return (
                        <button key={t.id} draggable={t.status !== "done"} onDragStart={(e) => e.dataTransfer.setData("text/plain", t.id)} onClick={() => setOpenId(t.id)}
                          className="rounded-md border bg-card p-3 text-left transition-colors hover:border-primary">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-medium leading-snug">{t.productName}</span>
                            {t.status !== "done" && <span title={ok ? "Матеріали в наявності" : "Не вистачає матеріалів"} className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${ok ? "bg-success-foreground" : "bg-warning"}`} />}
                          </div>
                          <div className="mt-1 font-mono text-xs text-muted-foreground">{t.productSku}</div>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                            <Pill tone="primary">×{fmtNum(t.qty)}</Pill>
                            {(t.route ?? []).map((w) => (
                              <span key={w} className={`rounded-full px-2 py-0.5 ${(t.routeDone ?? []).includes(w) ? "bg-success-foreground/15 text-success-foreground" : "bg-muted text-muted-foreground"}`}>{w}</span>
                            ))}
                            {t.due && <Pill tone="warning">до {t.due.slice(5)}</Pill>}
                            {t.assignee && <Pill>{t.assignee}</Pill>}
                            {extra > 0 && <Pill>+{fmtMoney(extra)}</Pill>}
                            {t.status !== "done" && !ok && <Pill tone="warning">не вистачає</Pill>}
                            {t.unitCost !== undefined && <Pill tone="success">{fmtMoney(t.unitCost)}/шт</Pill>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {creating && <TaskForm onClose={() => setCreating(false)} />}
      <Sheet open={!!current} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">{current && <TaskDetail t={current} onMove={(s) => move.mutate({ id: current.id, status: s })} onClose={() => setOpenId(null)} />}</SheetContent>
      </Sheet>

      <div className="mt-6 px-4 pb-6 md:px-6">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-medium text-primary">
            🏭 Закази у виробництві <span className="tabular-nums">({shownOrders.length})</span>
          </h2>
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
            <input type="checkbox" checked={bomOnly} onChange={(e) => setBomOnly(e.target.checked)} className="h-3.5 w-3.5" />
            лише з BOM
          </label>
        </div>
        <div className="rounded-lg border bg-card">
          {inProd.isLoading ? <LoadingRows rows={3} /> : inProd.isError ? <ErrorState /> : !shownOrders.length ? (
            <EmptyState text="Немає замовлень, переданих у виробництво" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="th-ops w-24 px-3 py-2 text-left">Замовлення</th>
                  <th className="th-ops w-56 px-3 py-2 text-left">Клієнт</th>
                  <th className="th-ops w-24 px-3 py-2 text-left">Дата</th>
                  <th className="th-ops px-3 py-2 text-left">Позиції</th>
                </tr>
              </thead>
              <tbody>
                {shownOrders.map((o) => (
                  <tr key={o.id} className={`border-b last:border-0 ${!o.hasBom ? "opacity-60" : ""}`}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <a href={`https://gerts.keycrm.app/app/orders/view/${o.id}`} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">#{o.id}</a>
                        {o.hasBom && (
                          <button type="button" disabled={genTasks.isPending || !o.canCreate}
                            onClick={() => genTasks.mutate(o.id)}
                            title={o.canCreate
                              ? "Створити задачі виробництва за цим заказом"
                              : `Не вистачає: ${o.missing.map((m) => `${m.sku} (${m.need - m.have})`).join(", ")}`}
                            className={`rounded-md px-2 py-1 text-xs font-medium transition ${o.canCreate
                              ? "bg-success/20 text-success-foreground ring-1 ring-success/40 hover:bg-success/30"
                              : "bg-muted text-muted-foreground"}`}>
                            ⚡ Створити задачі
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">{o.buyer}</td>
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">{o.date ? o.date.slice(5).replace("-", ".") : "—"}</td>
                    <td className="px-3 py-2">
                      {o.items.map((i) => (
                        <span key={i.sku} title={i.sku} className="mr-2 inline-block rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{i.name} ×{i.qty}</span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

function TaskDetail({ t, onMove, onClose }: { t: ProductionTask; onMove: (s: TaskStatus) => void; onClose: () => void }) {
  const qc = useQueryClient();
  const est = api.estimateTask(t.id);
  const short = est.lines.some((l) => l.shortage > 0);
  const [cost, setCost] = useState({ name: "", amount: "" });
  const [confirm, setConfirm] = useState(false);
  const addCost = useMutation({
    mutationFn: () => api.addExtraCost(t.id, { name: cost.name, amount: parseNum(cost.amount) }),
    onSuccess: () => { toast.success("Збережено"); setCost({ name: "", amount: "" }); qc.invalidateQueries(); },
    onError: (e: Error) => toast.error(`Помилка: ${e.message}`),
  });
  const assemble = useMutation({
    mutationFn: () => api.assembleTask(t.id),
    onSuccess: (r) => { toast.success(`Збережено: зібрано ${r.productName} ×${r.qty}`); qc.invalidateQueries(); },
    onError: (e: Error) => toast.error(`Помилка: ${e.message}`),
  });
  const delTask = useMutation({
    mutationFn: () => api.deleteTask(t.id),
    onSuccess: () => { toast.success("Задачу видалено"); qc.invalidateQueries(); onClose(); },
    onError: (e: Error) => toast.error(`Помилка: ${e.message}`),
  });
  const done = t.status === "done";

  return (
    <>
      <SheetHeader><SheetTitle>{t.productName} ×{fmtNum(t.qty)}</SheetTitle></SheetHeader>
      <div className="mt-4 space-y-5 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div><div className="text-xs text-muted-foreground">Артикул</div><span className="font-mono">{t.productSku}</span></div>
          <div><div className="text-xs text-muted-foreground">Створено</div>{fmtDate(t.createdAt)}</div>
          <div><div className="text-xs text-muted-foreground">Відповідальний</div>{t.assignee || "—"}</div>
          <Field label="Етап">
            {done ? <span>Готово</span> : (
              <NativeSelect value={t.status} onChange={(e) => onMove(e.target.value as TaskStatus)}>
                {TASK_ORDER.filter((s) => s !== "done").map((s) => <option key={s} value={s}>{TASK_STATUS[s]}</option>)}
              </NativeSelect>
            )}
          </Field>
        </div>

        <div>
          <div className="mb-1 text-xs text-muted-foreground">Матеріали</div>
          <table className="w-full">
            <thead><tr className="border-b"><th className="th-ops py-1.5 text-left">Комплектуюча</th><th className="th-ops num py-1.5">Потрібно</th><th className="th-ops num py-1.5">На складі</th></tr></thead>
            <tbody>{t.materials.map((m) => (
              <tr key={m.sku} className="border-b">
                <td className="py-1.5"><div>{m.name}</div><div className="font-mono text-xs text-muted-foreground">{m.sku}</div></td>
                <td className="num py-1.5">{fmtNum(m.need)}</td>
                <td className={`num py-1.5 font-medium ${m.have >= m.need ? "text-success-foreground" : "text-warning"}`}>{fmtNum(m.have)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>

        <div>
          <div className="mb-1 text-xs text-muted-foreground">Додаткові витрати</div>
          {t.extraCosts.length ? t.extraCosts.map((e, i) => (
            <div key={i} className="flex justify-between border-b py-1.5"><span>{e.name}</span><span className="tabular-nums">{fmtMoney(e.amount)}</span></div>
          )) : <div className="py-1.5 text-muted-foreground">Немає даних</div>}
          {!done && (
            <div className="mt-2 flex gap-2">
              <Input className="h-10" placeholder="Назва" value={cost.name} onChange={(e) => setCost({ ...cost, name: e.target.value })} />
              <Input className="h-10 w-28 text-right" inputMode="decimal" placeholder="Сума" value={cost.amount} onChange={(e) => setCost({ ...cost, amount: e.target.value })} />
              <Button variant="outline" className="h-10" disabled={addCost.isPending} onClick={() => addCost.mutate()}>Додати витрату</Button>
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-background/40 p-3">
          <div className="text-xs text-muted-foreground">Списання за партіями: найстаріші партії першими</div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
            <div>Матеріали<div className="text-sm font-semibold tabular-nums">{fmtMoney(est.materialsCost)}</div></div>
            <div>Витрати<div className="text-sm font-semibold tabular-nums">{fmtMoney(est.extraCost)}</div></div>
            <div>Собівартість од.<div className="text-sm font-semibold tabular-nums text-primary">{fmtMoney(done && t.unitCost !== undefined ? t.unitCost : est.unitCost)}</div></div>
          </div>
          {short && !done && <div className="mt-2 flex items-center gap-1.5 text-xs text-warning"><AlertTriangle className="h-3.5 w-3.5" />Не вистачає партій для частини комплектуючих — оцінка неповна</div>}
        </div>

        {!done && (
          <Button className="h-11 w-full" disabled={short || assemble.isPending} onClick={() => setConfirm(true)}><Hammer />Виконати збірку</Button>
        )}
        <Button variant="outline" className="h-10 w-full text-muted-foreground" disabled={delTask.isPending}
          onClick={() => delTask.mutate()}>
          <Trash2 className="mr-2 h-4 w-4" /> Видалити задачу
        </Button>
      </div>

      <Confirm open={confirm} onOpenChange={setConfirm} confirmLabel="Виконати збірку" onConfirm={() => assemble.mutate()}
        description={`Списання ${est.lines.length} комплектуючих і оприбуткування виробу ×${fmtNum(t.qty)}.`}>
        <div className="space-y-3 text-sm">
          {est.lines.map((l) => (
            <div key={l.sku}>
              <div className="flex justify-between font-medium"><span>{l.name}</span><span className="tabular-nums">−{fmtNum(l.qty)}</span></div>
              {l.consumed.map((c) => (
                <div key={c.batchId} className="flex justify-between pl-3 text-xs text-muted-foreground">
                  <span>партія від {fmtDate(c.date)} · {fmtNum(c.qty)} × {fmtMoney(c.unitCost)}</span><span className="tabular-nums">{fmtMoney(c.cost)}</span>
                </div>
              ))}
            </div>
          ))}
          <div className="flex justify-between border-t pt-2"><span>Оприбуткування: {t.productName}</span><span className="tabular-nums">+{fmtNum(t.qty)}</span></div>
          <div className="flex justify-between font-semibold"><span>Собівартість одиниці</span><span className="tabular-nums">{fmtMoney(est.unitCost)}</span></div>
        </div>
      </Confirm>
    </>
  );
}

function TaskForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const specs = useQuery({ queryKey: ["specs"], queryFn: api.getSpecifications });
  const [f, setF] = useState({ productSku: "", qty: "1", assignee: "" });
  const [q, setQ] = useState("");
  const list = (specs.data ?? []).filter((s) => matches(q, s.productSku, s.productName));
  const selected = specs.data?.find((s) => s.productSku === f.productSku);
  const save = useMutation({
    mutationFn: () => api.createProductionTask({ productSku: f.productSku, qty: parseNum(f.qty), assignee: f.assignee.trim(), extraCosts: [] }),
    onSuccess: () => { toast.success("Задачу створено"); qc.invalidateQueries(); onClose(); },
    onError: (e: Error) => toast.error(`Помилка: ${e.message}`),
  });
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col sm:max-w-2xl">
        <SheetHeader><SheetTitle>Нова задача виробництва</SheetTitle></SheetHeader>
        <div className="mt-3 flex-1 space-y-3 overflow-y-auto pb-4">
          <SearchBox value={q} onChange={setQ} placeholder="Пошук виробу за назвою або артикулом" />
          {specs.isLoading ? <LoadingRows rows={5} /> : !list.length ? <EmptyState text="Немає виробів зі специфікацією" /> : (
            <div className="space-y-1.5">
              {list.map((s) => {
                const active = s.productSku === f.productSku;
                return (
                  <button key={s.productSku} type="button"
                    onClick={() => setF((x) => ({ ...x, productSku: s.productSku }))}
                    className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${active ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-accent"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[15px] font-semibold leading-snug">{s.productName}</span>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">{s.productSku}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(s.route ?? []).map((w) => (
                        <span key={w} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{w}</span>
                      ))}
                      {s.assemble && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">🧩 Збірка</span>}
                      {!(s.route ?? []).length && !s.assemble && <span className="text-xs text-muted-foreground">без робіт</span>}
                    </div>
                    <div className="mt-1.5 text-xs text-muted-foreground">
                      {s.components.length} комплектуючих: {s.components.slice(0, 4).map((c) => c.name.split(" (")[0]).join(", ")}{s.components.length > 4 ? "…" : ""}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="space-y-3 border-t pt-3">
          {selected && (
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <span className="font-medium">{selected.productName}</span>
              <span className="ml-2 font-mono text-xs text-muted-foreground">{selected.productSku}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Кількість"><Input inputMode="numeric" className="h-10" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} /></Field>
            <Field label="Відповідальний"><Input className="h-10" value={f.assignee} onChange={(e) => setF({ ...f, assignee: e.target.value })} /></Field>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="h-11 flex-1" onClick={onClose}>Скасувати</Button>
            <Button className="h-11 flex-1" disabled={!f.productSku || save.isPending} onClick={() => save.mutate()}>Створити задачу</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
