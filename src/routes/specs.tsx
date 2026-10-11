import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/specs")({
  head: () => ({
    meta: [
      { title: "Специфікації — GERTS адмін" },
      { name: "description", content: "Специфікації: розділ адмін-панелі GERTS." },
      { property: "og:title", content: "Специфікації — GERTS адмін" },
      { property: "og:description", content: "Специфікації: розділ адмін-панелі GERTS." },
    ],
  }),
  component: () => <ComingSoon title="Специфікації" />,
});
