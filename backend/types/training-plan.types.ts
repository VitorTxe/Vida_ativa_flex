export type RunningLevel = "iniciante" | "intermediario" | "avancado";

export type CycleFocus = "primeira_prova" | "recorde_pessoal" | "condicionamento";

export type TargetDistance = "5k" | "10k" | "21k" | "42k";

export type TerrainPreference = "rua" | "esteira" | "misto";

export type TestInputType = "teste_3k" | "prova_recente" | "sem_teste";

export type Weekday = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";

export interface RunningProfile {
  idade: number;
  pesoKg: number;
  alturaCm: number;
  nivelExperiencia: RunningLevel;
  focoPrincipal: CycleFocus;
  distanciaAlvo?: TargetDistance | null;
  treinosPorSemana: 2 | 3 | 4;
  diasPreferenciais: Weekday[];
  terrenoPrincipal: TerrainPreference;
  tipoTeste: TestInputType;
  minutosTeste?: number | null;
  segundosTeste?: number | null;
  distanciaProva?: "5k" | "10k" | null;
  minutosProva?: number | null;
  segundosProva?: number | null;
  tempoSegundosEstimado?: number | null;
  vdotCalculado?: number | null;
  // Campos legados para compatibilidade reversa
  jaCorre?: boolean;
  tempoCorridaMeses?: number | null;
}

export interface TrainingSession {
  sessao: number;
  titulo: string;
  tipo: string;
  duracaoMinutos: number;
  intensidade: string;
  descricao: string;
  terrenoSugerido?: string;
  diaSugerido?: string;
}

export interface TrainingWeek {
  semana: number;
  foco: string;
  sessoes: TrainingSession[];
}

export interface GeneratedTrainingPlan {
  titulo: string;
  resumo: string;
  semanas: TrainingWeek[];
  orientacoes: string[];
}
