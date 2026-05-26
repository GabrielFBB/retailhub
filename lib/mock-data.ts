export type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku: string;
};

export type DailySale = {
  date: string;
  total: number;
};

export const mockProducts: Product[] = [
  { id: "1", name: "Camisola Básica", price: 19.99, stock: 42, sku: "CAM-001" },
  { id: "2", name: "Calças Jeans", price: 49.9, stock: 8, sku: "CAL-002" },
  { id: "3", name: "Ténis Running", price: 89.0, stock: 3, sku: "TEN-003" },
  { id: "4", name: "Casaco Inverno", price: 120.0, stock: 15, sku: "CAS-004" },
];

export const mockDailySales: DailySale[] = [
  { date: "2026-05-15", total: 1240 },
  { date: "2026-05-16", total: 980 },
  { date: "2026-05-17", total: 1560 },
  { date: "2026-05-18", total: 1120 },
  { date: "2026-05-19", total: 1890 },
  { date: "2026-05-20", total: 1430 },
  { date: "2026-05-21", total: 1675 },
];
