// Mocks — replace with fetch() calls to real backend later.
import * as db from "./mockData";
import type { DemandGroup, DemandRow, JournalEntry, Summary } from "./types";

const delay = <T,>(v: T, ms = 250): Promise<T> => new Promise((r) => setTimeout(() => r(structuredClone(v)), ms));

const productBySku = (sku: string) => db.products.find((p) => p.sku === sku);
const orderedQty = (sku: string) =>
  db.purchases.filter((p) => p.status === "ordered" || p.status === "paid").flatMap((p) => p.items).filter((i) => i.sku === sku).reduce((s, i) => s + i.qty, 0);

/** До замовлення = max(Потрібно за замовленнями, Мінімальний залишок) − На складі − Замовлено */
function computeDemand(): DemandGroup[] {
  const groups = ["КАРТОННІ МІШЕНІ", "ПАПЕРОВІ МІШЕНІ", "СТАЛЬНІ МІШЕНІ", "ІНШЕ"];
  return groups.map((title) => {
    const rows: DemandRow[] = [];
    for (const p of db.products.filter((x) => x.category === title)) {
      const sources = db.customerOrders.flatMap((o) => o.items.filter((i) => i.sku === p.sku).map((i) => ({ orderId: o.id, qty: i.qty })));
      const need = sources.reduce((s, x) => s + x.qty, 0);
      const tender = db.customerOrders.some((o) => o.tender && o.items.some((i) => i.sku === p.sku));
      const ordered = orderedQty(p.sku);
      const deficit = Math.max(need, p.minStock) - p.stock - ordered;
      const spec = db.specifications.find((s) => s.productSku === p.sku);
      rows.push({ sku: p.sku, name: p.name, need, stock: p.stock, ordered, deficit, sources, tender, isProduct: true });
      if (spec && deficit > 0) {
        for (const c of spec.components) {
          const cp = productBySku(c.sku);
          const cNeed = Math.ceil(c.qty * deficit);
          const cOrdered = orderedQty(c.sku);
          const cStock = cp?.stock ?? 0;
          rows.push({ sku: c.sku, name: c.name, need: cNeed, stock: cStock, ordered: cOrdered, deficit: Math.max(cNeed, 0) - cStock - cOrdered, sources, tender, parentSku: p.sku });
        }
      }
    }
    return { title, rows };
  });
}

export const api = {
  async getSummary(): Promise<Summary> {
    const demand = computeDemand();
    const leaf = demand.flatMap((g) => g.rows).filter((r) => r.deficit > 0 && !(r.isProduct && db.specifications.some((s) => s.productSku === r.sku)));
    const deficitValue = leaf.reduce((s, r) => s + r.deficit * (productBySku(r.sku)?.cost ?? 0), 0);
    return delay({
      deficitValue,
      activeTasks: db.productionTasks.filter((t) => t.status !== "done").length,
      supplierDebt: db.contractors.filter((c) => c.balance > 0).reduce((s, c) => s + c.balance, 0),
      readyToShip: db.shipments.filter((s) => s.status === "ready").length,
      toPack: db.shipments.filter((s) => s.status === "pack").length,
    });
  },
  async getDemand(): Promise<DemandGroup[]> {
    return delay(computeDemand());
  },
  async getJournal(limit = 300): Promise<JournalEntry[]> {
    return delay([...db.journal].sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, limit));
  },
  /** Creates one production task per selected finished-product row (qty = deficit). */
  async createProductionTasksFromDemand(rows: { sku: string; qty: number }[]): Promise<number> {
    const now = new Date().toISOString();
    let created = 0;
    for (const r of rows) {
      const spec = db.specifications.find((s) => s.productSku === r.sku);
      if (!spec || r.qty <= 0) continue;
      db.productionTasks.push({
        id: `t${Date.now()}${created}`, productSku: spec.productSku, productName: spec.productName, qty: r.qty,
        status: "new", assignee: "", createdAt: now.slice(0, 10), extraCosts: [], materials: [],
      });
      db.journal.push({ ts: now.slice(0, 19), user: "Власник", action: "Нова задача", details: `${spec.productName} ×${r.qty} (з потреби)` });
      created++;
    }
    return delay(created);
  },
  hasSpecification(sku: string) {
    return db.specifications.some((s) => s.productSku === sku);
  },
  async getProducts(): Promise<Product[]> {
    return delay(db.products);
  },
  async updateMinStock(sku: string, value: number): Promise<Product> {
    if (!Number.isFinite(value) || value < 0) throw new Error("Мінімальний залишок має бути ≥ 0");
    const p = productBySku(sku);
    if (!p) throw new Error("Товар не знайдено");
    const old = p.minStock;
    p.minStock = Math.round(value);
    db.journal.push({ ts: new Date().toISOString().slice(0, 19), user: "Власник", action: "Зміна мінімального залишку", details: `${sku}: ${old} → ${p.minStock}` });
    return delay(p);
  },
};
