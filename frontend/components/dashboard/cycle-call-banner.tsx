"use client";

import React, { useState } from "react";
import { Award, Lock, Sparkles, Video } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import type { PlanCycleProgress } from "@/frontend/lib/plan-progress";
import { ScheduleCallDialog } from "./schedule-call-dialog";
import { UpgradePlanDialog } from "./upgrade-plan-dialog";

interface CycleCallBannerProps {
  progress: PlanCycleProgress;
  canScheduleCall?: boolean;
}

export function CycleCallBanner({
  progress,
  canScheduleCall = true,
}: CycleCallBannerProps): React.JSX.Element {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState<boolean>(false);
  const { isCycleCompleted, completedWeeksCount } = progress;

  const handleAction = () => {
    if (!canScheduleCall) {
      setUpgradeDialogOpen(true);
      return;
    }
    setDialogOpen(true);
  };

  return (
    <>
      {isCycleCompleted ? (
        <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/15 via-card to-card p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                <Award className="size-6" />
              </span>
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-primary">
                  <Sparkles className="size-3" /> Ciclo de 4 Semanas Concluído
                </div>
                <h3 className="mt-1 text-lg font-black tracking-tight text-foreground sm:text-xl">
                  Pronto para a sua Call com o Treinador!
                </h3>
                <p className="mt-1 max-w-xl text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  Você completou todas as 4 semanas deste ciclo de treinos. {canScheduleCall
                    ? "Agende agora sua call individual com o professor para avaliar sua evolução e planejar a próxima fase."
                    : "A call 1-a-1 individual de avaliação a cada 4 semanas é exclusiva do Plano Anual (Pro Acompanhado)."}
                </p>
              </div>
            </div>
            <Button
              onClick={handleAction}
              className="h-12 shrink-0 rounded-xl bg-primary px-6 font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
            >
              {canScheduleCall ? (
                <>
                  <Video className="size-4" /> Agendar Avaliação com Professor
                </>
              ) : (
                <>
                  <Lock className="size-4" /> Desbloquear Call (Plano Anual)
                </>
              )}
            </Button>
          </div>
        </section>
      ) : null}

      <ScheduleCallDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        completedWeeksCount={completedWeeksCount}
      />

      <UpgradePlanDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        gateInfo={{
          key: "canScheduleCycleCall",
          title: "Call de Avaliação Individual",
          description:
            "A call 1-a-1 em vídeo ao final de cada ciclo de 4 semanas com o treinador é um benefício exclusivo do Plano Anual (Pro).",
          minimumTier: "pro",
          minimumTierLabel: "Plano Anual (Pro Acompanhado)",
        }}
      />
    </>
  );
}

export function CycleCallButton({
  progress,
  canScheduleCall = true,
}: CycleCallBannerProps): React.JSX.Element {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState<boolean>(false);
  const { isCycleCompleted, completedWeeksCount, totalWeeks } = progress;

  const handleAction = () => {
    if (!canScheduleCall) {
      setUpgradeDialogOpen(true);
      return;
    }
    setDialogOpen(true);
  };

  if (isCycleCompleted) {
    return (
      <>
        <Button
          onClick={handleAction}
          className="h-11 rounded-xl bg-primary px-4 font-black text-primary-foreground shadow-md transition-all hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
          title={canScheduleCall ? "Agende sua call de alinhamento com o professor" : "Desbloqueie no Plano Anual"}
        >
          {canScheduleCall ? <Video className="size-4" /> : <Lock className="size-4" />}
          {canScheduleCall ? "Agendar Avaliação" : "Call (Plano Anual)"}
        </Button>
        <ScheduleCallDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          completedWeeksCount={completedWeeksCount}
        />
        <UpgradePlanDialog
          open={upgradeDialogOpen}
          onOpenChange={setUpgradeDialogOpen}
          gateInfo={{
            key: "canScheduleCycleCall",
            title: "Call de Avaliação Individual",
            description:
              "A call 1-a-1 ao final de cada ciclo de 4 semanas é exclusiva do Plano Anual (Pro Acompanhado).",
            minimumTier: "pro",
            minimumTierLabel: "Plano Anual (Pro Acompanhado)",
          }}
        />
      </>
    );
  }

  return (
    <Button
      disabled
      variant="outline"
      className="h-11 cursor-not-allowed rounded-xl border-border bg-card/60 px-4 text-xs font-bold text-muted-foreground opacity-60"
      title={`Complete as 4 semanas para liberar a call (${completedWeeksCount}/${totalWeeks} concluídas)`}
    >
      <Lock className="size-3.5" /> Agendar avaliação ({completedWeeksCount}/{totalWeeks} sem.)
    </Button>
  );
}
