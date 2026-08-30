import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/lib/models/Product";
import { Sale } from "@/lib/models/Sale";
import { requireUser } from "@/lib/api-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { userId, response } = await requireUser();
  if (response) return response;

  try {
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID invalido." }, { status: 400 });
    }

    const body = await request.json();
    const quantity = Number(body.quantity);

    if (!Number.isFinite(quantity) || quantity < 1 || !Number.isInteger(quantity)) {
      return NextResponse.json(
        { error: "Quantidade invalida (usa um numero inteiro maior que zero)." },
        { status: 400 }
      );
    }

    await connectDB();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const sale = await Sale.findOne({ _id: id, user: userId })
        .session(session)
        .lean();

      if (!sale) {
        await session.abortTransaction();
        return NextResponse.json(
          { error: "Venda nao encontrada." },
          { status: 404 }
        );
      }

      // a diferenca diz quanto stock tirar ou devolver
      const delta = quantity - sale.quantity;

      if (delta !== 0) {
        const product = await Product.findOne({ _id: sale.product, user: userId })
          .session(session)
          .lean();

        if (!product) {
          await session.abortTransaction();
          return NextResponse.json(
            { error: "O produto desta venda ja nao existe." },
            { status: 404 }
          );
        }

        if (delta > 0 && product.stock < delta) {
          await session.abortTransaction();
          return NextResponse.json(
            {
              error: `Stock insuficiente para aumentar a venda. Disponivel: ${product.stock}, necessario: ${delta}.`,
            },
            { status: 400 }
          );
        }

        await Product.findOneAndUpdate(
          { _id: sale.product, user: userId },
          { $inc: { stock: -delta } },
          { session }
        );
      }

      const total = Math.round(sale.unitPrice * quantity * 100) / 100;

      await Sale.updateOne(
        { _id: id, user: userId },
        { quantity, total },
        { session }
      );

      await session.commitTransaction();

      return NextResponse.json({ ok: true, quantity, total });
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

export async function DELETE(_request: Request, context: RouteContext) {
  const { userId, response } = await requireUser();
  if (response) return response;

  try {
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID invalido." }, { status: 400 });
    }

    await connectDB();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const sale = await Sale.findOne({ _id: id, user: userId })
        .session(session)
        .lean();

      if (!sale) {
        await session.abortTransaction();
        return NextResponse.json(
          { error: "Venda nao encontrada." },
          { status: 404 }
        );
      }

      // devolver o stock ao produto, se ainda existir
      await Product.findOneAndUpdate(
        { _id: sale.product, user: userId },
        { $inc: { stock: sale.quantity } },
        { session }
      );

      await Sale.deleteOne({ _id: id, user: userId }).session(session);

      await session.commitTransaction();

      return NextResponse.json({ ok: true, restoredStock: sale.quantity });
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
