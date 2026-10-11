import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/demand")({
  head: () => ({
    meta: [
      { title: "Потреба — GERTS адмін" },
      { name: "description", content: "Потреба: розділ адмін-панелі GERTS." },
      { property: "og:title", content: "Потреба — GERTS адмін" },
      { property: "og:description", content: "Потреба: розділ адмін-панелі GERTS." },
    ],
  }),
  component: () => <ComingSoon title="Потреба" />,
});
