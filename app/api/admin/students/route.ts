import { NextResponse } from "next/server";
import { getCurrentUser } from "@/backend/services/auth.service";
import { listStudentsForTeacher } from "@/backend/services/admin.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const identity = await getCurrentUser();
  if (!identity) {
    return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
  }

  if (identity.role !== "professor") {
    return NextResponse.json({ error: "Acesso restrito a perfis administrativos." }, { status: 403 });
  }

  try {
    const students = await listStudentsForTeacher();
    return NextResponse.json({ students });
  } catch (error: unknown) {
    console.error("Erro ao listar alunos para o professor:", error);
    return NextResponse.json({ error: "Falha ao carregar lista de alunos." }, { status: 500 });
  }
}
