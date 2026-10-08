import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/backend/db";
import {
  mensagens,
  perfisCorrida,
  planosIa,
  treinosRealizados,
  usuarios,
} from "@/backend/db/schema";
import type { GeneratedTrainingPlan, RunningProfile, TrainingSession, Weekday } from "@/backend/types";
import { generateFallbackTrainingPlan } from "./training-plan.service";
import { ensureMessagesInfrastructure } from "./messages.service";

export interface StudentSummary {
  idAluno: string;
  nome: string;
  email: string;
  objetivo: string;
  statusPagamento: string;
  nivelExperiencia: string | null;
  focoPrincipal: string | null;
  treinosPorSemana: number;
  totalTreinosConcluidos: number;
  totalTreinosPlano: number;
  ultimoTreino: {
    nome: string | null;
    semana: number;
    sessao: number;
    distanciaMetros: number | null;
    paceMedio: string | null;
    concluidoEm: string;
    origem: "manual" | "strava";
  } | null;
  mensagensNaoLidas: number;
  temSolicitacaoAvaliacao: boolean;
  ultimaMensagemEm?: string | null;
  ultimaMensagemNaoLidaEm?: string | null;
}

export interface StudentTrainingDetail {
  id: string;
  semana: number;
  sessao: number;
  origem: "manual" | "strava";
  nomeAtividade: string | null;
  sportType: string | null;
  distanciaMetros: number | null;
  movingTime: number | null;
  paceMedio: string | null;
  concluidoEm: string;
  stravaActivityId: string | null;
}

export async function listStudentsForTeacher(): Promise<StudentSummary[]> {
  await ensureMessagesInfrastructure();
  const db = getDb();

  const allUsers = await db
    .select({
      idAluno: usuarios.idAluno,
      nome: usuarios.nome,
      email: usuarios.email,
      objetivo: usuarios.objetivo,
      statusPagamento: usuarios.statusPagamento,
      nivelExperiencia: perfisCorrida.nivelExperiencia,
      focoPrincipal: perfisCorrida.focoPrincipal,
      treinosPorSemana: perfisCorrida.treinosPorSemana,
      planoJson: planosIa.planoJson,
    })
    .from(usuarios)
    .leftJoin(perfisCorrida, eq(usuarios.idAluno, perfisCorrida.idAluno))
    .leftJoin(planosIa, eq(usuarios.idAluno, planosIa.idAluno))
    .where(eq(usuarios.statusPagamento, "Ativo"));

  const results: StudentSummary[] = [];

  for (const user of allUsers) {
    // Busca treinos do aluno
    const completedTrainings = await db
      .select({
        id: treinosRealizados.id,
        nome: treinosRealizados.nomeAtividade,
        semana: treinosRealizados.semana,
        sessao: treinosRealizados.sessao,
        distanciaMetros: treinosRealizados.distanciaMetros,
        paceMedio: treinosRealizados.paceMedio,
        concluidoEm: treinosRealizados.concluidoEm,
        origem: treinosRealizados.origem,
      })
      .from(treinosRealizados)
      .where(eq(treinosRealizados.idAluno, user.idAluno))
      .orderBy(desc(treinosRealizados.concluidoEm));

    // Busca histórico de mensagens do aluno para ordenação temporal e detecção de pendências
    const studentMessages = await db
      .select({
        id: mensagens.id,
        tipo: mensagens.tipo,
        remetente: mensagens.remetente,
        lida: mensagens.lida,
        criadoEm: mensagens.criadoEm,
      })
      .from(mensagens)
      .where(eq(mensagens.idAluno, user.idAluno))
      .orderBy(desc(mensagens.criadoEm));

    const unreadMessages = studentMessages.filter(
      (m) => m.remetente === "aluno" && !m.lida
    );

    const temSolicitacaoAvaliacao = unreadMessages.some((msg) => msg.tipo === "avaliacao");
    const ultimaMensagemEm = studentMessages[0]?.criadoEm ?? null;
    const ultimaMensagemNaoLidaEm = unreadMessages[0]?.criadoEm ?? null;
    const ultimo = completedTrainings[0] ?? null;

    // Calcula a quantidade real de treinos do plano do aluno
    let totalTreinosPlano = (user.treinosPorSemana ?? 3) * 4;
    if (user.planoJson) {
      try {
        const parsed = JSON.parse(user.planoJson) as { semanas?: Array<{ sessoes?: unknown[] }> };
        if (parsed.semanas && Array.isArray(parsed.semanas)) {
          const soma = parsed.semanas.reduce((acc, sem) => acc + (sem.sessoes?.length ?? 0), 0);
          if (soma > 0) {
            totalTreinosPlano = soma;
          }
        }
      } catch (err: unknown) {
        console.error(`Erro ao decodificar planoJson do aluno ${user.idAluno}:`, err);
      }
    }

    results.push({
      idAluno: user.idAluno,
      nome: user.nome,
      email: user.email,
      objetivo: user.objetivo,
      statusPagamento: user.statusPagamento,
      nivelExperiencia: user.nivelExperiencia ?? "iniciante",
      focoPrincipal: user.focoPrincipal ?? "condicionamento",
      treinosPorSemana: user.treinosPorSemana ?? 3,
      totalTreinosConcluidos: completedTrainings.length,
      totalTreinosPlano,
      ultimoTreino: ultimo
        ? {
            nome: ultimo.nome,
            semana: ultimo.semana,
            sessao: ultimo.sessao,
            distanciaMetros: ultimo.distanciaMetros,
            paceMedio: ultimo.paceMedio,
            concluidoEm: ultimo.concluidoEm,
            origem: ultimo.origem as "manual" | "strava",
          }
        : null,
      mensagensNaoLidas: unreadMessages.length,
      temSolicitacaoAvaliacao,
      ultimaMensagemEm,
      ultimaMensagemNaoLidaEm,
    });
  }

  // Ranking: Mensagens não lidas no topo (mais recente para mais antiga),
  // seguido por mensagens lidas recentes, seguido pelos demais
  results.sort((a, b) => {
    const aUnread = a.mensagensNaoLidas > 0;
    const bUnread = b.mensagensNaoLidas > 0;

    if (aUnread && !bUnread) return -1;
    if (!aUnread && bUnread) return 1;

    if (aUnread && bUnread) {
      const aDate = a.ultimaMensagemNaoLidaEm || a.ultimaMensagemEm || "";
      const bDate = b.ultimaMensagemNaoLidaEm || b.ultimaMensagemEm || "";
      return bDate.localeCompare(aDate);
    }

    const aDate = a.ultimaMensagemEm || "";
    const bDate = b.ultimaMensagemEm || "";
    if (aDate && !bDate) return -1;
    if (!aDate && bDate) return 1;
    if (aDate && bDate) {
      const cmp = bDate.localeCompare(aDate);
      if (cmp !== 0) return cmp;
    }

    return a.nome.localeCompare(b.nome);
  });

  return results;
}

export async function getStudentTrainingsDetails(idAluno: string): Promise<{
  trainings: StudentTrainingDetail[];
  plan: GeneratedTrainingPlan | null;
  planJson: string | null;
}> {
  const db = getDb();
  const trainings = await db
    .select({
      id: treinosRealizados.id,
      semana: treinosRealizados.semana,
      sessao: treinosRealizados.sessao,
      origem: treinosRealizados.origem,
      nomeAtividade: treinosRealizados.nomeAtividade,
      sportType: treinosRealizados.sportType,
      distanciaMetros: treinosRealizados.distanciaMetros,
      movingTime: treinosRealizados.movingTime,
      paceMedio: treinosRealizados.paceMedio,
      concluidoEm: treinosRealizados.concluidoEm,
      stravaActivityId: treinosRealizados.stravaActivityId,
    })
    .from(treinosRealizados)
    .where(eq(treinosRealizados.idAluno, idAluno))
    .orderBy(desc(treinosRealizados.concluidoEm));

  const [planRow] = await db
    .select({ planoJson: planosIa.planoJson })
    .from(planosIa)
    .where(eq(planosIa.idAluno, idAluno))
    .limit(1);

  let parsedPlan: GeneratedTrainingPlan | null = null;
  if (planRow?.planoJson) {
    try {
      parsedPlan = JSON.parse(planRow.planoJson) as GeneratedTrainingPlan;
    } catch (err: unknown) {
      console.error(`Erro ao decodificar planoJson para o aluno ${idAluno}:`, err);
    }
  }

  return {
    trainings: trainings.map((t) => ({
      ...t,
      origem: t.origem as "manual" | "strava",
    })),
    plan: parsedPlan,
    planJson: planRow?.planoJson ?? null,
  };
}

export async function updateStudentPlanSession(
  idAluno: string,
  weekNumber: number,
  sessionNumber: number,
  sessionData: Partial<TrainingSession>
): Promise<GeneratedTrainingPlan> {
  const db = getDb();
  const [planRow] = await db
    .select({ planoJson: planosIa.planoJson })
    .from(planosIa)
    .where(eq(planosIa.idAluno, idAluno))
    .limit(1);

  if (!planRow?.planoJson) {
    throw new Error("Plano de treino não encontrado para este aluno.");
  }

  const plan = JSON.parse(planRow.planoJson) as GeneratedTrainingPlan;
  const targetWeek = plan.semanas.find((s) => s.semana === weekNumber);
  if (!targetWeek) {
    throw new Error(`Semana ${weekNumber} não encontrada no plano.`);
  }

  const targetSessionIndex = targetWeek.sessoes.findIndex((s) => s.sessao === sessionNumber);
  if (targetSessionIndex === -1) {
    throw new Error(`Sessão ${sessionNumber} não encontrada na semana ${weekNumber}.`);
  }

  const existingSession = targetWeek.sessoes[targetSessionIndex];
  targetWeek.sessoes[targetSessionIndex] = {
    ...existingSession,
    ...sessionData,
    sessao: sessionNumber,
  };

  const updatedJson = JSON.stringify(plan);
  await db
    .update(planosIa)
    .set({ planoJson: updatedJson })
    .where(eq(planosIa.idAluno, idAluno));

  return plan;
}

export async function addStudentPlanSession(
  idAluno: string,
  weekNumber: number,
  sessionData: Omit<TrainingSession, "sessao">
): Promise<GeneratedTrainingPlan> {
  const db = getDb();
  const [planRow] = await db
    .select({ planoJson: planosIa.planoJson })
    .from(planosIa)
    .where(eq(planosIa.idAluno, idAluno))
    .limit(1);

  if (!planRow?.planoJson) {
    throw new Error("Plano de treino não encontrado para este aluno.");
  }

  const plan = JSON.parse(planRow.planoJson) as GeneratedTrainingPlan;
  const targetWeek = plan.semanas.find((s) => s.semana === weekNumber);
  if (!targetWeek) {
    throw new Error(`Semana ${weekNumber} não encontrada no plano.`);
  }

  const nextSessionNumber = targetWeek.sessoes.length > 0
    ? Math.max(...targetWeek.sessoes.map((s) => s.sessao)) + 1
    : 1;

  const newSession: TrainingSession = {
    ...sessionData,
    sessao: nextSessionNumber,
  };

  targetWeek.sessoes.push(newSession);

  const updatedJson = JSON.stringify(plan);
  await db
    .update(planosIa)
    .set({ planoJson: updatedJson })
    .where(eq(planosIa.idAluno, idAluno));

  return plan;
}

export async function deleteStudentPlanSession(
  idAluno: string,
  weekNumber: number,
  sessionNumber: number
): Promise<GeneratedTrainingPlan> {
  const db = getDb();
  const [planRow] = await db
    .select({ planoJson: planosIa.planoJson })
    .from(planosIa)
    .where(eq(planosIa.idAluno, idAluno))
    .limit(1);

  if (!planRow?.planoJson) {
    throw new Error("Plano de treino não encontrado para este aluno.");
  }

  const plan = JSON.parse(planRow.planoJson) as GeneratedTrainingPlan;
  const targetWeek = plan.semanas.find((s) => s.semana === weekNumber);
  if (!targetWeek) {
    throw new Error(`Semana ${weekNumber} não encontrada no plano.`);
  }

  const originalLength = targetWeek.sessoes.length;
  targetWeek.sessoes = targetWeek.sessoes.filter((s) => s.sessao !== sessionNumber);
  if (targetWeek.sessoes.length === originalLength) {
    throw new Error(`Sessão ${sessionNumber} não encontrada na semana ${weekNumber}.`);
  }

  // Remove registro de conclusão para evitar estado órfão
  await db
    .delete(treinosRealizados)
    .where(
      and(
        eq(treinosRealizados.idAluno, idAluno),
        eq(treinosRealizados.semana, weekNumber),
        eq(treinosRealizados.sessao, sessionNumber)
      )
    );

  // Reindexa sessões da semana de 1 a N
  targetWeek.sessoes = targetWeek.sessoes.map((s, idx) => ({
    ...s,
    sessao: idx + 1,
  }));

  const updatedJson = JSON.stringify(plan);
  await db
    .update(planosIa)
    .set({ planoJson: updatedJson })
    .where(eq(planosIa.idAluno, idAluno));

  return plan;
}

export async function deleteStudentTrainingCompletion(
  idAluno: string,
  completionId: string
): Promise<void> {
  const db = getDb();
  await db
    .delete(treinosRealizados)
    .where(
      and(
        eq(treinosRealizados.idAluno, idAluno),
        eq(treinosRealizados.id, completionId)
      )
    );
}

export async function updateStudentPlanWeekFocus(
  idAluno: string,
  weekNumber: number,
  foco: string
): Promise<GeneratedTrainingPlan> {
  const db = getDb();
  const [planRow] = await db
    .select({ planoJson: planosIa.planoJson })
    .from(planosIa)
    .where(eq(planosIa.idAluno, idAluno))
    .limit(1);

  if (!planRow?.planoJson) {
    throw new Error("Plano de treino não encontrado para este aluno.");
  }

  const plan = JSON.parse(planRow.planoJson) as GeneratedTrainingPlan;
  const targetWeek = plan.semanas.find((s) => s.semana === weekNumber);
  if (!targetWeek) {
    throw new Error(`Semana ${weekNumber} não encontrada no plano.`);
  }

  targetWeek.foco = foco;
  const updatedJson = JSON.stringify(plan);
  await db
    .update(planosIa)
    .set({ planoJson: updatedJson })
    .where(eq(planosIa.idAluno, idAluno));

  return plan;
}

export async function initializeStudentPlan(idAluno: string): Promise<GeneratedTrainingPlan> {
  const db = getDb();
  const [existing] = await db
    .select({ planoJson: planosIa.planoJson })
    .from(planosIa)
    .where(eq(planosIa.idAluno, idAluno))
    .limit(1);

  if (existing?.planoJson) {
    try {
      return JSON.parse(existing.planoJson) as GeneratedTrainingPlan;
    } catch {
      // continua para gerar se corrompido
    }
  }

  const [profileRow] = await db
    .select()
    .from(perfisCorrida)
    .where(eq(perfisCorrida.idAluno, idAluno))
    .limit(1);

  const fallbackProfile: RunningProfile = {
    idade: profileRow?.idade ?? 30,
    pesoKg: profileRow?.pesoKg ?? 70,
    alturaCm: profileRow?.alturaCm ?? 170,
    nivelExperiencia: (profileRow?.nivelExperiencia ?? "iniciante") as RunningProfile["nivelExperiencia"],
    focoPrincipal: (profileRow?.focoPrincipal ?? "condicionamento") as RunningProfile["focoPrincipal"],
    treinosPorSemana: ((profileRow?.treinosPorSemana ?? 3) as 2 | 3 | 4),
    diasPreferenciais: ["ter", "qui", "sab"] as Weekday[],
    terrenoPrincipal: (profileRow?.terrenoPrincipal ?? "rua") as RunningProfile["terrenoPrincipal"],
    tipoTeste: "sem_teste",
  };

  const plan = generateFallbackTrainingPlan(fallbackProfile);
  const now = new Date().toISOString();

  await db.insert(planosIa).values({
    idAluno,
    modelo: "treinador-admin-manual",
    planoJson: JSON.stringify(plan),
    geradoEm: now,
  }).onConflictDoUpdate({
    target: planosIa.idAluno,
    set: {
      planoJson: JSON.stringify(plan),
      geradoEm: now,
    },
  });

  return plan;
}

