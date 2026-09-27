export type MessageSender = "aluno" | "professor";
export type MessageType = "duvida" | "avaliacao" | "geral";

export interface MessageItem {
  id: string;
  idAluno: string;
  remetente: MessageSender;
  tipo: MessageType;
  conteudo: string;
  lida: boolean;
  criadoEm: string;
}

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
