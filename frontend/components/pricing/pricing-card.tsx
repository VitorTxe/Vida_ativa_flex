"use client";

import React from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent } from "@/frontend/components/ui/card";
import type { PricingPlan } from "@/frontend/types/pricing.types";

interface PricingCardProps {
  plan: PricingPlan;
  onSelectPlan?: (planId: string) => void;
}

export function PricingCard({ plan, onSelectPlan }: PricingCardProps): React.JSX.Element {
  const isAnnual = plan.highlighted;

  const handleCtaClick = () => {
    if (plan.checkoutUrl) {
      window.location.assign(plan.checkoutUrl);
      return;
    }
    if (onSelectPlan) {
      onSelectPlan(plan.id);
      return;
    }
    window.location.assign(`/?mode=register&plan=${encodeURIComponent(plan.id)}`);
  };

  return (
    <Card
      className={`relative flex flex-col justify-between overflow-hidden rounded-2xl transition-all duration-300 ${
        isAnnual
          ? "border-2 border-primary bg-card shadow-2xl shadow-primary/10 lg:-translate-y-2 lg:scale-105"
          : "border border-border bg-card/60 hover:border-border/80"
      }`}
    >
      {plan.badge && (
        <div className="absolute -top-px left-1/2 -translate-x-1/2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-b-xl px-4 py-1 text-[11px] font-black uppercase tracking-wider ${
              isAnnual
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                : "border-b border-x border-border bg-muted text-muted-foreground"
            }`}
          >
            {isAnnual && <Sparkles className="size-3 shrink-0" />}
            {plan.badge}
          </span>
        </div>
      )}

      <CardContent className={`flex h-full flex-col justify-between p-6 sm:p-8 ${plan.badge ? "pt-10 sm:pt-11" : ""}`}>
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-foreground">{plan.title}</h3>
            {isAnnual && (
              <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-primary">
                Melhor Escolha
              </span>
            )}
          </div>

          <div className="mt-5">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              {plan.installmentPrefix && (
                <span className="text-base font-bold text-muted-foreground sm:text-lg">
                  {plan.installmentPrefix}
                </span>
              )}
              <span className="text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                {plan.pricePerMonth}
              </span>
              <span className="text-sm font-bold text-muted-foreground">{plan.billingPeriod}</span>
            </div>

            <p className="mt-2 text-xs font-medium leading-relaxed text-muted-foreground sm:text-sm">
              {plan.totalText}
            </p>

            {plan.helperText && (
              <div className="mt-3 inline-block rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                {plan.helperText}
              </div>
            )}
          </div>

          {plan.features && plan.features.length > 0 && (
            <>
              <div className="my-6 h-px bg-border" />
              <ul className="space-y-3" role="list">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-xs font-medium text-foreground sm:text-sm">
                    <span
                      className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full ${
                        isAnnual ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                      }`}
                    >
                      <Check className="size-2.5" />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="mt-8">
          <Button
            type="button"
            onClick={handleCtaClick}
            className={`group w-full h-12 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wide transition-all ${
              isAnnual
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
                : "border border-border bg-secondary text-secondary-foreground hover:bg-muted"
            }`}
          >
            <span>{plan.ctaText}</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
