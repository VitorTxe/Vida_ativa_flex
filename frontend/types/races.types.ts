export interface RaceRecord {
  id: string;
  idAluno: string;
  nomeProva: string;
  dataProva: string;
  distanciaKm: number;
  tempoTotalSegundos: number;
  paceMedio: string;
  sensacaoEsforco: number | null;
  comentarios: string | null;
  criadoEm: string;
}

export interface NewRacePayload {
  nomeProva: string;
  dataProva: string;
  distanciaKm: number;
  minutos: number;
  segundos: number;
  sensacaoEsforco?: number | null;
  comentarios?: string | null;
}

export interface RacePersonalRecord {
  distanciaRotulo: string;
  distanciaKm: number;
  tempoTotalSegundos: number;
  paceMedio: string;
  nomeProva: string;
  dataProva: string;
}

export interface RacesResponseData {
  races: RaceRecord[];
  stats: {
    totalProvas: number;
    kmTotal: number;
    recordesPessoais: RacePersonalRecord[];
  };
}
