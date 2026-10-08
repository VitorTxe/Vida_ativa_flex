import React from "react";
import { BadgeCheck, CreditCard, Headphones } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent } from "@/frontend/components/ui/card";
import type { UserSubscriptionInfo } from "@/frontend/types/dashboard.types";

interface ProfileSubscriptionCardProps {
  subscription?: UserSubscriptionInfo | null;
  onOpenSupport?: () => void;
}

export function ProfileSubscriptionCard({
  subscription,
  onOpenSupport,
}: ProfileSubscriptionCardProps): React.JSX.Element {
  const isKiwify = Boolean(subscription?.kiwifySubscriptionId);
  const planName = subscription?.planoNome || "Assinatura FLEX";
  const status = subscription?.status || "active";

  const statusLabel =
    status === "active"
      ? "Ativa"
      : status === "canceled"
      ? "Cancelada"
      : status === "overdue" || status === "late"
      ? "Atrasada / Inadimplente"
      : status === "refunded"
      ? "Reembolsada"
      : status === "chargedback"
      ? "Chargeback"
      : "Ativa";

  const formattedRenewal = React.useMemo(() => {
    if (!subscription?.proximaCobranca) return null;
    try {
      const date = new Date(subscription.proximaCobranca);
      if (Number.isNaN(date.getTime())) return subscription.proximaCobranca;
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return subscription.proximaCobranca;
    }
  }, [subscription?.proximaCobranca]);

  return (
    <Card className="border-primary/20 bg-primary/5 py-0 shadow-none">
      <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
            {isKiwify ? <CreditCard className="size-5" /> : <BadgeCheck className="size-5" />}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-black text-foreground">{planName}</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                status === "active"
                  ? "bg-emerald-500/15 text-emerald-500"
                  : "bg-destructive/15 text-destructive"
              }`}>
                {statusLabel}
              </span>
              {isKiwify && (
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                  Kiwify
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {formattedRenewal
                ? `Próxima renovação em ${formattedRenewal}`
                : isKiwify
                ? "Cobrança gerenciada via Kiwify"
                : "Assinatura gerenciada pela assessoria"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            asChild
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
          >
            <a href="/planos">Ver Planos</a>
          </Button>
          <Button
            onClick={onOpenSupport}
            variant="ghost"
            className="justify-start text-primary hover:bg-primary/10 hover:text-primary"
          >
            <Headphones /> Falar com suporte
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
