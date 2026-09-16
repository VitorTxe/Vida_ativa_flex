import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { usuarios } from "@/db/schema";
import { createSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/app-auth";
import { hashPassword, verifyPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { email?: unknown; senha?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const senha = typeof body?.senha === "string" ? body.senha : "";
  if (!email || !senha || senha.length > 128) {
    return invalidCredentials();
  }

  const db = getDb();
  const [user] = await db.select().from(usuarios).where(eq(usuarios.email, email)).limit(1);
  if (!user?.senhaHash) {
    await hashPassword(senha);
    return invalidCredentials();
  }

  const valid = await verifyPassword(senha, user.senhaHash);
  if (!valid) return invalidCredentials();
  if (user.statusPagamento !== "Ativo") {
    return NextResponse.json({ error: "Sua assinatura está inativa. Fale com o suporte." }, { status: 403 });
  }

  const session = await createSession(user.idAluno);
  const response = NextResponse.json({
    user: {
      idAluno: user.idAluno,
      nome: user.nome,
      email: user.email,
      statusPagamento: user.statusPagamento,
      objetivo: user.objetivo,
    },
  });
  response.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions(session.expires));
  return response;
}

function invalidCredentials() {
  return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
}
