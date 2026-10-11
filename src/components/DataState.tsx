import { AlertTriangle, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-3" aria-label="Завантаження…">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-full bg-muted" />
      ))}
    </div>
  );
}

export function EmptyState({ text = "Немає даних" }: { text?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground">
      <Inbox className="h-6 w-6" />
      {text}
    </div>
  );
}

export function ErrorState({ text = "Помилка завантаження даних" }: { text?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-sm text-destructive">
      <AlertTriangle className="h-6 w-6" />
      Помилка: {text}
    </div>
  );
}
