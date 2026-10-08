import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/backend/db";
import { sessoes, usuarios } from "@/backend/db/schema";
import { validateAndConsumeResetToken } from "@/backend/services/password-reset.service";
import { hashPassword } from "@/backend/services/password.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      token?: unknown;
      novaSenha?: unknown;
    } | null;

    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const novaSenha = typeof body?.novaSenha === "string" ? body.novaSenha : "";

    if (!token || token.length < 32) {
      return NextResponse.json(
        { error: "Token de redefinição inválido ou ausente." },
        { status: 400 }
      );
    }

    if (!novaSenha || novaSenha.length < 8 || novaSenha.length > 128) {
      return NextResponse.json(
        { error: "A nova senha deve ter no mínimo 8 caracteres." },
        { status: 400 }
      );
    }

    const idAluno = await validateAndConsumeResetToken(token);
    if (!idAluno) {
      return NextResponse.json(
        { error: "Este link de redefinição é inválido ou já expirou. Solicite um novo link." },
        { status: 400 }
      );
    }

    const db = getDb();
    const novoHash = await hashPassword(novaSenha);

    await db
      .update(usuarios)
      .set({ senhaHash: novoHash })
      .where(eq(usuarios.idAluno, idAluno));

    // Revoga sessões ativas existentes por segurança
    await db.delete(sessoes).where(eq(sessoes.idAluno, idAluno));

    return NextResponse.json(
      { success: true, message: "Senha redefinida com sucesso! Você já pode entrar com sua nova senha." },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[ResetPassword Error]:", error);
    const message = error instanceof Error ? error.message : "Erro ao redefinir senha.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
