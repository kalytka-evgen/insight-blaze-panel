import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/production")({
  head: () => ({
    meta: [
      { title: "Виробництво — GERTS адмін" },
      { name: "description", content: "Виробництво: розділ адмін-панелі GERTS." },
      { property: "og:title", content: "Виробництво — GERTS адмін" },
      { property: "og:description", content: "Виробництво: розділ адмін-панелі GERTS." },
    ],
  }),
  component: () => <ComingSoon title="Виробництво" />,
});
