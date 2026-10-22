import { Fragment, useState, type ReactNode } from "react";
import { ChevronRight, FileText } from "lucide-react";
import { Pill, td, tdNum, th, thNum, tr } from "@/components/ops";
import { fmtMoney, fmtNum } from "@/lib/format";
import type { ShipmentOrder } from "@/lib/types";

/** Orders with expandable item rows — shared by Відвантаження and Комплектація. */
export function OrderTable<T extends ShipmentOrder>({ rows, extraHeader, extraCell }: { rows: T[]; extraHeader?: string; extraCell?: (o: T) => ReactNode }) {
  const [open, setOpen] = useState<Set<string>>(new Set(rows.slice(0, 3).map((r) => r.id)));
  const toggle = (id: string) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  return (
    <table className="w-full min-w-[720px] text-sm">
      <thead><tr className="border-b">
        <th className={`${th} w-8`} /><th className={th}>Замовлення</th><th className={th}>Клієнт</th><th className={thNum}>Сума</th><th className={th}>Доставка</th>
        {extraHeader && <th className={th}>{extraHeader}</th>}<th className={th}>Документи</th>
      </tr></thead>
      <tbody>
        {rows.map((o) => (
          <Fragment key={o.id}>
            <tr className={`${tr} cursor-pointer`} onClick={() => toggle(o.id)}>
              <td className={td}><ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${open.has(o.id) ? "rotate-90" : ""}`} /></td>
              <td className={td}><a href="#" title={`Замовлення ${o.number}`} onClick={(e) => e.stopPropagation()} className="font-medium text-primary hover:underline">#{o.number}</a></td>
              <td className={td}>{o.buyer}</td>
              <td className={tdNum}>{fmtMoney(o.total)}</td>
              <td className={`${td} text-muted-foreground`}>{o.delivery}</td>
              {extraCell && <td className={td}>{extraCell(o)}</td>}
              <td className={td}>{o.documents ? <Pill tone="primary"><FileText className="mr-1 h-3 w-3" />є</Pill> : <Pill>немає</Pill>}</td>
            </tr>
            {open.has(o.id) && (
              <tr className="border-b bg-background/40">
                <td />
                <td colSpan={extraHeader ? 6 : 5} className="px-3 pb-3 pt-1">
                  <table className="w-full table-fixed text-sm">
                    <thead><tr><th className="th-ops py-1 text-left">Товар</th><th className="th-ops w-64 py-1 text-left">Характеристики</th><th className="th-ops w-24 num py-1">Кількість</th></tr></thead>
                    <tbody>
                      {o.items.map((i) => (
                        <tr key={i.sku} className="border-t">
                          <td className="py-1.5" title={i.sku}>
                            <span className="flex items-center gap-1.5">
                              {i.assemble && (
                                <span title="Зібрати з компонентів" className="rounded bg-primary/15 px-1.5 py-0.5 text-[11px] font-semibold text-primary">🧩 Збірка</span>
                              )}
                              {i.name}
                            </span>
                            {i.components && i.components.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {i.components.map((c) => (
                                  <span key={c.sku} title={c.sku} className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                                    {c.name.split(" (")[0]} ×{fmtNum(c.qty)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-1.5 text-muted-foreground">{i.chars ?? "—"}</td>
                          <td className="num py-1.5 text-base font-semibold">{fmtNum(i.qty)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
            )}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}

export const orderCsv = (rows: ShipmentOrder[], extra?: (o: ShipmentOrder) => string) => ({
  headers: ["Замовлення", "Клієнт", "Сума", "Доставка", ...(extra ? ["Стан"] : []), "Документи", "Товар", "Характеристики", "Кількість"],
  rows: rows.flatMap((o) => o.items.map((i) => [o.number, o.buyer, o.total, o.delivery, ...(extra ? [extra(o)] : []), o.documents ? "так" : "ні", i.name, i.chars ?? "", i.qty])),
});
