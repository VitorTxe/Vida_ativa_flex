import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/backend/db";
import { usuarios } from "@/backend/db/schema";
import {
  createSession,
  ensureUsersRoleInfrastructure,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/backend/services/auth.service";
import { hashPassword } from "@/backend/services/password.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
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

    await ensureUsersRoleInfrastructure();
    const db = getDb();
    const [existing] = await db.select({ id: usuarios.idAluno, senhaHash: usuarios.senhaHash }).from(usuarios).where(eq(usuarios.email, email)).limit(1);
    if (existing?.senhaHash) {
      return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });
    }

    const senhaHash = await hashPassword(senha);
    let idAluno: string;
    if (existing) {
      const platformUser = await getChatGPTUser();
      if (!platformUser || platformUser.email.trim().toLowerCase() !== email) {
        return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });
      }
      idAluno = existing.id;
      await db.update(usuarios).set({ nome, senhaHash }).where(eq(usuarios.idAluno, idAluno));
    } else {
      idAluno = crypto.randomUUID();
      await db.insert(usuarios).values({
        idAluno,
        nome,
        email,
        senhaHash,
        statusPagamento: "Ativo",
        role: "aluno",
        objetivo: "10k",
      });
    }

    const session = await createSession(idAluno);
    const response = NextResponse.json({
      user: { idAluno, nome, email, role: "aluno" as const, statusPagamento: "Ativo", objetivo: "10k" },
    }, { status: 201 });
    response.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions(session.expires));
    return response;
  } catch (error: unknown) {
    console.error("[Register Error]:", error);
    const message = error instanceof Error ? error.message : "Erro interno ao processar cadastro.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
