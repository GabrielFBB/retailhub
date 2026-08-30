import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/lib/models/Product";
import { Sale } from "@/lib/models/Sale";
import { requireUser } from "@/lib/api-auth";

const LOW_STOCK_THRESHOLD = 10;

function last7DayStrings() {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export async function GET() {
  const { userId, response } = await requireUser();
  if (response) return response;

  try {
    await connectDB();

    const days = last7DayStrings();

    // agregar os totais por dia: agora cada venda e um registo proprio
    const grouped = await Sale.aggregate([
      { $match: { user: new (await import("mongoose")).default.Types.ObjectId(userId), date: { $in: days } } },
      { $group: { _id: "$date", total: { $sum: "$total" } } },
    ]);

    const salesByDate = new Map<string, number>(
      grouped.map((g: { _id: string; total: number }) => [g._id, g.total])
    );

    const dailySales = days.map((date) => ({
      date,
      total: Math.round((salesByDate.get(date) ?? 0) * 100) / 100,
    }));

    const totalWeek =
      Math.round(dailySales.reduce((acc, s) => acc + s.total, 0) * 100) / 100;
    const today = days[days.length - 1];
    const todayTotal = salesByDate.get(today) ?? 0;

    const lowStockProducts = await Product.find({
      user: userId,
      stock: { $lt: LOW_STOCK_THRESHOLD },
    })
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
      todayTotal: Math.round(todayTotal * 100) / 100,
      lowStockCount: alerts.length,
      alerts,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Ocorreu um erro no servidor. Tenta novamente." },
      { status: 500 }
    );
  }
}
