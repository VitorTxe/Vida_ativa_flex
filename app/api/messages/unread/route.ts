import { NextResponse } from "next/server";
import { getCurrentUser } from "@/backend/services/auth.service";
import {
  getTotalUnreadForTeacher,
  getUnreadMessagesCount,
  markStudentMessagesAsRead,
  type MessageSender,
} from "@/backend/services/messages.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await getCurrentUser();
  if (!identity) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetAlunoId = searchParams.get("alunoId");

  try {
    let count = 0;
    if (identity.role === "professor") {
      if (targetAlunoId) {
        count = await getUnreadMessagesCount(targetAlunoId, "professor");
      } else {
        count = await getTotalUnreadForTeacher();
      }
    } else {
      count = await getUnreadMessagesCount(identity.idAluno, "aluno");
    }

    return NextResponse.json({ unreadCount: count });
  } catch (error: unknown) {
    console.error("Erro ao obter mensagens não lidas:", error);
    return NextResponse.json({ error: "Falha ao obter contador." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const identity = await getCurrentUser();
  if (!identity) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetAlunoId = searchParams.get("alunoId") || identity.idAluno;
  const recipient: MessageSender = identity.role === "professor" ? "professor" : "aluno";

  try {
    await markStudentMessagesAsRead(targetAlunoId, recipient);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Erro ao marcar mensagens como lidas:", error);
    return NextResponse.json({ error: "Falha ao marcar como lidas." }, { status: 500 });
  }
}
