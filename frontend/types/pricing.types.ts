export type PricingTierId = "monthly" | "semiannual" | "annual" | "vip_coaching";

export interface PricingPlan {
  id: PricingTierId;
  title: string;
  badge?: string;
  highlighted?: boolean;
  installmentPrefix?: string;
  pricePerMonth: string;
  billingPeriod: string;
  totalText: string;
  helperText?: string;
  ctaText: string;
  checkoutUrl?: string;
  features?: string[];
}

export interface VipCoachingPlan {
  id: "vip_coaching";
  title: string;
  badge: string;
  pricePerMonth: string;
  billingPeriod: string;
  subtitle: string;
  ctaText: string;
  contactUrl?: string;
  features: string[];
}
