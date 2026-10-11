import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Журнал операцій — GERTS адмін" },
      { name: "description", content: "Журнал операцій: розділ адмін-панелі GERTS." },
      { property: "og:title", content: "Журнал операцій — GERTS адмін" },
      { property: "og:description", content: "Журнал операцій: розділ адмін-панелі GERTS." },
    ],
  }),
  component: () => <ComingSoon title="Журнал операцій" />,
});
