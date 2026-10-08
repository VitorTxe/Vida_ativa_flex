export type PlanTier = "autonomia" | "performance" | "pro";

export type PlanFeatureKey =
  | "canSyncStrava"
  | "canAccessRaces"
  | "canMessageCoach"
  | "canScheduleCycleCall"
  | "hasCustomWorkouts";

export interface PlanFeatures {
  canSyncStrava: boolean;
  canAccessRaces: boolean;
  canMessageCoach: boolean;
  canScheduleCycleCall: boolean;
  hasCustomWorkouts: boolean;
}

export interface FeatureGateInfo {
  key: PlanFeatureKey;
  title: string;
  description: string;
  minimumTier: PlanTier;
  minimumTierLabel: string;
}
