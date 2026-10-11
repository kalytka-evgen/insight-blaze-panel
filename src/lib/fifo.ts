import type { StockBatch } from "./types";

export type FifoConsumption = { batchId: string; date: string; qty: number; unitCost: number; cost: number };
export type FifoResult = { consumed: FifoConsumption[]; totalCost: number; shortage: number };

/** Single source of truth for FIFO: oldest batches are consumed first. Does not mutate input. */
export function consumeFifo(batches: StockBatch[], sku: string, qty: number): FifoResult {
  const sorted = batches.filter((b) => b.sku === sku && b.qtyRemaining > 0).sort((a, b) => a.date.localeCompare(b.date));
  let left = qty;
  const consumed: FifoConsumption[] = [];
  for (const b of sorted) {
    if (left <= 0) break;
    const take = Math.min(left, b.qtyRemaining);
    consumed.push({ batchId: b.id, date: b.date, qty: take, unitCost: b.unitCost, cost: take * b.unitCost });
    left -= take;
  }
  return { consumed, totalCost: consumed.reduce((s, c) => s + c.cost, 0), shortage: Math.max(0, left) };
}
