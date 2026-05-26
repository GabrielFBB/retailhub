import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/lib/models/Product";

function serializeProduct(doc: {
  _id: { toString(): string };
  name: string;
  price: number;
  stock: number;
  sku: string;
}) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    price: doc.price,
    stock: doc.stock,
    sku: doc.sku,
  };
}

export async function GET() {
  try {
    await connectDB();
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(products.map(serializeProduct));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const sku = typeof body.sku === "string" ? body.sku.trim() : "";
    const price = Number(body.price);
    const stock = parseInt(String(body.stock), 10);

    if (!name || !sku) {
      return NextResponse.json(
        { error: "Nome e SKU são obrigatórios." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { error: "Preço inválido." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(stock) || stock < 0) {
      return NextResponse.json(
        { error: "Stock inválido (use número inteiro, ex: 10)." },
        { status: 400 }
      );
    }

    const product = await Product.create({ name, sku, price, stock });
    return NextResponse.json(serializeProduct(product), { status: 201 });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
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
