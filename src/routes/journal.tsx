import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { EmptyState, ErrorState, LoadingRows } from "@/components/DataState";
import { ExportButton, matches, Panel, SearchBox, td, th, Toolbar, tr } from "@/components/ops";
import { api } from "@/lib/api";
import { exportCsv, fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Журнал операцій — GERTS адмін" },
      { name: "description", content: "Останні 300 операцій: приходи, оплати, збірки, зміни налаштувань." },
      { property: "og:title", content: "Журнал операцій — GERTS адмін" },
      { property: "og:description", content: "Історія операцій складу та виробництва." },
    ],
  }),
  component: JournalPage,
});

function JournalPage() {
  const j = useQuery({ queryKey: ["journal"], queryFn: () => api.getJournal(300) });
  const [q, setQ] = useState("");
  const rows = (j.data ?? []).filter((e) => matches(q, e.user, e.action, e.details));
  return (
    <>
      <PageHeader title="Журнал операцій" context="Останні 300 записів" actions={<ExportButton onClick={() => exportCsv("zhurnal.csv", ["Час", "Користувач", "Дія", "Деталі"], rows.map((e) => [fmtDateTime(e.ts), e.user, e.action, e.details]))} />} />
      <div className="space-y-3 p-4 md:p-6">
        <Toolbar><SearchBox value={q} onChange={setQ} placeholder="Пошук у журналі" /></Toolbar>
        <Panel className="max-h-[75vh]">
          {j.isLoading ? <LoadingRows rows={10} /> : j.isError ? <ErrorState /> : !rows.length ? <EmptyState /> : (
            <table className="w-full min-w-[700px] text-sm">
              <thead><tr className="border-b"><th className={th}>Час</th><th className={th}>Користувач</th><th className={th}>Дія</th><th className={th}>Деталі</th></tr></thead>
              <tbody>
                {rows.map((e, i) => (
                  <tr key={i} className={tr}>
                    <td className={`${td} whitespace-nowrap tabular-nums text-muted-foreground`}>{fmtDateTime(e.ts)}</td>
                    <td className={td}>{e.user}</td>
                    <td className={`${td} whitespace-nowrap font-medium`}>{e.action}</td>
                    <td className={`${td} text-muted-foreground`}>{e.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
    </>
  );
}
