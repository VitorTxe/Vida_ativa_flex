"use client";

import React from "react";
import type { GeneratedTrainingPlan, RunningProfile } from "@/backend/types";
import { OnboardingContainer } from "./onboarding";

interface Props {
  nome: string;
  initialProfile: RunningProfile | null;
  onComplete: (plan: GeneratedTrainingPlan) => void;
  onLogout: () => void | Promise<void>;
}

export function OnboardingScreen({
  nome,
  initialProfile,
  onComplete,
  onLogout,
}: Props): React.JSX.Element {
  return (
    <OnboardingContainer
      nome={nome}
      initialProfile={initialProfile}
      onComplete={onComplete}
      onLogout={onLogout}
    />
  );
}
