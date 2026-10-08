import { NextResponse } from "next/server";
import { getCurrentUser } from "@/backend/services/auth.service";
import { syncUserSubscriptionFromApi } from "@/backend/services/kiwify.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "professor") {
      return NextResponse.json(
        { error: "Acesso não autorizado. Apenas administradores e professores podem executar sincronizações." },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => null)) as { idAluno?: unknown } | null;
    const idAluno = typeof body?.idAluno === "string" ? body.idAluno.trim() : "";

    if (!idAluno) {
      return NextResponse.json({ error: "Identificador do aluno não informado." }, { status: 400 });
    }

    const updated = await syncUserSubscriptionFromApi(idAluno);

    return NextResponse.json({
      success: true,
      subscription: updated,
      message: updated
        ? "Assinatura sincronizada com a Kiwify com sucesso."
        : "Nenhuma assinatura Kiwify vinculada encontrada para este aluno.",
    });
  } catch (error: unknown) {
    console.error("[Admin Sync Subscription Error]:", error);
    const message = error instanceof Error ? error.message : "Erro ao sincronizar assinatura com a Kiwify.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
