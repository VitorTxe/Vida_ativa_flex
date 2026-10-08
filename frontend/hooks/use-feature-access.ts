"use client";

import { useMemo, useState } from "react";
import type { FeatureGateInfo, PlanFeatureKey, PlanFeatures, PlanTier } from "@/frontend/types/plan-tier.types";
import type { UserSubscriptionInfo } from "@/frontend/types/dashboard.types";
import { FEATURE_GATE_CONFIG, TIER_FEATURES, resolvePlanTier } from "@/frontend/lib/plan-tier-data";

export interface UseFeatureAccessReturn {
  tier: PlanTier;
  features: PlanFeatures;
  can: (key: PlanFeatureKey) => boolean;
  requestFeature: (key: PlanFeatureKey) => boolean;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  activeGate: FeatureGateInfo | null;
}

export function useFeatureAccess(
  subscription?: UserSubscriptionInfo | null,
  userRole?: string
): UseFeatureAccessReturn {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [activeGate, setActiveGate] = useState<FeatureGateInfo | null>(null);

  const tier = useMemo<PlanTier>(() => {
    return resolvePlanTier(subscription, userRole);
  }, [subscription, userRole]);

  const features = useMemo<PlanFeatures>(() => {
    return TIER_FEATURES[tier];
  }, [tier]);

  const can = (key: PlanFeatureKey): boolean => {
    return Boolean(features[key]);
  };

  const requestFeature = (key: PlanFeatureKey): boolean => {
    if (can(key)) {
      return true;
    }
    setActiveGate(FEATURE_GATE_CONFIG[key]);
    setDialogOpen(true);
    return false;
  };

  return {
    tier,
    features,
    can,
    requestFeature,
    dialogOpen,
    setDialogOpen,
    activeGate,
  };
}
