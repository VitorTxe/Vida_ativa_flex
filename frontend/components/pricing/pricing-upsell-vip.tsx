"use client";

import React from "react";
import { ArrowRight, Check, MessageSquare, ShieldCheck, UserCheck } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent } from "@/frontend/components/ui/card";
import type { VipCoachingPlan } from "@/frontend/types/pricing.types";

interface PricingUpsellVipProps {
  plan: VipCoachingPlan;
}

export function PricingUpsellVip({ plan }: PricingUpsellVipProps): React.JSX.Element {
  const handleContact = () => {
    if (plan.contactUrl) {
      window.open(plan.contactUrl, "_blank", "noopener,noreferrer");
      return;
    }
    window.location.assign("/?mode=register&plan=vip");
  };

  return (
    <Card className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-card via-card to-primary/5 p-0 shadow-lg">
      <CardContent className="flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-primary">
            <UserCheck className="size-3.5" />
            <span>{plan.badge}</span>
          </div>

          <div>
            <h3 className="text-2xl font-black text-foreground sm:text-3xl">
              {plan.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {plan.subtitle}
            </p>
          </div>

          <div className="grid gap-2.5 pt-2 sm:grid-cols-2">
            {plan.features.map((item) => (
              <div key={item} className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Check className="size-3.5 text-primary shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-4 rounded-xl border border-border bg-background/50 p-6 sm:items-center lg:min-w-[280px]">
          <div className="text-left sm:text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Investimento
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-3xl font-black text-foreground sm:text-4xl">
                {plan.pricePerMonth}
              </span>
              <span className="text-xs font-bold text-muted-foreground">
                {plan.billingPeriod}
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" /> Vagas limitadas por treinador
            </p>
          </div>

          <Button
            type="button"
            onClick={handleContact}
            className="group w-full h-11 rounded-xl bg-primary text-xs sm:text-sm font-black uppercase tracking-wide text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90"
          >
            <MessageSquare className="size-4" />
            <span>{plan.ctaText}</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
