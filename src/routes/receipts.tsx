import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/receipts")({
  head: () => ({
    meta: [
      { title: "Приходи — GERTS адмін" },
      { name: "description", content: "Приходи: розділ адмін-панелі GERTS." },
      { property: "og:title", content: "Приходи — GERTS адмін" },
      { property: "og:description", content: "Приходи: розділ адмін-панелі GERTS." },
    ],
  }),
  component: () => <ComingSoon title="Приходи" />,
});
