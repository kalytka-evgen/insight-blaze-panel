import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/purchases")({
  head: () => ({
    meta: [
      { title: "Закупки — GERTS адмін" },
      { name: "description", content: "Закупки: розділ адмін-панелі GERTS." },
      { property: "og:title", content: "Закупки — GERTS адмін" },
      { property: "og:description", content: "Закупки: розділ адмін-панелі GERTS." },
    ],
  }),
  component: () => <ComingSoon title="Закупки" />,
});
