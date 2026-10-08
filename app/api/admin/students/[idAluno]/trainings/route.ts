import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/backend/services/auth.service";
import {
  addStudentPlanSession,
  deleteStudentPlanSession,
  deleteStudentTrainingCompletion,
  getStudentTrainingsDetails,
  initializeStudentPlan,
  updateStudentPlanSession,
  updateStudentPlanWeekFocus,
} from "@/backend/services/admin.service";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ idAluno: string }>;
}

const sessionDataSchema = z.object({
  titulo: z.string().trim().min(2, "Título deve ter no mínimo 2 caracteres"),
  tipo: z.string().trim().min(2, "Tipo de treino obrigatório"),
  duracaoMinutos: z.coerce.number().int().min(5).max(300),
  intensidade: z.string().trim().min(1, "Intensidade obrigatória"),
  descricao: z.string().trim().min(5, "Descrição detalhada obrigatória"),
  diaSugerido: z.string().optional(),
  terrenoSugerido: z.string().optional(),
});

const putActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update_session"),
    week: z.coerce.number().int().min(1).max(52),
    session: z.coerce.number().int().min(1).max(20),
    sessionData: sessionDataSchema,
  }),
  z.object({
    action: z.literal("add_session"),
    week: z.coerce.number().int().min(1).max(52),
    sessionData: sessionDataSchema,
  }),
  z.object({
    action: z.literal("update_week_focus"),
    week: z.coerce.number().int().min(1).max(52),
    foco: z.string().trim().min(2, "Foco da semana deve ter no mínimo 2 caracteres"),
  }),
  z.object({
    action: z.literal("initialize_plan"),
  }),
]);

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

export async function PUT(request: Request, context: RouteParams) {
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
    const body = await request.json().catch(() => null);
    const parsed = putActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos para atualização." },
        { status: 400 }
      );
    }

    const payload = parsed.data;

    if (payload.action === "update_session") {
      const updatedPlan = await updateStudentPlanSession(
        idAluno,
        payload.week,
        payload.session,
        payload.sessionData
      );
      return NextResponse.json({ success: true, plan: updatedPlan });
    }

    if (payload.action === "add_session") {
      const updatedPlan = await addStudentPlanSession(
        idAluno,
        payload.week,
        payload.sessionData
      );
      return NextResponse.json({ success: true, plan: updatedPlan }, { status: 201 });
    }

    if (payload.action === "update_week_focus") {
      const updatedPlan = await updateStudentPlanWeekFocus(idAluno, payload.week, payload.foco);
      return NextResponse.json({ success: true, plan: updatedPlan });
    }

    if (payload.action === "initialize_plan") {
      const createdPlan = await initializeStudentPlan(idAluno);
      return NextResponse.json({ success: true, plan: createdPlan }, { status: 201 });
    }

    return NextResponse.json({ error: "Ação não reconhecida." }, { status: 400 });
  } catch (error: unknown) {
    console.error("Erro ao atualizar treino do aluno:", error);
    const message = error instanceof Error ? error.message : "Erro interno ao atualizar treino.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteParams) {
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
    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    if (action === "delete_session") {
      const week = Number(url.searchParams.get("week"));
      const session = Number(url.searchParams.get("session"));

      if (!week || !session || Number.isNaN(week) || Number.isNaN(session)) {
        return NextResponse.json({ error: "Semana e sessão são obrigatórias para exclusão." }, { status: 400 });
      }

      const updatedPlan = await deleteStudentPlanSession(idAluno, week, session);
      return NextResponse.json({ success: true, plan: updatedPlan });
    }

    if (action === "delete_completion") {
      const completionId = url.searchParams.get("completionId");
      if (!completionId) {
        return NextResponse.json({ error: "ID da conclusão é obrigatório." }, { status: 400 });
      }

      await deleteStudentTrainingCompletion(idAluno, completionId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Ação de exclusão inválida." }, { status: 400 });
  } catch (error: unknown) {
    console.error("Erro ao excluir treino ou conclusão do aluno:", error);
    const message = error instanceof Error ? error.message : "Erro interno ao excluir treino.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

