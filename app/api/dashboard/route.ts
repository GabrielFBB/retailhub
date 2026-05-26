import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/lib/models/Product";
import { Sale } from "@/lib/models/Sale";

const DEFAULT_TOTALS = [1240, 980, 1560, 1120, 1890, 1430, 1675];

function last7DayStrings() {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

async function seedSalesIfEmpty() {
  const count = await Sale.countDocuments();
  if (count > 0) return;

  const days = last7DayStrings();
  await Sale.insertMany(
    days.map((date, index) => ({
      date,
      total: DEFAULT_TOTALS[index] ?? 1000,
    }))
  );
}

export async function GET() {
  try {
    await connectDB();
    await seedSalesIfEmpty();

    const days = last7DayStrings();
    const salesDocs = await Sale.find({ date: { $in: days } }).lean();
    const salesByDate = new Map(salesDocs.map((s) => [s.date, s.total]));

    const dailySales = days.map((date) => ({
      date,
      total: salesByDate.get(date) ?? 0,
    }));

    const totalWeek = dailySales.reduce((acc, s) => acc + s.total, 0);
    const today = days[days.length - 1];
    const todayTotal = salesByDate.get(today) ?? 0;

    const lowStockProducts = await Product.find({ stock: { $lt: 10 } })
      .sort({ stock: 1 })
      .lean();

    const alerts = lowStockProducts.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      sku: p.sku,
      stock: p.stock,
    }));

    return NextResponse.json({
      dailySales,
      totalWeek,
      todayTotal,
      lowStockCount: alerts.length,
      alerts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
