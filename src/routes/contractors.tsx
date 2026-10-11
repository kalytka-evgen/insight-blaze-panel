import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/contractors")({
  head: () => ({
    meta: [
      { title: "Контрагенти — GERTS адмін" },
      { name: "description", content: "Контрагенти: розділ адмін-панелі GERTS." },
      { property: "og:title", content: "Контрагенти — GERTS адмін" },
      { property: "og:description", content: "Контрагенти: розділ адмін-панелі GERTS." },
    ],
  }),
  component: () => <ComingSoon title="Контрагенти" />,
});
