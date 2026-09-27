export type UserGoal = "5k" | "10k" | "21k" | "42k";
export type PaymentStatus = "Ativo" | "Inativo";
export type UserRole = "aluno" | "professor";

export interface AppUser {
  idAluno: string;
  nome: string;
  email: string;
  role: UserRole;
  statusPagamento: PaymentStatus;
  objetivo: UserGoal;
}

export interface SessionTokenPayload {
  token: string;
  expires: Date;
}

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  path: string;
  expires: Date;
}
