import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Звіти — GERTS адмін" },
      { name: "description", content: "Звіти: розділ адмін-панелі GERTS." },
      { property: "og:title", content: "Звіти — GERTS адмін" },
      { property: "og:description", content: "Звіти: розділ адмін-панелі GERTS." },
    ],
  }),
  component: () => <ComingSoon title="Звіти" />,
});
