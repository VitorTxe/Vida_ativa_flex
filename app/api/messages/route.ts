import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/backend/services/auth.service";
import {
  createNewMessage,
  listStudentMessages,
  markStudentMessagesAsRead,
  type MessageSender,
  type MessageType,
} from "@/backend/services/messages.service";

export const dynamic = "force-dynamic";

const postMessageSchema = z.object({
  conteudo: z.string().min(1, "A mensagem não pode estar vazia.").max(2000, "Mensagem muito longa."),
  tipo: z.enum(["duvida", "avaliacao", "geral"]).default("geral"),
  alunoId: z.string().optional(),
});

export async function GET(request: Request) {
  const identity = await getCurrentUser();
  if (!identity) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetAlunoId = searchParams.get("alunoId") || identity.idAluno;

  // Se o usuário não for professor e tentar acessar mensagens de outro aluno, bloqueia
  if (targetAlunoId !== identity.idAluno && identity.role !== "professor") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  try {
    const messages = await listStudentMessages(targetAlunoId);
    return NextResponse.json({ messages });
  } catch (error: unknown) {
    console.error("Erro ao listar mensagens:", error);
    return NextResponse.json({ error: "Falha ao carregar mensagens." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const identity = await getCurrentUser();
  if (!identity) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = postMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 }
    );
  }

  const isTeacher = identity.role === "professor";
  const targetAlunoId = isTeacher && parsed.data.alunoId ? parsed.data.alunoId : identity.idAluno;
  const remetente: MessageSender = isTeacher ? "professor" : "aluno";
  const tipo: MessageType = parsed.data.tipo;

  try {
    const newMessage = await createNewMessage({
      idAluno: targetAlunoId,
      remetente,
      tipo,
      conteudo: parsed.data.conteudo,
    });

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error: unknown) {
    console.error("Erro ao enviar mensagem:", error);
    return NextResponse.json({ error: "Falha ao enviar mensagem." }, { status: 500 });
  }
}
