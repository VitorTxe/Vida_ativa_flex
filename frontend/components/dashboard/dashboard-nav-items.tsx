import React from "react";
import { CalendarDays, Gauge, GraduationCap, Home, TimerReset, Trophy, UserRound } from "lucide-react";
import type { NavItem, PageTitleMeta, View } from "@/frontend/types/dashboard.types";

export const navItems: NavItem[] = [
  { id: "home", icon: Home, label: "Visão geral", mobile: "Início" },
  { id: "test", icon: TimerReset, label: "Teste de 3 km", mobile: "Teste" },
  { id: "paces", icon: Gauge, label: "Meus ritmos", mobile: "Ritmos" },
  { id: "plan", icon: CalendarDays, label: "Plano flexível", mobile: "Treinos" },
  { id: "races", icon: Trophy, label: "Minhas provas", mobile: "Provas" },
  { id: "profile", icon: UserRound, label: "Perfil", mobile: "Perfil" },
];

export const pageTitles: Record<View, PageTitleMeta> = {
  home: { eyebrow: "Visão geral", title: "Pronto para evoluir?" },
  test: { eyebrow: "Central do teste", title: "Atualize seus ritmos" },
  paces: { eyebrow: "Régua metabólica", title: "Suas 7 zonas de treino" },
  plan: { eyebrow: "Ciclo atual", title: "Treine quando puder" },
  races: { eyebrow: "Histórico e recordes", title: "Suas provas oficiais" },
  profile: { eyebrow: "Conta e preferências", title: "Seu perfil FLEX" },
  admin: { eyebrow: "Painel do Treinador", title: "Gestão de Alunos & Treinos" },
};

export { Brand, BrandSymbol } from "@/frontend/components/ui/brand-logo";

export function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "VA";
}
