import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Готово до відвантаження — GERTS адмін" },
      { name: "description", content: "Готово до відвантаження: розділ адмін-панелі GERTS." },
      { property: "og:title", content: "Готово до відвантаження — GERTS адмін" },
      { property: "og:description", content: "Готово до відвантаження: розділ адмін-панелі GERTS." },
    ],
  }),
  component: () => <ComingSoon title="Готово до відвантаження" />,
});
