import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/backend/db";
import { usuarios } from "@/backend/db/schema";
import { getCurrentUser } from "@/backend/services/auth.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const identity = await getCurrentUser();
  if (!identity) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  if (identity.role !== "professor") {
    return NextResponse.json(
      { error: "Apenas administradores e professores têm acesso a esta funcionalidade." },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { role?: "aluno" | "professor" };
  const nextRole = body.role ?? "professor";

  try {
    const db = getDb();
    await db.update(usuarios).set({ role: nextRole }).where(eq(usuarios.idAluno, identity.idAluno));
    return NextResponse.json({ role: nextRole });
  } catch (error: unknown) {
    console.error("Erro ao alterar papel do usuário:", error);
    return NextResponse.json({ error: "Falha ao alterar papel." }, { status: 500 });
  }
}
