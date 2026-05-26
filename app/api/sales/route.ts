import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/lib/models/Product";
import { Sale } from "@/lib/models/Sale";

function todayDateKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const productId =
      typeof body.productId === "string" ? body.productId.trim() : "";
    const quantity = Number(body.quantity);

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ error: "Produto inválido." }, { status: 400 });
    }

    if (!Number.isFinite(quantity) || quantity < 1 || !Number.isInteger(quantity)) {
      return NextResponse.json(
        { error: "Quantidade inválida (usa um número inteiro ≥ 1)." },
        { status: 400 }
      );
    }

    await connectDB();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const product = await Product.findById(productId).session(session).lean();

      if (!product) {
        await session.abortTransaction();
        return NextResponse.json(
          { error: "Produto não encontrado." },
          { status: 404 }
        );
      }

      if (product.stock < quantity) {
        await session.abortTransaction();
        return NextResponse.json(
          {
            error: `Stock insuficiente. Disponível: ${product.stock}, pedido: ${quantity}.`,
          },
          { status: 400 }
        );
      }

      const lineTotal = Math.round(product.price * quantity * 100) / 100;
      const date = todayDateKey();

      await Product.findByIdAndUpdate(
        productId,
        { $inc: { stock: -quantity } },
        { session }
      );

      await Sale.findOneAndUpdate(
        { date },
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
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
