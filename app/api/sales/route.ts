import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/lib/models/Product";
import { Sale } from "@/lib/models/Sale";
import { requireUser } from "@/lib/api-auth";

function todayDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function isValidDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + "T12:00:00");
  return !Number.isNaN(d.getTime());
}

export async function GET() {
  const { userId, response } = await requireUser();
  if (response) return response;

  try {
    await connectDB();
    const sales = await Sale.find({ user: userId })
      .sort({ date: -1 })
      .limit(60)
      .lean();

    return NextResponse.json(
      sales.map((s) => ({
        id: s._id.toString(),
        date: s.date,
        total: s.total,
      }))
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Ocorreu um erro no servidor. Tenta novamente." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { userId, response } = await requireUser();
  if (response) return response;

  try {
    const body = await request.json();
    const productId =
      typeof body.productId === "string" ? body.productId.trim() : "";
    const quantity = Number(body.quantity);

    const today = todayDateKey();
    const date =
      typeof body.date === "string" && body.date.trim() !== ""
        ? body.date.trim()
        : today;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ error: "Produto invalido." }, { status: 400 });
    }

    if (!Number.isFinite(quantity) || quantity < 1 || !Number.isInteger(quantity)) {
      return NextResponse.json(
        { error: "Quantidade invalida (usa um numero inteiro maior que zero)." },
        { status: 400 }
      );
    }

    if (!isValidDateKey(date)) {
      return NextResponse.json({ error: "Data invalida." }, { status: 400 });
    }

    if (date > today) {
      return NextResponse.json(
        { error: "Nao podes registar uma venda numa data futura." },
        { status: 400 }
      );
    }

    await connectDB();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const product = await Product.findOne({ _id: productId, user: userId })
        .session(session)
        .lean();

      if (!product) {
        await session.abortTransaction();
        return NextResponse.json(
          { error: "Produto nao encontrado." },
          { status: 404 }
        );
      }

      if (product.stock < quantity) {
        await session.abortTransaction();
        return NextResponse.json(
          {
            error: `Stock insuficiente. Disponivel: ${product.stock}, pedido: ${quantity}.`,
          },
          { status: 400 }
        );
      }

      const lineTotal = Math.round(product.price * quantity * 100) / 100;

      await Product.findOneAndUpdate(
        { _id: productId, user: userId },
        { $inc: { stock: -quantity } },
        { session }
      );

      await Sale.findOneAndUpdate(
        { user: userId, date },
        { $inc: { total: lineTotal } },
        { upsert: true, new: true, session }
      );

      await session.commitTransaction();

      return NextResponse.json({
        ok: true,
        date,
        lineTotal,
        productName: product.name,
        quantity,
        newStock: product.stock - quantity,
      });
    } catch (inner) {
      await session.abortTransaction();
      throw inner;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Ocorreu um erro no servidor. Tenta novamente." },
      { status: 500 }
    );
  }
}
