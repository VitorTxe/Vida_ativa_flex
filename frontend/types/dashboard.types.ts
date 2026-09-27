import type { LucideIcon } from "lucide-react";
import type { Goal } from "@/frontend/lib/fitness-data";

export type View = "home" | "test" | "paces" | "plan" | "races" | "profile" | "admin";

export interface AuthUser {
  idAluno: string;
  nome: string;
  email: string;
  role?: "aluno" | "professor";
  statusPagamento: "Ativo" | "Inativo";
  objetivo: Goal | "42k";
}

export interface NavItem {
  id: View;
  icon: LucideIcon;
  label: string;
  mobile: string;
}

export interface PageTitleMeta {
  eyebrow: string;
  title: string;
}

export interface ModelContextTool {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => unknown;
}

export interface ModelContext {
  registerTool: (tool: ModelContextTool, options?: { signal?: AbortSignal }) => void | Promise<void>;
}

export type AuthStatus = "loading" | "anonymous" | "authenticated";
export type OnboardingStatus = "idle" | "loading" | "required" | "complete" | "error";
