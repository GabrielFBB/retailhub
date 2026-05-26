import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/lib/models/Product";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    await connectDB();
    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Produto não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID inválido." }, { status: 400 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const sku = typeof body.sku === "string" ? body.sku.trim() : "";
    const price = Number(body.price);
    const stock = Number(body.stock);

    if (!name || !sku) {
      return NextResponse.json(
        { error: "Nome e SKU são obrigatórios." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Preço inválido." }, { status: 400 });
    }

    if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
      return NextResponse.json(
        { error: "Stock inválido (use número inteiro)." },
        { status: 400 }
      );
    }

    await connectDB();
    const updated = await Product.findByIdAndUpdate(
      id,
      { name, sku, price, stock },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Produto não encontrado." },
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
      (error as any).code === 11000
    ) {
      return NextResponse.json(
        { error: "Já existe um produto com este SKU." },
        { status: 409 }
      );
    }

    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
