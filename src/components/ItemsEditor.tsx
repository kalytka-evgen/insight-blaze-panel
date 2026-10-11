import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { fmtMoney } from "@/lib/format";

export type EditItem = { sku: string; name: string; qty: string; price: string };
export const emptyItem = (): EditItem => ({ sku: "", name: "", qty: "1", price: "" });
export const parseNum = (s: string) => Number(String(s).replace(",", ".").replace(/\s/g, ""));
export const toItems = (rows: EditItem[]) => rows.map((r) => ({ sku: r.sku.trim(), name: r.name.trim(), qty: parseNum(r.qty), price: parseNum(r.price) }));

/** Dynamic rows: SKU (autofill name/price from products), qty, price. */
export function ItemsEditor({ rows, onChange, priceLabel = "Ціна" }: { rows: EditItem[]; onChange: (r: EditItem[]) => void; priceLabel?: string }) {
  const products = useQuery({ queryKey: ["products"], queryFn: api.getProducts });
  const set = (i: number, patch: Partial<EditItem>) => onChange(rows.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  const onSku = (i: number, sku: string) => {
    const p = products.data?.find((x) => x.sku === sku.trim());
    set(i, p ? { sku, name: p.name, price: rows[i].price || (p.cost ? String(p.cost) : "") } : { sku });
  };
  const total = toItems(rows).reduce((s, r) => s + (r.qty || 0) * (r.price || 0), 0);

  return (
    <div className="space-y-2">
      <datalist id="product-skus">
        {products.data?.map((p) => <option key={p.sku} value={p.sku}>{p.name}</option>)}
      </datalist>
      <div className="hidden grid-cols-[120px_1fr_80px_100px_40px] gap-2 text-xs text-muted-foreground md:grid">
        <span>Артикул</span><span>Назва</span><span className="text-right">Кількість</span><span className="text-right">{priceLabel}</span><span />
      </div>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_40px] gap-2 rounded-md border p-2 md:grid-cols-[120px_1fr_80px_100px_40px] md:border-0 md:p-0">
          <Input list="product-skus" aria-label="Артикул" placeholder="Артикул" className="h-10 font-mono text-xs" value={r.sku} onChange={(e) => onSku(i, e.target.value)} />
          <Input aria-label="Назва" placeholder="Назва" className="col-span-2 h-10 md:col-span-1" value={r.name} onChange={(e) => set(i, { name: e.target.value })} />
          <Input aria-label="Кількість" inputMode="decimal" placeholder="К-сть" className="h-10 text-right tabular-nums" value={r.qty} onChange={(e) => set(i, { qty: e.target.value })} />
          <Input aria-label={priceLabel} inputMode="decimal" placeholder={priceLabel} className="h-10 text-right tabular-nums" value={r.price} onChange={(e) => set(i, { price: e.target.value })} />
          <Button type="button" variant="ghost" size="icon" className="h-10 w-10" aria-label="Видалити позицію" onClick={() => onChange(rows.filter((_, k) => k !== i))}><Trash2 /></Button>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" className="h-10" onClick={() => onChange([...rows, emptyItem()])}><Plus />позиція</Button>
        <span className="text-sm">Разом: <span className="font-semibold tabular-nums">{fmtMoney(total)}</span></span>
      </div>
    </div>
  );
}
