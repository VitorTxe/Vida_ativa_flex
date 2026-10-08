import type { FeatureGateInfo, PlanFeatureKey, PlanFeatures, PlanTier } from "@/frontend/types/plan-tier.types";
import type { UserSubscriptionInfo } from "@/frontend/types/dashboard.types";

export const TIER_FEATURES: Record<PlanTier, PlanFeatures> = {
  autonomia: {
    canSyncStrava: false,
    canAccessRaces: false,
    canMessageCoach: false,
    canScheduleCycleCall: false,
    hasCustomWorkouts: false,
  },
  performance: {
    canSyncStrava: true,
    canAccessRaces: true,
    canMessageCoach: true,
    canScheduleCycleCall: false,
    hasCustomWorkouts: false,
  },
  pro: {
    canSyncStrava: true,
    canAccessRaces: true,
    canMessageCoach: true,
    canScheduleCycleCall: true,
    hasCustomWorkouts: true,
  },
};

export const FEATURE_GATE_CONFIG: Record<PlanFeatureKey, FeatureGateInfo> = {
  canSyncStrava: {
    key: "canSyncStrava",
    title: "Integração Strava",
    description: "Sincronize automaticamente seus treinos do relógio/celular com a planilha FLEX para comparar seu pace real com o alvo.",
    minimumTier: "performance",
    minimumTierLabel: "Plano Semestral (Performance)",
  },
  canAccessRaces: {
    key: "canAccessRaces",
    title: "Módulo de Provas e Metas",
    description: "Cadastre suas provas oficiais de 5k, 10k e 21k, acompanhe predições de tempo e registre seus recordes pessoais.",
    minimumTier: "performance",
    minimumTierLabel: "Plano Semestral (Performance)",
  },
  canMessageCoach: {
    key: "canMessageCoach",
    title: "Canal de Mensagens com Treinador",
    description: "Tire dúvidas sobre treinos, dores, ritmos e ajustes na planilha diretamente pelo chat interno do app.",
    minimumTier: "performance",
    minimumTierLabel: "Plano Semestral (Performance)",
  },
  canScheduleCycleCall: {
    key: "canScheduleCycleCall",
    title: "Call 1-a-1 de Avaliação de Ciclo",
    description: "Agende uma sessão individual em vídeo com o professor a cada 4 semanas para revisar métricas e planejar seu próximo ciclo.",
    minimumTier: "pro",
    minimumTierLabel: "Plano Anual (Pro Acompanhado)",
  },
  hasCustomWorkouts: {
    key: "hasCustomWorkouts",
    title: "Planilhas Customizadas pelo Treinador",
    description: "Receba prescrição adaptada pelo treinador às suas provas e rotina, além da planilha base do método.",
    minimumTier: "pro",
    minimumTierLabel: "Plano Anual (Pro Acompanhado)",
  },
};

export function resolvePlanTier(
  subscription?: UserSubscriptionInfo | null,
  userRole?: string
): PlanTier {
  if (userRole === "professor") {
    return "pro";
  }

  if (!subscription || subscription.status !== "active") {
    return "autonomia";
  }

  const name = (subscription.planoNome || "").toLowerCase();

  if (name.includes("anual") || name.includes("pro") || name.includes("completo") || name.includes("12x")) {
    return "pro";
  }

  if (name.includes("semestral") || name.includes("performance") || name.includes("6x")) {
    return "performance";
  }

  return "autonomia";
}
