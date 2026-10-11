import { describe, expect, it } from "vitest";
import { api } from "@/lib/api";

describe("Мінімальні залишки", () => {
  it("зберігає новий поріг", async () => {
    const p = await api.updateMinStock("05002", 500);
    expect(p.minStock).toBe(500);
    expect(p.stock < p.minStock).toBe(true); // 410 < 500 → нижче мінімуму
  });
  it("відхиляє від'ємне значення", async () => {
    await expect(api.updateMinStock("05002", -1)).rejects.toThrow();
  });
});
