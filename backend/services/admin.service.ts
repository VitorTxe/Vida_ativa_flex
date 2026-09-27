import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/backend/db";
import {
  mensagens,
  perfisCorrida,
  planosIa,
  treinosRealizados,
  usuarios,
} from "@/backend/db/schema";
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

  const [plan] = await db
    .select({ planoJson: planosIa.planoJson })
    .from(planosIa)
    .where(eq(planosIa.idAluno, idAluno))
    .limit(1);

  return {
    trainings: trainings.map((t) => ({
      ...t,
      origem: t.origem as "manual" | "strava",
    })),
    planJson: plan?.planoJson ?? null,
  };
}
