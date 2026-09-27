import { NextResponse } from "next/server";
import { getCurrentUser } from "@/backend/services/auth.service";
import { getStudentTrainingsDetails } from "@/backend/services/admin.service";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ idAluno: string }>;
}

export async function GET(_request: Request, context: RouteParams) {
  const identity = await getCurrentUser();
  if (!identity) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  if (identity.role !== "professor") {
    return NextResponse.json({ error: "Acesso restrito a perfis administrativos." }, { status: 403 });
  }

  const { idAluno } = await context.params;
  if (!idAluno) {
    return NextResponse.json({ error: "ID do aluno é obrigatório." }, { status: 400 });
  }

  try {
    const data = await getStudentTrainingsDetails(idAluno);
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Erro ao carregar detalhes dos treinos do aluno:", error);
    return NextResponse.json({ error: "Falha ao consultar treinos do aluno." }, { status: 500 });
  }
}
