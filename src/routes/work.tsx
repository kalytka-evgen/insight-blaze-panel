import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle, Check, Hammer, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { EmptyState, ErrorState, LoadingRows } from "@/components/DataState";
import { Button } from "@/components/ui/button";
import { api, TASK_ORDER, TASK_STATUS } from "@/lib/api";
import { fmtNum } from "@/lib/format";
import type { ProductionTask, TaskStatus } from "@/lib/types";

export const Route = createFileRoute("/work")({
  head: () => ({ meta: [{ title: "Моя робота — GERTS" }] }),
  component: WorkPage,
});

const HINT_KEY = "gerts-hint-work";
const NEXT: Partial<Record<TaskStatus, TaskStatus>> = {
  new: "welding",
  welding: "grinding",
  grinding: "painting",
  painting: "assembly",
  assembly: "done",
};

/** Екран виконавця: черга + великі кнопки. Нічого зайвого. */
function WorkPage() {
  const qc = useQueryClient();
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: api.getProductionTasks });
  const [hint, setHint] = useState(() => {
    try { return !localStorage.getItem(HINT_KEY); } catch { return true; }
  });
  const closeHint = () => {
    setHint(false);
    try { localStorage.setItem(HINT_KEY, "1"); } catch { /* noop */ }
  };
  const move = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => api.moveTask(id, status),
    onSuccess: () => qc.invalidateQueries(),
    onError: (e: Error) => toast.error(`Помилка: ${e.message}`),
  });
  const assemble = useMutation({
    mutationFn: (id: string) => api.assembleTask(id),
    onSuccess: (r) => { toast.success(`Готово: ${r.productName} ×${r.qty} — матеріали списано`); qc.invalidateQueries(); },
    onError: (e: Error) => toast.error(`Помилка: ${e.message}`),
  });

  const toggle = useMutation({
    mutationFn: ({ id, work }: { id: string; work: string }) => api.toggleRoute(id, work),
    onSuccess: () => qc.invalidateQueries(),
    onError: (e: Error) => toast.error(`Помилка: ${e.message}`),
  });

  const active = (tasks.data ?? []).filter((t) => t.status !== "done")
    .sort((a, b) => TASK_ORDER.indexOf(a.status) - TASK_ORDER.indexOf(b.status));

  // Задача з маршрутом робіт (CT_1022): чек-лист робіт замість лінійних етапів
  const routeCard = (t: ProductionTask) => {
    const route = t.route ?? [];
    const done = new Set(t.routeDone ?? []);
    const allDone = route.length > 0 && route.every((w) => done.has(w));
    return (
      <div className="space-y-2">
        {route.map((w) => (
          <button key={w} type="button" disabled={toggle.isPending}
            onClick={() => toggle.mutate({ id: t.id, work: w })}
            className={`flex h-14 w-full items-center justify-between rounded-xl border px-4 text-base font-medium transition-colors ${done.has(w) ? "border-success bg-success text-white" : "border-border bg-card hover:bg-accent"}`}>
            <span>{w}</span>
            {done.has(w) && <Check className="h-5 w-5" />}
          </button>
        ))}
        <Button size="lg" className="h-14 w-full text-base" disabled={!allDone || assemble.isPending}
          onClick={() => assemble.mutate(t.id)}>
          <Check className="mr-2 h-5 w-5" /> Виготовлено — списати матеріали
        </Button>
      </div>
    );
  };

  const step = (t: ProductionTask) => {
    if ((t.route ?? []).length > 0) return routeCard(t);
    const next = NEXT[t.status];
    if (t.status === "assembly") {
      return (
        <Button size="lg" className="h-14 w-full text-base" disabled={assemble.isPending}
          onClick={() => assemble.mutate(t.id)}>
          <Check className="mr-2 h-5 w-5" /> Виготовлено — списати матеріали
        </Button>
      );
    }
    if (t.status === "new") {
      return (
        <Button size="lg" className="h-14 w-full text-base" disabled={move.isPending}
          onClick={() => move.mutate({ id: t.id, status: next! })}>
          <Hammer className="mr-2 h-5 w-5" /> Взяти в роботу
        </Button>
      );
    }
    return (
      <Button size="lg" variant="outline" className="h-14 w-full text-base" disabled={move.isPending}
        onClick={() => move.mutate({ id: t.id, status: next! })}>
        <Check className="mr-2 h-5 w-5" /> Етап готовий → {next ? TASK_STATUS[next] : ""}
      </Button>
    );
  };

  return (
    <>
      <PageHeader title="Моя робота" context={`Виробництво · ${active.length} в черзі`} />
      {hint && (
        <div className="mx-4 mt-3 flex items-start gap-2 rounded-lg border border-primary/40 bg-primary/5 p-3 text-sm md:mx-6">
          <span className="flex-1">
            Це твоя черга виробництва. Бери верхню задачу → тисни «Взяти в роботу» → виконуй етап → тисни «Етап готовий».
            Коли пройдеш усі етапи — «Виготовлено»: матеріали спишуться зі складу самі.
          </span>
          <button onClick={closeHint} aria-label="Закрити підказку"><X className="h-4 w-4" /></button>
        </div>
      )}
      <div className="space-y-3 p-4 md:p-6">
        {tasks.isLoading ? <LoadingRows rows={5} /> : tasks.isError ? <ErrorState /> : !active.length ? (
          <EmptyState text="Черга порожня — нових задач немає. Якщо задача потрібна — поклич менеджера." />
        ) : (
          active.map((t) => {
            const ok = t.materials.every((m) => m.have >= m.need);
            return (
              <div key={t.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-base font-semibold leading-snug">{t.productName}</div>
                    <div className="mt-0.5 font-mono text-xs text-muted-foreground">{t.productSku}</div>
                  </div>
                  <span className="rounded-full bg-sidebar-accent px-3 py-1 text-sm font-medium">{TASK_STATUS[t.status]}</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span className="rounded-lg bg-primary/10 px-2 py-1 font-semibold tabular-nums">×{fmtNum(t.qty)}</span>
                  {t.assignee && <span className="text-muted-foreground">{t.assignee}</span>}
                  {t.due && (
                    <span className="rounded-lg bg-warning/15 px-2 py-1 tabular-nums text-warning">⚠ до {t.due.slice(5)}</span>
                  )}
                  {!ok && t.status !== "done" && (
                    <span className="flex items-center gap-1 rounded-lg bg-warning/15 px-2 py-1 text-warning">
                      <AlertTriangle className="h-4 w-4" /> не вистачає матеріалів
                    </span>
                  )}
                </div>
                <div className="mt-4">{step(t)}</div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
