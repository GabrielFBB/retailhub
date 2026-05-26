import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import {
  createSessionToken,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e palavra-passe são obrigatórios." },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email }).lean();

    if (!user) {
      return NextResponse.json(
        { error: "Email ou palavra-passe incorretos." },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Email ou palavra-passe incorretos." },
        { status: 401 }
      );
    }

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
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
