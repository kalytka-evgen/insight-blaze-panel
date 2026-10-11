import { describe, expect, it } from "vitest";
import { api } from "@/lib/api";

describe("Потреба", () => {
  it("До замовлення = max(потрібно, мін. залишок) − на складі − замовлено", async () => {
    const rows = (await api.getDemand()).flatMap((g) => g.rows);
    // gerts.020: need 12 (4+8), min 5, stock 3, ordered 0 → 9
    expect(rows.find((r) => r.sku === "gerts.020" && r.isProduct)?.deficit).toBe(9);
    // 06011: need 0, min 15, stock 30 → -15 (no deficit)
    expect(rows.find((r) => r.sku === "06011")?.deficit).toBe(-15);
  });

  it("створює задачі лише для виробів зі специфікацією, кількість = дефіцит", async () => {
    const n = await api.createProductionTasksFromDemand([{ sku: "gerts.020", qty: 9 }, { sku: "05001", qty: 110 }]);
    expect(n).toBe(1);
  });
});
