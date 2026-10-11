// Mocks — replace with fetch() calls to real backend later.
import * as db from "./mockData";
import type { Contractor, DemandGroup, DemandRow, ExtraCost, JournalEntry, Payment, Product, ProductionTask, Purchase, PurchaseStatus, Receipt, ReportRow, ShipmentOrder, Specification, StockBatch, Summary, TaskStatus } from "./types";
import { consumeFifo, type FifoConsumption } from "./fifo";
import { fmtMoney } from "./format";

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

  // ---------- Контрагенти ----------
  async getContractors(): Promise<Contractor[]> {
    return delay(db.contractors);
  },
  async createContractor(name: string, phone = ""): Promise<Contractor> {
    if (!name.trim()) throw new Error("Вкажіть назву");
    const c: Contractor = { id: `c${Date.now()}`, name: name.trim(), phone, balance: 0 };
    db.contractors.push(c);
    log("Новий контрагент", c.name);
    return delay(c);
  },
  async getPayments(contractorId?: string): Promise<Payment[]> {
    return delay(db.payments.filter((p) => !contractorId || p.contractorId === contractorId).sort((a, b) => b.date.localeCompare(a.date)));
  },
  async addPayment(input: Omit<Payment, "id">): Promise<Payment> {
    if (!(input.amount > 0)) throw new Error("Сума має бути більше 0");
    const c = db.contractors.find((x) => x.id === input.contractorId);
    if (!c) throw new Error("Контрагента не знайдено");
    const p: Payment = { ...input, id: `pay${Date.now()}` };
    db.payments.push(p);
    c.balance -= p.amount;
    log("Оплата", `${c.name} — ${fmtMoney(p.amount)}`);
    return delay(p);
  },

  // ---------- Закупки ----------
  async getPurchases(): Promise<Purchase[]> {
    return delay([...db.purchases].sort((a, b) => b.date.localeCompare(a.date)));
  },
  /** Received qty per SKU for a purchase (from linked receipts). */
  receivedFor(purchaseId: string): Record<string, number> {
    const out: Record<string, number> = {};
    for (const r of db.receipts.filter((x) => x.purchaseId === purchaseId)) for (const i of r.items) out[i.sku] = (out[i.sku] ?? 0) + i.qty;
    return out;
  },
  async createPurchase(input: Omit<Purchase, "id" | "total" | "status"> & { status?: PurchaseStatus }): Promise<Purchase> {
    validateItems(input.items);
    const c = db.contractors.find((x) => x.id === input.contractorId);
    if (!c) throw new Error("Оберіть постачальника");
    const total = sumItems(input.items);
    const p: Purchase = { ...input, id: `p${Date.now()}`, total, status: input.status ?? "ordered" };
    db.purchases.push(p);
    c.balance += total;
    log("Нова закупка", `${p.number} — ${c.name}, ${fmtMoney(total)}`);
    return delay(p);
  },
  async updatePurchaseStatus(id: string, status: PurchaseStatus): Promise<Purchase> {
    const p = db.purchases.find((x) => x.id === id);
    if (!p) throw new Error("Закупку не знайдено");
    p.status = status;
    log("Статус закупки", `${p.number} → ${PURCHASE_STATUS[status]}`);
    return delay(p);
  },

  // ---------- Приходи / партії ----------
  async getReceipts(): Promise<Receipt[]> {
    return delay([...db.receipts].sort((a, b) => b.date.localeCompare(a.date)));
  },
  async createReceipt(input: Omit<Receipt, "id" | "total" | "number"> & { number?: string; comment?: string }): Promise<Receipt> {
    validateItems(input.items);
    const c = db.contractors.find((x) => x.id === input.contractorId);
    if (!c) throw new Error("Оберіть постачальника");
    const number = input.number?.trim() || `ПР-${String(db.receipts.length + 45).padStart(3, "0")}`;
    const r: Receipt = { id: `r${Date.now()}`, number, date: input.date, contractorId: input.contractorId, purchaseId: input.purchaseId || undefined, items: input.items, total: sumItems(input.items) };
    db.receipts.push(r);
    r.items.forEach((i, k) => {
      db.batches.push({ id: `b${Date.now()}${k}`, sku: i.sku, name: i.name, date: r.date, qtyInitial: i.qty, qtyRemaining: i.qty, unitCost: i.price, source: `Прихід ${number}`, purchaseId: r.purchaseId });
      const prod = productBySku(i.sku);
      if (prod) { prod.stock += i.qty; prod.cost = i.price; }
    });
    if (r.purchaseId) {
      const p = db.purchases.find((x) => x.id === r.purchaseId);
      if (p) {
        const rec = api.receivedFor(p.id);
        if (p.items.every((i) => (rec[i.sku] ?? 0) >= i.qty)) p.status = "received";
      }
    } else c.balance += r.total;
    log("Прихід", `${number}: ${r.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}`);
    return delay(r);
  },
  async getBatches(sku?: string): Promise<StockBatch[]> {
    return delay(db.batches.filter((b) => !sku || b.sku === sku).sort((a, b) => a.date.localeCompare(b.date)));
  },

  // ---------- Виробництво ----------
  async getProductionTasks(): Promise<ProductionTask[]> {
    return delay(db.productionTasks.map(withMaterials));
  },
  async createProductionTask(input: { productSku: string; qty: number; assignee: string; extraCosts: ExtraCost[] }): Promise<ProductionTask> {
    const spec = db.specifications.find((s) => s.productSku === input.productSku);
    if (!spec) throw new Error("Для виробу немає специфікації");
    if (!(input.qty >= 1)) throw new Error("Кількість має бути ≥ 1");
    const t: ProductionTask = { id: `t${Date.now()}`, productSku: spec.productSku, productName: spec.productName, qty: Math.round(input.qty), status: "new", assignee: input.assignee, createdAt: today(), extraCosts: input.extraCosts.filter((e) => e.name.trim() && e.amount > 0), materials: [] };
    db.productionTasks.push(t);
    log("Нова задача", `${t.productName} ×${t.qty}`);
    return delay(withMaterials(t));
  },
  async moveTask(id: string, status: TaskStatus): Promise<void> {
    const t = db.productionTasks.find((x) => x.id === id);
    if (!t) throw new Error("Задачу не знайдено");
    if (t.status === "done") throw new Error("Задача вже виконана");
    if (status === "done") throw new Error("Щоб завершити задачу, виконайте збірку");
    t.status = status;
    log("Зміна статусу задачі", `${t.productName} ×${t.qty} → ${TASK_STATUS[status]}`);
    return delay(undefined);
  },
  async addExtraCost(id: string, cost: ExtraCost): Promise<void> {
    const t = db.productionTasks.find((x) => x.id === id);
    if (!t) throw new Error("Задачу не знайдено");
    if (!cost.name.trim() || !(cost.amount > 0)) throw new Error("Вкажіть назву і суму");
    t.extraCosts.push(cost);
    log("Додаткова витрата", `${t.productName}: ${cost.name} — ${fmtMoney(cost.amount)}`);
    return delay(undefined);
  },
  /** Assembly estimate: FIFO consumption of components + extra costs. */
  estimateTask(id: string): AssemblyEstimate {
    const t = db.productionTasks.find((x) => x.id === id);
    if (!t) throw new Error("Задачу не знайдено");
    return estimate(t);
  },
  async assembleTask(id: string): Promise<ProductionTask> {
    const t = db.productionTasks.find((x) => x.id === id);
    if (!t) throw new Error("Задачу не знайдено");
    if (t.status === "done") throw new Error("Задача вже виконана");
    const est = estimate(t);
    if (est.lines.some((l) => l.shortage > 0)) throw new Error("Недостатньо комплектуючих");
    for (const l of est.lines) {
      for (const c of l.consumed) { const b = db.batches.find((x) => x.id === c.batchId); if (b) b.qtyRemaining -= c.qty; }
      const p = productBySku(l.sku);
      if (p) p.stock -= l.qty;
    }
    const prod = productBySku(t.productSku);
    if (prod) { prod.stock += t.qty; prod.cost = est.unitCost; }
    db.batches.push({ id: `b${Date.now()}`, sku: t.productSku, name: t.productName, date: today(), qtyInitial: t.qty, qtyRemaining: t.qty, unitCost: est.unitCost, source: "Збірка" });
    t.status = "done";
    t.unitCost = est.unitCost;
    log("Збірка", `${t.productName} ×${t.qty}, собівартість ${fmtMoney(est.unitCost)}/шт`);
    return delay(withMaterials(t));
  },

  // ---------- Відвантаження / Комплектація ----------
  async getShipping(): Promise<ShipmentOrder[]> {
    return delay(db.shipments.filter((s) => s.status === "ready"));
  },
  async getPacking(): Promise<(ShipmentOrder & { canShip: boolean })[]> {
    return delay(db.shipments.filter((s) => s.status === "pack").map((s) => ({ ...s, canShip: s.items.every((i) => (productBySku(i.sku)?.stock ?? 0) >= i.qty) })));
  },

  // ---------- Специфікації ----------
  async getSpecifications(): Promise<Specification[]> {
    return delay(db.specifications);
  },
  async searchProducts(q: string): Promise<Product[]> {
    const s = q.toLowerCase();
    return delay(db.products.filter((p) => `${p.sku} ${p.name}`.toLowerCase().includes(s)).slice(0, 20), 50);
  },
  async saveSpecification(spec: Specification, newProduct?: { category: string }): Promise<Specification> {
    const err = validateSpec(spec);
    if (err) throw new Error(err);
    if (!productBySku(spec.productSku)) {
      db.products.push({ sku: spec.productSku, name: spec.productName, category: newProduct?.category ?? "СТАЛЬНІ МІШЕНІ", unit: "шт", stock: 0, minStock: 0, cost: 0 });
    }
    const i = db.specifications.findIndex((s) => s.productSku === spec.productSku);
    if (i >= 0) db.specifications[i] = spec; else db.specifications.push(spec);
    log("Специфікація збережена", `${spec.productName}: ${spec.components.length} компонентів`);
    return delay(spec);
  },
  async deleteSpecification(productSku: string): Promise<void> {
    const i = db.specifications.findIndex((s) => s.productSku === productSku);
    if (i < 0) throw new Error("Специфікацію не знайдено");
    const [s] = db.specifications.splice(i, 1);
    log("Специфікація видалена", s.productName);
    return delay(undefined);
  },
  specUnitCost(spec: Pick<Specification, "components">): number {
    return spec.components.reduce((s, c) => s + c.qty * (productBySku(c.sku)?.cost ?? 0), 0);
  },

  // ---------- Звіти ----------
  async getReports(kind: "orders" | "products" | "periods", period: ReportPeriod = "month"): Promise<ReportResult> {
    const lines = salesLines();
    if (kind === "orders") {
      const map = new Map<string, OrderReportRow>();
      for (const l of lines) {
        const r = map.get(l.orderId) ?? { orderId: l.orderId, date: l.date, buyer: l.buyer, revenue: 0, cost: 0, margin: 0, marginPct: 0 };
        r.revenue += l.revenue; r.cost += l.cost;
        map.set(l.orderId, r);
      }
      return delay({ kind, rows: [...map.values()].map(withMargin).sort((a, b) => b.date.localeCompare(a.date)) });
    }
    if (kind === "products") {
      const map = new Map<string, ProductReportRow>();
      for (const l of lines) {
        const r = map.get(l.sku) ?? { sku: l.sku, name: l.name, qty: 0, revenue: 0, cost: 0, margin: 0, marginPct: 0 };
        r.qty += l.qty; r.revenue += l.revenue; r.cost += l.cost;
        map.set(l.sku, r);
      }
      return delay({ kind, rows: [...map.values()].map(withMargin).sort((a, b) => b.margin - a.margin) });
    }
    const map = new Map<string, ReportRow>();
    for (const l of lines) {
      const key = periodKey(l.date, period);
      const r = map.get(key) ?? { period: key, revenue: 0, cost: 0, margin: 0, marginPct: 0 };
      r.revenue += l.revenue; r.cost += l.cost;
      map.set(key, r);
    }
    return delay({ kind, rows: [...map.values()].map(withMargin).sort((a, b) => a.period.localeCompare(b.period)) });
  },
};

// ---------- helpers ----------
export const PURCHASE_STATUS: Record<PurchaseStatus, string> = { draft: "Чернетка", ordered: "Замовлено", paid: "Оплачено", received: "Отримано" };
export const TASK_STATUS: Record<TaskStatus, string> = { new: "Нове", welding: "Зварювання", grinding: "Шліфовка", painting: "Фарбування", assembly: "Збірка", done: "Готово" };
export const TASK_ORDER: TaskStatus[] = ["new", "welding", "grinding", "painting", "assembly", "done"];

export type ReportPeriod = "month" | "quarter" | "year";
export type OrderReportRow = { orderId: string; date: string; buyer: string; revenue: number; cost: number; margin: number; marginPct: number };
export type ProductReportRow = { sku: string; name: string; qty: number; revenue: number; cost: number; margin: number; marginPct: number };
export type ReportResult =
  | { kind: "orders"; rows: OrderReportRow[] }
  | { kind: "products"; rows: ProductReportRow[] }
  | { kind: "periods"; rows: ReportRow[] };
export type AssemblyLine = { sku: string; name: string; qty: number; consumed: FifoConsumption[]; cost: number; shortage: number };
export type AssemblyEstimate = { lines: AssemblyLine[]; materialsCost: number; extraCost: number; unitCost: number };

function today() { return new Date().toISOString().slice(0, 10); }
function log(action: string, details: string) {
  db.journal.push({ ts: new Date().toISOString().slice(0, 19), user: "Власник", action, details });
}
function sumItems(items: { qty: number; price: number }[]) {
  return Math.round(items.reduce((s, i) => s + i.qty * i.price, 0) * 100) / 100;
}
function validateItems(items: { sku: string; qty: number; price: number }[]) {
  if (!items.length) throw new Error("Додайте хоча б одну позицію");
  for (const i of items) {
    if (!i.sku.trim()) throw new Error("Вкажіть артикул для всіх позицій");
    if (!(i.qty > 0)) throw new Error("Кількість має бути більше 0");
    if (!(i.price >= 0)) throw new Error("Ціна не може бути від'ємною");
  }
}
export function validateSpec(spec: Specification): string | null {
  if (!spec.productSku.trim() || !spec.productName.trim()) return "Вкажіть артикул і назву виробу";
  if (!spec.components.length) return "Додайте хоча б один компонент";
  const seen = new Set<string>();
  for (const c of spec.components) {
    if (!c.sku.trim()) return "Артикул компонента не може бути порожнім";
    if (seen.has(c.sku)) return `Компонент ${c.sku} повторюється`;
    if (c.sku === spec.productSku) return "Виріб не може бути власним компонентом";
    if (!(c.qty >= 1)) return "Кількість компонента має бути ≥ 1";
    seen.add(c.sku);
  }
  return null;
}
function withMaterials(t: ProductionTask): ProductionTask {
  const spec = db.specifications.find((s) => s.productSku === t.productSku);
  return { ...t, materials: (spec?.components ?? []).map((c) => ({ sku: c.sku, name: c.name, need: c.qty * t.qty, have: productBySku(c.sku)?.stock ?? 0 })) };
}
function estimate(t: ProductionTask): AssemblyEstimate {
  const spec = db.specifications.find((s) => s.productSku === t.productSku);
  const lines: AssemblyLine[] = (spec?.components ?? []).map((c) => {
    const qty = c.qty * t.qty;
    const r = consumeFifo(db.batches, c.sku, qty);
    return { sku: c.sku, name: c.name, qty, consumed: r.consumed, cost: r.totalCost, shortage: r.shortage };
  });
  const materialsCost = lines.reduce((s, l) => s + l.cost, 0);
  const extraCost = t.extraCosts.reduce((s, e) => s + e.amount, 0);
  return { lines, materialsCost, extraCost, unitCost: Math.round(((materialsCost + extraCost) / t.qty) * 100) / 100 };
}
function salesLines() {
  const pool = structuredClone(db.salesBatches);
  const out: { orderId: string; date: string; buyer: string; sku: string; name: string; qty: number; revenue: number; cost: number }[] = [];
  for (const s of [...db.sales].sort((a, b) => a.date.localeCompare(b.date))) {
    for (const i of s.items) {
      const r = consumeFifo(pool, i.sku, i.qty);
      for (const c of r.consumed) { const b = pool.find((x) => x.id === c.batchId); if (b) b.qtyRemaining -= c.qty; }
      const fallback = r.shortage * (productBySku(i.sku)?.cost ?? 0);
      out.push({ orderId: s.id, date: s.date, buyer: s.buyer, sku: i.sku, name: i.name, qty: i.qty, revenue: i.qty * i.price, cost: r.totalCost + fallback });
    }
  }
  return out;
}
function withMargin<T extends { revenue: number; cost: number; margin: number; marginPct: number }>(r: T): T {
  const margin = r.revenue - r.cost;
  return { ...r, margin, marginPct: r.revenue ? (margin / r.revenue) * 100 : 0 };
}
const MONTHS = ["січ", "лют", "бер", "кві", "тра", "чер", "лип", "сер", "вер", "жов", "лис", "гру"];
export function periodKey(date: string, period: ReportPeriod) {
  const y = date.slice(0, 4), m = Number(date.slice(5, 7));
  if (period === "year") return y;
  if (period === "quarter") return `${y} Q${Math.ceil(m / 3)}`;
  return `${y}-${String(m).padStart(2, "0")}`;
}
export function periodLabel(key: string) {
  const m = key.match(/^(\d{4})-(\d{2})$/);
  if (m) return `${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
  return key.replace("Q", "кв. ");
}
