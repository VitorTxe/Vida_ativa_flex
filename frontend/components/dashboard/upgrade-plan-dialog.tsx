"use client";

import React from "react";
import { ArrowRight, Lock, Sparkles } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/frontend/components/ui/dialog";
import type { FeatureGateInfo } from "@/frontend/types/plan-tier.types";

interface UpgradePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gateInfo?: FeatureGateInfo | null;
}

export function UpgradePlanDialog({
  open,
  onOpenChange,
  gateInfo,
}: UpgradePlanDialogProps): React.JSX.Element {
  if (!gateInfo) {
    return <></>;
  }

  const handleUpgradeClick = () => {
    onOpenChange(false);
    window.location.assign("/planos");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card p-6 text-foreground sm:max-w-md sm:rounded-2xl">
        <DialogHeader className="space-y-3">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary shadow-sm">
            <Lock className="size-6" />
          </div>
          <DialogTitle className="text-center text-xl font-black tracking-tight text-foreground">
            {gateInfo.title}
          </DialogTitle>
          <DialogDescription className="text-center text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {gateInfo.description}
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
            <Sparkles className="size-3" /> Exclusivo do {gateInfo.minimumTierLabel}
          </div>
          <p className="mt-2 text-xs font-semibold text-foreground">
            Aproveite o <span className="text-primary font-black">Plano Anual em 12x de R$ 61,93</span> (ou R$ 598,80 à vista) para desbloquear todos os recursos.
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 pt-2 sm:flex-col">
          <Button
            type="button"
            onClick={handleUpgradeClick}
            className="group h-12 w-full rounded-xl bg-primary text-xs font-black uppercase tracking-wide text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 sm:text-sm"
          >
            <span>Ver Planos e Fazer Upgrade</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-10 w-full text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Agora não
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
