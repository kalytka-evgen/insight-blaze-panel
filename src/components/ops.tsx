import type { ReactNode, SelectHTMLAttributes } from "react";
import { Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export const th = "th-ops sticky top-0 z-10 bg-card px-3 py-2 text-left";
export const thNum = "th-ops sticky top-0 z-10 bg-card px-3 py-2 num";
export const td = "px-3 py-1.5";
export const tdNum = "num px-3 py-1.5";
export const tr = "border-b last:border-0 hover:bg-accent";

export function SearchBox({ value, onChange, placeholder = "Пошук за назвою або артикулом" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative min-w-[200px] flex-1 md:max-w-xs">
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input className="h-10 pl-8" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function ExportButton({ onClick }: { onClick: () => void }) {
  return <Button variant="outline" className="h-10" onClick={onClick}><Download />Експорт CSV</Button>;
}

export function NativeSelect({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...p} className={cn("h-10 rounded-md border border-input bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring", className)}>
      {children}
    </select>
  );
}

const tones = {
  muted: "bg-muted text-muted-foreground",
  primary: "bg-primary/20 text-primary",
  success: "bg-success/20 text-success-foreground",
  warning: "bg-warning/15 text-warning",
  danger: "bg-destructive/20 text-destructive",
} as const;
export type Tone = keyof typeof tones;
export function Pill({ tone = "muted", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium", tones[tone])}>{children}</span>;
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("overflow-auto rounded-lg border bg-card", className)}>{children}</div>;
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

export function Confirm({ open, onOpenChange, title = "Ви впевнені?", description, children, confirmLabel = "Підтвердити", onConfirm, destructive }: {
  open: boolean; onOpenChange: (o: boolean) => void; title?: string; description?: ReactNode; children?: ReactNode; confirmLabel?: string; onConfirm: () => void; destructive?: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel>Скасувати</AlertDialogCancel>
          <AlertDialogAction className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""} onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1.5 text-sm", className)}>
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export const matches = (q: string, ...parts: (string | undefined)[]) => !q || parts.join(" ").toLowerCase().includes(q.toLowerCase());
export const todayIso = () => new Date().toISOString().slice(0, 10);
