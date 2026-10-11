import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/min-stock")({
  head: () => ({
    meta: [
      { title: "Мінімальні залишки — GERTS адмін" },
      { name: "description", content: "Мінімальні залишки: розділ адмін-панелі GERTS." },
      { property: "og:title", content: "Мінімальні залишки — GERTS адмін" },
      { property: "og:description", content: "Мінімальні залишки: розділ адмін-панелі GERTS." },
    ],
  }),
  component: () => <ComingSoon title="Мінімальні залишки" />,
});
