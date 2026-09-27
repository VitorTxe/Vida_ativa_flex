import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/backend/db";
import { provas } from "@/backend/db/schema";
import { getCurrentUser } from "@/backend/services/auth.service";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const identity = await getCurrentUser();
    if (!identity) {
      return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
    }

    const { id } = await props.params;
    if (!id) {
      return NextResponse.json({ error: "ID de prova inválido." }, { status: 400 });
    }

    const db = getDb();
    const result = await db
      .delete(provas)
      .where(and(eq(provas.id, id), eq(provas.idAluno, identity.idAluno)))
      .returning({ deletedId: provas.id });

    if (result.length === 0) {
      return NextResponse.json({ error: "Prova não encontrada." }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: unknown) {
    console.error("Erro ao excluir prova:", error);
    return NextResponse.json({ error: "Falha ao excluir a prova." }, { status: 500 });
  }
}
