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
      { name: "description", content: "Лист комплектації для складу: що готово відвантажувати і що можна зібрати." },
      { property: "og:title", content: "Комплектація — GERTS адмін" },
      { property: "og:description", content: "Лист комплектації замовлень." },
    ],
  }),
  component: PackingPage,
});

const stateLabel = (canShip: boolean) => (canShip ? "✅ Готово відвантажувати" : "🔧 Можна зібрати");

function PackingPage() {
  const s = useQuery({ queryKey: ["packing"], queryFn: api.getPacking });
  const [q, setQ] = useState("");
  const rows = (s.data ?? []).filter((o) => matches(q, o.buyer, o.number));
  return (
    <>
      <PageHeader title="Комплектація" context="Замовлення, для яких готова продукція вже є на складі"
        actions={<ExportButton onClick={() => { const c = orderCsv(rows, (o) => stateLabel(rows.find((r) => r.id === o.id)?.canShip ?? false)); exportCsv("komplektatsiia.csv", c.headers, c.rows); }} />} />
      <div className="space-y-3 p-4 md:p-6">
        <Toolbar><SearchBox value={q} onChange={setQ} placeholder="Пошук за клієнтом або номером" /></Toolbar>
        <Panel>
          {s.isLoading ? <LoadingRows /> : s.isError ? <ErrorState /> : !rows.length ? <EmptyState /> : (
            <OrderTable rows={rows} extraHeader="Стан" extraCell={(o) => <Pill tone={o.canShip ? "success" : "warning"}>{stateLabel(o.canShip)}</Pill>} />
          )}
        </Panel>
      </div>
    </>
  );
}
