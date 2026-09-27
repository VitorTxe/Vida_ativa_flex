import type { Goal } from "@/frontend/lib/fitness-data";

export type AdminRole = "aluno" | "professor";
export type AdminUserStatus = "Ativo" | "Inativo";

export interface ManagedUser {
  idAluno: string;
  nome: string;
  email: string;
  role: AdminRole;
  statusPagamento: AdminUserStatus;
  objetivo: Goal | "42k";
  totalTreinosConcluidos: number;
  dataCriacao?: string;
}

export interface CreateUserPayload {
  nome: string;
  email: string;
  senha: string;
  role: AdminRole;
  objetivo: Goal | "42k";
  statusPagamento?: AdminUserStatus;
}

export interface UpdateUserAccessPayload {
  role?: AdminRole;
  statusPagamento?: AdminUserStatus;
}
