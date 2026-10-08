import type {
  KiwifySubscriptionStatus,
  KiwifyWebhookRawPayload,
  NormalizedKiwifyEvent,
} from "@/backend/types/kiwify.types";

/**
 * Normaliza os payloads da Kiwify (tanto formato moderno em envelope quanto formato clássico raiz).
 * Função pura e desacoplada de infraestrutura de banco de dados.
 */
export function normalizeKiwifyPayload(raw: KiwifyWebhookRawPayload): NormalizedKiwifyEvent {
  const isEnvelope = Boolean(raw.type && raw.data);
  const data = isEnvelope && raw.data ? raw.data : raw;

  const eventType = (
    raw.type ||
    data.webhook_event_type ||
    raw.webhook_event_type ||
    data.order_status ||
    "order_approved"
  ).toLowerCase();

  const customer = data.Customer || data.customer || raw.Customer || raw.customer || {};
  const subscription = data.Subscription || data.subscription || raw.Subscription || raw.subscription || {};
  const product = data.Product || data.product || raw.Product || raw.product || {};
  const plan = subscription.plan || {};

  const orderId = String(data.order_id || raw.order_id || "").trim();
  const subscriptionId = subscription.id || data.subscription_id || raw.subscription_id;

  let rawSubStatus = (subscription.status || "").toLowerCase();
  if (!rawSubStatus && data.order_status === "paid") {
    rawSubStatus = "active";
  }

  let subscriptionStatus: KiwifySubscriptionStatus = "unknown";
  if (["active", "paid", "aprovado"].includes(rawSubStatus)) {
    subscriptionStatus = "active";
  } else if (["canceled", "cancelled", "cancelada"].includes(rawSubStatus)) {
    subscriptionStatus = "canceled";
  } else if (["overdue", "late", "atrasada"].includes(rawSubStatus)) {
    subscriptionStatus = "overdue";
  } else if (["refunded", "reembolsado"].includes(rawSubStatus)) {
    subscriptionStatus = "refunded";
  } else if (["chargedback", "chargeback"].includes(rawSubStatus)) {
    subscriptionStatus = "chargedback";
  } else if (["trialing", "trial"].includes(rawSubStatus)) {
    subscriptionStatus = "trialing";
  }

  const eventId = raw.id || `${orderId || "event"}_${eventType}_${subscriptionId || "sub"}`;

  return {
    eventId,
    eventType,
    orderId,
    orderStatus: String(data.order_status || "").toLowerCase(),
    subscriptionId: subscriptionId ? String(subscriptionId) : undefined,
    customerName: customer.full_name?.trim() || "Aluno Kiwify",
    customerEmail: customer.email?.trim().toLowerCase() || "",
    customerPhone: customer.mobile?.trim(),
    productId: product.product_id,
    productName: product.product_name || "Vida Ativa - FLEX",
    planId: plan.id,
    planName: plan.name || "Assinatura FLEX",
    subscriptionStatus,
    startDate: subscription.start_date,
    nextPaymentDate: subscription.next_payment,
    rawPayload: raw,
  };
}

/**
 * Validação de segurança por token secreto (query string ?token= ou ?signature=, ou payload/headers).
 * Função pura e desacoplada de infraestrutura de banco de dados.
 */
export function verifyKiwifyWebhookSecurity(request: Request, raw: KiwifyWebhookRawPayload): boolean {
  const secret = process.env.KIWIFY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[Kiwify Security] KIWIFY_WEBHOOK_SECRET ausente em produção!");
      return false;
    }
    return true;
  }

  const url = new URL(request.url);
  const queryToken = url.searchParams.get("token") || url.searchParams.get("signature");
  if (queryToken && queryToken.trim() === secret) {
    return true;
  }

  const headerSignature = request.headers.get("x-kiwify-signature") || request.headers.get("x-webhook-token");
  if (headerSignature && headerSignature.trim() === secret) {
    return true;
  }

  const payloadSignature = raw.signature || (raw.data && typeof raw.data === "object" && "signature" in raw.data ? String(raw.data.signature) : "");
  if (payloadSignature && payloadSignature.trim() === secret) {
    return true;
  }

  return false;
}
