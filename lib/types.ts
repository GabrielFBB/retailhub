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
