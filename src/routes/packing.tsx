import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/packing")({
  head: () => ({
    meta: [
      { title: "Комплектація — GERTS адмін" },
      { name: "description", content: "Комплектація: розділ адмін-панелі GERTS." },
      { property: "og:title", content: "Комплектація — GERTS адмін" },
      { property: "og:description", content: "Комплектація: розділ адмін-панелі GERTS." },
    ],
  }),
  component: () => <ComingSoon title="Комплектація" />,
});
