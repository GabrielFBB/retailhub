import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * Devolve o id do utilizador autenticado, ou uma resposta 401.
 * Todas as rotas de dados devem comecar por aqui.
 */
export async function requireUser() {
  const session = await getSession();
  if (!session) {
    return {
      userId: null,
      response: NextResponse.json(
        { error: "Nao autenticado." },
        { status: 401 }
      ),
    };
  }
  return { userId: session.userId, response: null };
}
