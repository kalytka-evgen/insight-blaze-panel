// All mock data lives here. Replace with real backend later.
import type { Contractor, CustomerOrder, JournalEntry, Payment, Product, ProductionTask, Purchase, Receipt, ShipmentOrder, Specification, StockBatch } from "./types";

export const products: Product[] = [
  // Сталеві мішені (готові вироби)
  { sku: "gerts.020", name: "Мішень гонг «Тарілка 200х300»", category: "СТАЛЬНІ МІШЕНІ", unit: "шт", stock: 3, minStock: 5, cost: 0 },
  { sku: "gerts.021", name: "Мішень гонг «Коло 250»", category: "СТАЛЬНІ МІШЕНІ", unit: "шт", stock: 6, minStock: 4, cost: 0 },
  { sku: "gerts.035", name: "Мішень «Поппер IPSC»", category: "СТАЛЬНІ МІШЕНІ", unit: "шт", stock: 1, minStock: 3, cost: 0 },
  { sku: "gerts.040", name: "Стійка під мішень «Тринога»", category: "СТАЛЬНІ МІШЕНІ", unit: "шт", stock: 2, minStock: 4, cost: 0 },
  // Картонні та паперові
  { sku: "05001", name: "Мішень картонна IPSC «Класика»", category: "КАРТОННІ МІШЕНІ", unit: "шт", stock: 240, minStock: 300, cost: 18.5 },
  { sku: "05002", name: "Мішень картонна «Мініпоппер»", category: "КАРТОННІ МІШЕНІ", unit: "шт", stock: 410, minStock: 200, cost: 12.0 },
  { sku: "06010", name: "Мішень паперова №4 (50 шт)", category: "ПАПЕРОВІ МІШЕНІ", unit: "пач", stock: 14, minStock: 20, cost: 95.0 },
  { sku: "06011", name: "Мішень паперова «Грудна» №6", category: "ПАПЕРОВІ МІШЕНІ", unit: "пач", stock: 30, minStock: 15, cost: 110.0 },
  { sku: "07100", name: "Пластирі для мішеней (1000 шт)", category: "ІНШЕ", unit: "рул", stock: 8, minStock: 10, cost: 145.0 },
  // Комплектуючі
  { sku: "hard10-n31", name: "Лист сталі Hardox 10 мм, 200х300", category: "КОМПЛЕКТУЮЧІ", unit: "шт", stock: 4, minStock: 6, cost: 820.0 },
  { sku: "hard10-n32", name: "Лист сталі Hardox 10 мм, коло 250", category: "КОМПЛЕКТУЮЧІ", unit: "шт", stock: 2, minStock: 4, cost: 760.0 },
  { sku: "hard8-p10", name: "Лист сталі Hardox 8 мм, поппер", category: "КОМПЛЕКТУЮЧІ", unit: "шт", stock: 0, minStock: 3, cost: 940.0 },
  { sku: "kr-0810", name: "Кронштейн підвісний 8х100", category: "КОМПЛЕКТУЮЧІ", unit: "шт", stock: 12, minStock: 20, cost: 65.0 },
  { sku: "bolt-m10", name: "Болт М10х40 з гайкою", category: "КОМПЛЕКТУЮЧІ", unit: "шт", stock: 85, minStock: 100, cost: 6.4 },
  { sku: "trub-40", name: "Труба профільна 40х40, 1 м", category: "КОМПЛЕКТУЮЧІ", unit: "шт", stock: 9, minStock: 12, cost: 210.0 },
  { sku: "farba-rd", name: "Фарба порошкова червона, 1 кг", category: "КОМПЛЕКТУЮЧІ", unit: "кг", stock: 3, minStock: 5, cost: 380.0 },
  { sku: "lanc-6", name: "Ланцюг оцинкований 6 мм, 1 м", category: "КОМПЛЕКТУЮЧІ", unit: "м", stock: 40, minStock: 30, cost: 48.0 },
];

export const specifications: Specification[] = [
  { productSku: "gerts.020", productName: "Мішень гонг «Тарілка 200х300»", components: [
    { sku: "hard10-n31", name: "Лист сталі Hardox 10 мм, 200х300", qty: 1 },
    { sku: "kr-0810", name: "Кронштейн підвісний 8х100", qty: 2 },
    { sku: "bolt-m10", name: "Болт М10х40 з гайкою", qty: 4 },
    { sku: "farba-rd", name: "Фарба порошкова червона, 1 кг", qty: 1 },
  ] },
  { productSku: "gerts.021", productName: "Мішень гонг «Коло 250»", components: [
    { sku: "hard10-n32", name: "Лист сталі Hardox 10 мм, коло 250", qty: 1 },
    { sku: "lanc-6", name: "Ланцюг оцинкований 6 мм, 1 м", qty: 2 },
    { sku: "bolt-m10", name: "Болт М10х40 з гайкою", qty: 2 },
  ] },
  { productSku: "gerts.035", productName: "Мішень «Поппер IPSC»", components: [
    { sku: "hard8-p10", name: "Лист сталі Hardox 8 мм, поппер", qty: 1 },
    { sku: "trub-40", name: "Труба профільна 40х40, 1 м", qty: 1 },
    { sku: "bolt-m10", name: "Болт М10х40 з гайкою", qty: 6 },
  ] },
  { productSku: "gerts.040", productName: "Стійка під мішень «Тринога»", components: [
    { sku: "trub-40", name: "Труба профільна 40х40, 1 м", qty: 3 },
    { sku: "bolt-m10", name: "Болт М10х40 з гайкою", qty: 6 },
  ] },
];

export const customerOrders: CustomerOrder[] = [
  { id: "4581", buyer: "Стрілецький клуб «Яструб»", tender: false, items: [{ sku: "gerts.020", qty: 4 }, { sku: "05001", qty: 200 }] },
  { id: "4587", buyer: "ТОВ «Полігон-Схід»", tender: true, items: [{ sku: "gerts.035", qty: 6 }, { sku: "gerts.040", qty: 6 }] },
  { id: "4592", buyer: "Іван Петренко", tender: false, items: [{ sku: "gerts.021", qty: 2 }, { sku: "06010", qty: 10 }] },
  { id: "4598", buyer: "ФОП Коваленко О. В.", tender: false, items: [{ sku: "07100", qty: 6 }, { sku: "05001", qty: 150 }] },
  { id: "4603", buyer: "В/ч А1234", tender: true, items: [{ sku: "gerts.020", qty: 8 }, { sku: "06010", qty: 20 }] },
];

export const contractors: Contractor[] = [
  { id: "c1", name: "Севенмітал", phone: "+380 67 123 45 67", balance: 18450 },
  { id: "c2", name: "Крепіж-Маркет", phone: "+380 50 222 33 44", balance: -1200 },
  { id: "c3", name: "ПолімерКолор", phone: "+380 63 777 10 20", balance: 3800 },
  { id: "c4", name: "Картон-Друк", phone: "+380 44 501 02 03", balance: 0 },
];

export const purchases: Purchase[] = [
  { id: "p1", number: "СФ-1024", contractorId: "c1", date: "2026-09-28", status: "ordered", expectedDate: "2026-10-14", comment: "Терміново під тендер", items: [{ sku: "hard8-p10", name: "Лист сталі Hardox 8 мм, поппер", qty: 6, price: 940 }, { sku: "hard10-n31", name: "Лист сталі Hardox 10 мм, 200х300", qty: 5, price: 820 }], total: 6 * 940 + 5 * 820 },
  { id: "p2", number: "КМ-556", contractorId: "c2", date: "2026-10-02", status: "paid", expectedDate: "2026-10-09", comment: "", items: [{ sku: "bolt-m10", name: "Болт М10х40 з гайкою", qty: 200, price: 6.4 }], total: 1280 },
  { id: "p3", number: "ПК-88", contractorId: "c3", date: "2026-10-05", status: "ordered", expectedDate: "2026-10-16", comment: "Фарба RAL 3020", items: [{ sku: "farba-rd", name: "Фарба порошкова червона, 1 кг", qty: 10, price: 380 }], total: 3800 },
  { id: "p4", number: "СФ-1001", contractorId: "c1", date: "2026-09-10", status: "received", expectedDate: "2026-09-18", comment: "", items: [{ sku: "trub-40", name: "Труба профільна 40х40, 1 м", qty: 20, price: 210 }], total: 4200 },
];

export const payments: Payment[] = [
  { id: "pay1", contractorId: "c1", amount: 4200, date: "2026-09-19", comment: "Оплата СФ-1001" },
  { id: "pay2", contractorId: "c2", amount: 2480, date: "2026-10-03", comment: "Передоплата КМ-556" },
];

export const batches: StockBatch[] = [
  { id: "b1", sku: "hard10-n31", name: "Лист сталі Hardox 10 мм, 200х300", date: "2026-08-12", qtyInitial: 6, qtyRemaining: 2, unitCost: 790, source: "Прихід ПР-031" },
  { id: "b2", sku: "hard10-n31", name: "Лист сталі Hardox 10 мм, 200х300", date: "2026-09-20", qtyInitial: 4, qtyRemaining: 2, unitCost: 820, source: "Прихід ПР-044" },
  { id: "b3", sku: "kr-0810", name: "Кронштейн підвісний 8х100", date: "2026-07-30", qtyInitial: 30, qtyRemaining: 12, unitCost: 62, source: "Прихід ПР-027" },
  { id: "b4", sku: "bolt-m10", name: "Болт М10х40 з гайкою", date: "2026-08-01", qtyInitial: 100, qtyRemaining: 35, unitCost: 6.1, source: "Прихід ПР-028" },
  { id: "b5", sku: "bolt-m10", name: "Болт М10х40 з гайкою", date: "2026-09-15", qtyInitial: 50, qtyRemaining: 50, unitCost: 6.4, source: "Прихід ПР-041" },
  { id: "b6", sku: "trub-40", name: "Труба профільна 40х40, 1 м", date: "2026-09-18", qtyInitial: 20, qtyRemaining: 9, unitCost: 210, source: "Прихід ПР-043", purchaseId: "p4" },
  { id: "b7", sku: "hard10-n32", name: "Лист сталі Hardox 10 мм, коло 250", date: "2026-08-25", qtyInitial: 4, qtyRemaining: 2, unitCost: 760, source: "Прихід ПР-035" },
  { id: "b8", sku: "lanc-6", name: "Ланцюг оцинкований 6 мм, 1 м", date: "2026-06-10", qtyInitial: 50, qtyRemaining: 40, unitCost: 48, source: "Прихід ПР-019" },
  { id: "b9", sku: "farba-rd", name: "Фарба порошкова червона, 1 кг", date: "2026-08-05", qtyInitial: 5, qtyRemaining: 3, unitCost: 365, source: "Прихід ПР-029" },
];

export const receipts: Receipt[] = [
  { id: "r1", number: "ПР-043", date: "2026-09-18", contractorId: "c1", purchaseId: "p4", items: [{ sku: "trub-40", name: "Труба профільна 40х40, 1 м", qty: 20, price: 210 }], total: 4200 },
  { id: "r2", number: "ПР-044", date: "2026-09-20", contractorId: "c1", items: [{ sku: "hard10-n31", name: "Лист сталі Hardox 10 мм, 200х300", qty: 4, price: 820 }], total: 3280 },
];

export const productionTasks: ProductionTask[] = [
  { id: "t1", productSku: "gerts.020", productName: "Мішень гонг «Тарілка 200х300»", qty: 4, status: "welding", assignee: "Олег", createdAt: "2026-10-06", extraCosts: [{ name: "Різка лазером", amount: 600 }], materials: [] },
  { id: "t2", productSku: "gerts.035", productName: "Мішень «Поппер IPSC»", qty: 3, status: "new", assignee: "Сергій", createdAt: "2026-10-08", extraCosts: [], materials: [] },
  { id: "t3", productSku: "gerts.040", productName: "Стійка під мішень «Тринога»", qty: 2, status: "painting", assignee: "Олег", createdAt: "2026-10-01", extraCosts: [{ name: "Порошкове фарбування", amount: 450 }], materials: [] },
  { id: "t4", productSku: "gerts.021", productName: "Мішень гонг «Коло 250»", qty: 2, status: "done", assignee: "Сергій", createdAt: "2026-09-25", extraCosts: [], materials: [], unitCost: 1012 },
];

export const shipments: ShipmentOrder[] = [
  { id: "4570", number: "4570", buyer: "Стрілецький клуб «Яструб»", total: 12600, delivery: "Нова пошта, Київ №12", status: "ready", documents: true, items: [{ sku: "gerts.021", name: "Мішень гонг «Коло 250»", qty: 2, chars: "Червоний, ланцюг" }, { sku: "05002", name: "Мішень картонна «Мініпоппер»", qty: 100 }] },
  { id: "4574", number: "4574", buyer: "ФОП Шевчук М. І.", total: 3480, delivery: "Укрпошта, Львів", status: "ready", documents: false, items: [{ sku: "06011", name: "Мішень паперова «Грудна» №6", qty: 12 }] },
  { id: "4577", number: "4577", buyer: "ТОВ «Тактик-Про»", total: 8900, delivery: "Самовивіз", status: "pack", documents: true, items: [{ sku: "gerts.021", name: "Мішень гонг «Коло 250»", qty: 3, chars: "Білий" }, { sku: "lanc-6", name: "Ланцюг оцинкований 6 мм, 1 м", qty: 6 }] },
  { id: "4579", number: "4579", buyer: "Андрій Мельник", total: 2150, delivery: "Нова пошта, Дніпро №4", status: "pack", documents: false, items: [{ sku: "05002", name: "Мішень картонна «Мініпоппер»", qty: 80 }, { sku: "07100", name: "Пластирі для мішеней (1000 шт)", qty: 2 }] },
];

export const journal: JournalEntry[] = [
  { ts: "2026-10-11T09:42:00", user: "Склад", action: "Прихід", details: "ПР-044: Лист сталі Hardox 10 мм ×4" },
  { ts: "2026-10-10T17:15:00", user: "Власник", action: "Оплата", details: "Крепіж-Маркет — 2 480,00 грн" },
  { ts: "2026-10-10T12:03:00", user: "Склад", action: "Зміна статусу задачі", details: "Стійка «Тринога» ×2 → Фарбування" },
  { ts: "2026-10-09T15:30:00", user: "Власник", action: "Нова закупка", details: "ПК-88 — ПолімерКолор, 3 800,00 грн" },
  { ts: "2026-10-08T10:11:00", user: "Власник", action: "Нова задача", details: "Мішень «Поппер IPSC» ×3" },
  { ts: "2026-10-07T18:44:00", user: "Склад", action: "Відвантаження", details: "Замовлення 4566 — Нова пошта" },
  { ts: "2026-10-06T09:20:00", user: "Власник", action: "Нова задача", details: "Мішень гонг «Тарілка 200х300» ×4" },
  { ts: "2026-10-05T14:02:00", user: "Власник", action: "Зміна мінімального залишку", details: "bolt-m10: 80 → 100" },
  { ts: "2026-10-03T11:47:00", user: "Склад", action: "Збірка", details: "Мішень гонг «Коло 250» ×2, собівартість 1 012,00 грн/шт" },
  { ts: "2026-10-02T16:25:00", user: "Власник", action: "Нова закупка", details: "КМ-556 — Крепіж-Маркет, 1 280,00 грн" },
  { ts: "2026-10-01T08:59:00", user: "Власник", action: "Нова задача", details: "Стійка «Тринога» ×2" },
];

/** Completed sales (for margin reports). Price per unit, UAH. */
export const sales: { id: string; date: string; buyer: string; items: { sku: string; name: string; qty: number; price: number }[] }[] = [
  { id: "4410", date: "2026-05-14", buyer: "Стрілецький клуб «Яструб»", items: [{ sku: "gerts.020", name: "Мішень гонг «Тарілка 200х300»", qty: 2, price: 2400 }, { sku: "05001", name: "Мішень картонна IPSC «Класика»", qty: 100, price: 35 }] },
  { id: "4452", date: "2026-06-03", buyer: "ТОВ «Тактик-Про»", items: [{ sku: "gerts.035", name: "Мішень «Поппер IPSC»", qty: 3, price: 3100 }] },
  { id: "4471", date: "2026-06-21", buyer: "Іван Петренко", items: [{ sku: "06010", name: "Мішень паперова №4 (50 шт)", qty: 6, price: 180 }, { sku: "07100", name: "Пластирі для мішеней (1000 шт)", qty: 2, price: 260 }] },
  { id: "4502", date: "2026-07-09", buyer: "В/ч А1234", items: [{ sku: "gerts.020", name: "Мішень гонг «Тарілка 200х300»", qty: 5, price: 2300 }, { sku: "gerts.040", name: "Стійка під мішень «Тринога»", qty: 5, price: 1500 }] },
  { id: "4528", date: "2026-08-02", buyer: "ФОП Коваленко О. В.", items: [{ sku: "05002", name: "Мішень картонна «Мініпоппер»", qty: 300, price: 24 }] },
  { id: "4549", date: "2026-08-27", buyer: "ТОВ «Полігон-Схід»", items: [{ sku: "gerts.021", name: "Мішень гонг «Коло 250»", qty: 4, price: 2100 }, { sku: "05001", name: "Мішень картонна IPSC «Класика»", qty: 200, price: 34 }] },
  { id: "4566", date: "2026-09-19", buyer: "Андрій Мельник", items: [{ sku: "gerts.035", name: "Мішень «Поппер IPSC»", qty: 1, price: 3200 }, { sku: "06011", name: "Мішень паперова «Грудна» №6", qty: 5, price: 210 }] },
  { id: "4570", date: "2026-10-04", buyer: "Стрілецький клуб «Яструб»", items: [{ sku: "gerts.021", name: "Мішень гонг «Коло 250»", qty: 2, price: 2150 }, { sku: "05002", name: "Мішень картонна «Мініпоппер»", qty: 100, price: 24 }] },
];

/** Historical batches of finished/resale goods consumed by sales (FIFO). */
export const salesBatches: StockBatch[] = [
  { id: "sb1", sku: "gerts.020", name: "Мішень гонг «Тарілка 200х300»", date: "2026-05-01", qtyInitial: 10, qtyRemaining: 10, unitCost: 1290, source: "Збірка" },
  { id: "sb2", sku: "gerts.035", name: "Мішень «Поппер IPSC»", date: "2026-05-20", qtyInitial: 4, qtyRemaining: 4, unitCost: 1480, source: "Збірка" },
  { id: "sb3", sku: "gerts.040", name: "Стійка під мішень «Тринога»", date: "2026-06-25", qtyInitial: 7, qtyRemaining: 7, unitCost: 820, source: "Збірка" },
  { id: "sb4", sku: "gerts.021", name: "Мішень гонг «Коло 250»", date: "2026-08-10", qtyInitial: 4, qtyRemaining: 4, unitCost: 990, source: "Збірка" },
  { id: "sb5", sku: "gerts.021", name: "Мішень гонг «Коло 250»", date: "2026-10-03", qtyInitial: 2, qtyRemaining: 2, unitCost: 1012, source: "Збірка" },
  { id: "sb6", sku: "05001", name: "Мішень картонна IPSC «Класика»", date: "2026-04-10", qtyInitial: 400, qtyRemaining: 400, unitCost: 18.5, source: "Прихід" },
  { id: "sb7", sku: "05002", name: "Мішень картонна «Мініпоппер»", date: "2026-07-15", qtyInitial: 500, qtyRemaining: 500, unitCost: 12, source: "Прихід" },
  { id: "sb8", sku: "06010", name: "Мішень паперова №4 (50 шт)", date: "2026-05-05", qtyInitial: 20, qtyRemaining: 20, unitCost: 95, source: "Прихід" },
  { id: "sb9", sku: "06011", name: "Мішень паперова «Грудна» №6", date: "2026-05-05", qtyInitial: 20, qtyRemaining: 20, unitCost: 110, source: "Прихід" },
  { id: "sb10", sku: "07100", name: "Пластирі для мішеней (1000 шт)", date: "2026-05-05", qtyInitial: 10, qtyRemaining: 10, unitCost: 145, source: "Прихід" },
];
