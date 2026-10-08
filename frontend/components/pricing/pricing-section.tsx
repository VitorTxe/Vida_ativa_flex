"use client";

import React from "react";
import { PRICING_PLANS } from "@/frontend/lib/pricing-data";
import { PricingCard } from "./pricing-card";

interface PricingSectionProps {
  id?: string;
  className?: string;
  onSelectPlan?: (planId: string) => void;
}

export function PricingSection({
  id = "planos",
  className = "",
  onSelectPlan,
}: PricingSectionProps): React.JSX.Element {
  return (
    <section id={id} className={`relative py-20 sm:py-28 ${className}`}>
      <div className="mx-auto max-w-[1440px] px-5 sm:px-9 lg:px-14">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
            Investimento na sua evolução
          </div>
          <h2 className="mt-5 text-3xl font-black uppercase tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Planos feitos para o <span className="text-primary">seu ritmo.</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Treine com metodologia flexível, sem agenda engessada. Escolha o plano que melhor se adapta à sua rotina e aproveite a máxima economia no plano anual.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:mt-16 md:grid-cols-2 lg:grid-cols-3 lg:items-stretch lg:gap-8">
          {PRICING_PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} onSelectPlan={onSelectPlan} />
          ))}
        </div>
      </div>
    </section>
  );
}
