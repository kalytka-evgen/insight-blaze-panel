import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { EmptyState, ErrorState, LoadingRows } from "@/components/DataState";
import { ExportButton, matches, Panel, Pill, SearchBox, Toolbar } from "@/components/ops";
import { OrderTable, orderCsv } from "@/components/OrderTable";
import { api } from "@/lib/api";
import { exportCsv } from "@/lib/format";

export const Route = createFileRoute("/packing")({
  head: () => ({
    meta: [
      { title: "Комплектація — GERTS адмін" },
      { name: "description", content: "Лист відвантаження: що збирати і відправляти, що чекає виробництва." },
    ],
  }),
  component: PackingPage,
});

function PackingPage() {
  const s = useQuery({ queryKey: ["packing"], queryFn: api.getPacking });
  const [q, setQ] = useState("");
  const rows = (s.data ?? []).filter((o) => matches(q, o.buyer, o.number));
  const ready = rows.filter((o) => o.canShip);
  const waiting = rows.filter((o) => !o.canShip);

  const onExport = () => {
    const c = orderCsv(rows, (o) => (o.canShip ? "Готово" : "Чекає виробництва"));
    exportCsv("komplektatsiia.csv", c.headers, c.rows);
  };

  return (
    <>
      <PageHeader
        title="Комплектація"
        context="Готово зібрати й відправити — якщо товарів вистачає. Решта чекає виробництва."
        actions={<ExportButton onClick={onExport} />}
      />
      <div className="space-y-3 p-4 md:p-6">
        <Toolbar><SearchBox value={q} onChange={setQ} placeholder="Пошук за клієнтом або номером" /></Toolbar>

        <div className="grid gap-4 xl:grid-cols-2">
        <section>
          <h2 className="mb-2 text-sm font-medium text-success-foreground">
            ✅ Готово зібрати і відправити <span className="tabular-nums">({ready.length})</span>
          </h2>
          {s.isLoading ? <LoadingRows /> : s.isError ? <ErrorState /> : !ready.length ? (
            <EmptyState text="Немає замовлень, готових до відвантаження" />
          ) : (
            <Panel>
              <OrderTable
                rows={ready}
                extraHeader="Стан"
                extraCell={() => <Pill tone="success">✅ Відвантажити</Pill>}
              />
            </Panel>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-medium text-warning">
            🔧 Чекають виробництва <span className="tabular-nums">({waiting.length})</span>
          </h2>
          {s.isLoading ? <LoadingRows /> : s.isError ? <ErrorState /> : !waiting.length ? (
            <EmptyState text="Всі замовлення відвантажувального листа забезпечені" />
          ) : (
            <Panel>
              <OrderTable
                rows={waiting}
                extraHeader="Стан"
                extraCell={() => <Pill tone="warning">🔧 Бракує готових</Pill>}
              />
            </Panel>
          )}
        </section>
        </div>
      </div>
    </>
  );
}
