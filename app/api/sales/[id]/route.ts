import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
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
    const total = Number(body.total);

    if (!Number.isFinite(total) || total < 0) {
      return NextResponse.json({ error: "Total invalido." }, { status: 400 });
    }

    await connectDB();
    const updated = await Sale.findOneAndUpdate(
      { _id: id, user: userId },
      { total: Math.round(total * 100) / 100 },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Registo nao encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: updated._id.toString(),
      date: updated.date,
      total: updated.total,
    });
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
    const deleted = await Sale.findOneAndDelete({ _id: id, user: userId });

    if (!deleted) {
      return NextResponse.json(
        { error: "Registo nao encontrado." },
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
