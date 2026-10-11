export type Product = { sku: string; name: string; category: string; unit: string; stock: number; minStock: number; cost: number };
export type Component = { sku: string; name: string; qty: number };
export type Specification = { productSku: string; productName: string; components: Component[] };
export type DemandRow = { sku: string; name: string; need: number; stock: number; ordered: number; deficit: number; sources: { orderId: string; qty: number }[]; tender: boolean; isProduct?: boolean; parentSku?: string };
export type DemandGroup = { title: string; rows: DemandRow[] };
export type Contractor = { id: string; name: string; phone: string; balance: number };
export type PurchaseItem = { sku: string; name: string; qty: number; price: number };
export type PurchaseStatus = "draft" | "ordered" | "paid" | "received";
export type Purchase = { id: string; number: string; contractorId: string; date: string; items: PurchaseItem[]; total: number; status: PurchaseStatus; expectedDate: string; comment: string };
export type Payment = { id: string; contractorId: string; amount: number; date: string; comment: string };
export type ExtraCost = { name: string; amount: number };
export type TaskStatus = "new" | "welding" | "grinding" | "painting" | "assembly" | "done";
export type ProductionTask = { id: string; productSku: string; productName: string; qty: number; status: TaskStatus; assignee: string; createdAt: string; extraCosts: ExtraCost[]; materials: { sku: string; name: string; need: number; have: number }[]; unitCost?: number };
export type ShipmentOrder = { id: string; number: string; buyer: string; total: number; delivery: string; status: "ready" | "pack"; items: { sku: string; name: string; qty: number; chars?: string }[]; documents: boolean };
export type JournalEntry = { ts: string; user: string; action: string; details: string };
export type StockBatch = { id: string; sku: string; name: string; date: string; qtyInitial: number; qtyRemaining: number; unitCost: number; source: string; purchaseId?: string };
export type Receipt = { id: string; number: string; date: string; contractorId: string; purchaseId?: string; items: { sku: string; name: string; qty: number; price: number }[]; total: number };
export type ReportRow = { period: string; revenue: number; cost: number; margin: number; marginPct: number };

/** Customer order (CRM) used to compute demand */
export type CustomerOrder = { id: string; buyer: string; items: { sku: string; qty: number }[]; tender: boolean };

export type Summary = { deficitValue: number; activeTasks: number; supplierDebt: number; readyToShip: number; toPack: number };
