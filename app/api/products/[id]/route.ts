import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/lib/models/Product";
import { requireUser } from "@/lib/api-auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { userId, response } = await requireUser();
  if (response) return response;

  try {
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID invalido." }, { status: 400 });
    }

    await connectDB();
    // o filtro pelo utilizador vai na query: um produto de outra conta
    // simplesmente nao existe do ponto de vista desta sessao
    const deleted = await Product.findOneAndDelete({ _id: id, user: userId });

    if (!deleted) {
      return NextResponse.json(
        { error: "Produto nao encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Ocorreu um erro no servidor. Tenta novamente." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { userId, response } = await requireUser();
  if (response) return response;

  try {
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID invalido." }, { status: 400 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const sku = typeof body.sku === "string" ? body.sku.trim() : "";
    const price = Number(body.price);
    const stock = Number(body.stock);

    if (!name || !sku) {
      return NextResponse.json(
        { error: "Nome e SKU sao obrigatorios." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Preco invalido." }, { status: 400 });
    }

    if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
      return NextResponse.json(
        { error: "Stock invalido (use numero inteiro)." },
        { status: 400 }
      );
    }

    await connectDB();
    const updated = await Product.findOneAndUpdate(
      { _id: id, user: userId },
      { name, sku, price, stock },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Produto nao encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: updated._id.toString(),
      name: updated.name,
      sku: updated.sku,
      price: updated.price,
      stock: updated.stock,
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      return NextResponse.json(
        { error: "Ja tens um produto com este SKU." },
        { status: 409 }
      );
    }

    console.error(error);
    return NextResponse.json(
      { error: "Ocorreu um erro no servidor. Tenta novamente." },
      { status: 500 }
    );
  }
}
