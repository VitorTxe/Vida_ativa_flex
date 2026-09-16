import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { usuarios } from "@/db/schema";
import { createSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/app-auth";
import { hashPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { nome?: unknown; email?: unknown; senha?: unknown } | null;
  const nome = typeof body?.nome === "string" ? body.nome.trim().replace(/\s+/g, " ") : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const senha = typeof body?.senha === "string" ? body.senha : "";

  if (nome.length < 2 || nome.length > 80) {
    return NextResponse.json({ error: "Informe um nome válido." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  }
  if (senha.length < 8 || senha.length > 128) {
    return NextResponse.json({ error: "A senha deve ter entre 8 e 128 caracteres." }, { status: 400 });
  }

  const db = getDb();
  const [existing] = await db.select({ id: usuarios.idAluno }).from(usuarios).where(eq(usuarios.email, email)).limit(1);
  if (existing) {
    return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });
  }

  const idAluno = crypto.randomUUID();
  const senhaHash = await hashPassword(senha);
  await db.insert(usuarios).values({
    idAluno,
    nome,
    email,
    senhaHash,
    statusPagamento: "Ativo",
    objetivo: "10k",
  });

  const session = await createSession(idAluno);
  const response = NextResponse.json({
    user: { idAluno, nome, email, statusPagamento: "Ativo", objetivo: "10k" },
  }, { status: 201 });
  response.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions(session.expires));
  return response;
}
