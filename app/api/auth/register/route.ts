import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import {
  createSessionToken,
  hashPassword,
  sessionCookieOptions,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nome, email e palavra-passe são obrigatórios." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A palavra-passe deve ter pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json(
        { error: "Já existe uma conta com este email." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({ name, email, passwordHash });

    const token = await createSessionToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      ok: true,
      user: { email: user.email, name: user.name },
    });
    response.cookies.set(sessionCookieOptions(token));

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Ocorreu um erro no servidor. Tenta novamente." },
      { status: 500 }
    );
  }
}
