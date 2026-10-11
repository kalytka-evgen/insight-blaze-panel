import { describe, expect, it } from "vitest";
import { consumeFifo } from "@/lib/fifo";
import { api, validateSpec } from "@/lib/api";
import type { StockBatch } from "@/lib/types";

const b = (id: string, date: string, qty: number, cost: number): StockBatch => ({ id, sku: "x", name: "x", date, qtyInitial: qty, qtyRemaining: qty, unitCost: cost, source: "" });

describe("FIFO", () => {
  it("списує найстаріші партії першими", () => {
    const r = consumeFifo([b("new", "2026-09-01", 10, 20), b("old", "2026-01-01", 3, 10)], "x", 5);
    expect(r.consumed.map((c) => c.batchId)).toEqual(["old", "new"]);
    expect(r.totalCost).toBe(3 * 10 + 2 * 20);
    expect(r.shortage).toBe(0);
  });
  it("показує нестачу", () => {
    expect(consumeFifo([b("a", "2026-01-01", 2, 5)], "x", 5).shortage).toBe(3);
  });
});

describe("Специфікації", () => {
  it("відхиляє дубль артикула і кількість < 1", () => {
    const base = { productSku: "p", productName: "П" };
    expect(validateSpec({ ...base, components: [{ sku: "a", name: "a", qty: 1 }, { sku: "a", name: "a", qty: 1 }] })).not.toBeNull();
    expect(validateSpec({ ...base, components: [{ sku: "a", name: "a", qty: 0 }] })).not.toBeNull();
    expect(validateSpec({ ...base, components: [{ sku: "a", name: "a", qty: 2 }] })).toBeNull();
  });
});

describe("Взаєморозрахунки", () => {
  it("оплата зменшує борг постачальнику", async () => {
    const before = (await api.getContractors()).find((c) => c.id === "c1")!.balance;
    await api.addPayment({ contractorId: "c1", amount: 1000, date: "2026-10-11", comment: "" });
    expect((await api.getContractors()).find((c) => c.id === "c1")!.balance).toBe(before - 1000);
  });
});

describe("Виробництво", () => {
  it("не можна перевести в «Готово» без збірки", async () => {
    await expect(api.moveTask("t2", "done")).rejects.toThrow();
  });
});
