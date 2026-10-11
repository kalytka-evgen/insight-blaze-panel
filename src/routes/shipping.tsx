import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { EmptyState, ErrorState, LoadingRows } from "@/components/DataState";
import { ExportButton, matches, Panel, SearchBox, Toolbar } from "@/components/ops";
import { OrderTable, orderCsv } from "@/components/OrderTable";
import { api } from "@/lib/api";
import { exportCsv } from "@/lib/format";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Готово до відвантаження — GERTS адмін" },
      { name: "description", content: "Замовлення, передані на склад, з повною наявністю товару." },
      { property: "og:title", content: "Готово до відвантаження — GERTS адмін" },
      { property: "og:description", content: "Список замовлень до відправки." },
    ],
  }),
  component: ShippingPage,
});

function ShippingPage() {
  const s = useQuery({ queryKey: ["shipping"], queryFn: api.getShipping });
  const [q, setQ] = useState("");
  const rows = (s.data ?? []).filter((o) => matches(q, o.buyer, o.number));
  return (
    <>
      <PageHeader title="Готово до відвантаження" context="Замовлення зі статусом «Передано на склад» — все є в наявності"
        actions={<ExportButton onClick={() => { const c = orderCsv(rows); exportCsv("vidvantazhennia.csv", c.headers, c.rows); }} />} />
      <div className="space-y-3 p-4 md:p-6">
        <Toolbar><SearchBox value={q} onChange={setQ} placeholder="Пошук за клієнтом або номером" /></Toolbar>
        <Panel>{s.isLoading ? <LoadingRows /> : s.isError ? <ErrorState /> : !rows.length ? <EmptyState /> : <OrderTable rows={rows} />}</Panel>
      </div>
    </>
  );
}
