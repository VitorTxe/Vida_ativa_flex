export type KiwifySubscriptionStatus =
  | "active"
  | "canceled"
  | "overdue"
  | "late"
  | "refunded"
  | "chargedback"
  | "trialing"
  | "unknown";

export interface KiwifyCustomerPayload {
  full_name?: string;
  email?: string;
  mobile?: string;
  CPF?: string;
  ip?: string;
}

export interface KiwifyPlanPayload {
  id?: string;
  name?: string;
  frequency?: string;
  qty_charges?: number;
}

export interface KiwifySubscriptionPayload {
  id?: string;
  status?: string;
  start_date?: string;
  next_payment?: string;
  charges?: {
    completed?: Array<{
      charge_id?: string;
      order_id?: string;
      created_at?: string;
      amount?: number;
    }>;
    future?: Array<{
      charge_date?: string;
    }>;
  };
  plan?: KiwifyPlanPayload;
}

export interface KiwifyProductPayload {
  product_id?: string;
  product_name?: string;
}

export interface KiwifyWebhookRawPayload {
  // Estrutura em envelope moderno
  id?: string;
  type?: string;
  version?: string;
  created_at?: string;
  data?: {
    order_id?: string;
    order_ref?: string;
    order_status?: string;
    payment_method?: string;
    subscription_id?: string;
    Customer?: KiwifyCustomerPayload;
    customer?: KiwifyCustomerPayload;
    Subscription?: KiwifySubscriptionPayload;
    subscription?: KiwifySubscriptionPayload;
    Product?: KiwifyProductPayload;
    product?: KiwifyProductPayload;
    webhook_event_type?: string;
    [key: string]: unknown;
  };

  // Estrutura clássica de webhook
  order_id?: string;
  order_ref?: string;
  order_status?: string;
  payment_method?: string;
  subscription_id?: string;
  Customer?: KiwifyCustomerPayload;
  customer?: KiwifyCustomerPayload;
  Subscription?: KiwifySubscriptionPayload;
  subscription?: KiwifySubscriptionPayload;
  Product?: KiwifyProductPayload;
  product?: KiwifyProductPayload;
  webhook_event_type?: string;
  signature?: string;
}

export interface NormalizedKiwifyEvent {
  eventId: string;
  eventType: string;
  orderId: string;
  orderStatus: string;
  subscriptionId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  productId?: string;
  productName?: string;
  planId?: string;
  planName?: string;
  subscriptionStatus: KiwifySubscriptionStatus;
  startDate?: string;
  nextPaymentDate?: string;
  rawPayload: KiwifyWebhookRawPayload;
}

export interface KiwifyApiSubscriptionResponse {
  id: string;
  status: KiwifySubscriptionStatus;
  start_date?: string;
  next_payment?: string;
  plan?: {
    id?: string;
    name?: string;
  };
  customer?: {
    full_name?: string;
    email?: string;
  };
}

export interface AlunoSubscriptionSummary {
  id: string;
  idAluno: string;
  planoNome: string;
  status: KiwifySubscriptionStatus;
  dataInicio?: string | null;
  proximaCobranca?: string | null;
  kiwifySubscriptionId?: string | null;
  atualizadoEm: string;
}
