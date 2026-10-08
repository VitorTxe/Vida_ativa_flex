import { eq, sql } from "drizzle-orm";
import { getDb } from "@/backend/db";
import { assinaturasKiwify, kiwifyWebhookEvents, usuarios } from "@/backend/db/schema";
import type {
  AlunoSubscriptionSummary,
  KiwifyApiSubscriptionResponse,
  KiwifySubscriptionStatus,
  KiwifyWebhookRawPayload,
  NormalizedKiwifyEvent,
} from "@/backend/types/kiwify.types";

let kiwifyTablesEnsured = false;

/**
 * Garante em runtime que as tabelas assinaturas_kiwify e kiwify_webhook_events existam no D1.
 */
export async function ensureKiwifyInfrastructure(): Promise<void> {
  if (kiwifyTablesEnsured) return;
  const db = getDb();
  try {
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS assinaturas_kiwify (
        id TEXT PRIMARY KEY NOT NULL,
        id_aluno TEXT NOT NULL REFERENCES usuarios(id_aluno) ON DELETE CASCADE,
        kiwify_order_id TEXT,
        kiwify_subscription_id TEXT,
        kiwify_product_id TEXT,
        kiwify_plan_id TEXT,
        plano_nome TEXT NOT NULL DEFAULT 'Assinatura FLEX',
        status TEXT NOT NULL DEFAULT 'active',
        preco_centavos INTEGER,
        data_inicio TEXT,
        proxima_cobranca TEXT,
        atualizado_em TEXT NOT NULL
      )
    `);
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS kiwify_webhook_events (
        id TEXT PRIMARY KEY NOT NULL,
        event_type TEXT NOT NULL,
        order_id TEXT,
        subscription_id TEXT,
        processado_em TEXT NOT NULL,
        sucesso INTEGER NOT NULL DEFAULT 1,
        mensagem_erro TEXT
      )
    `);
    await db.run(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_assinaturas_kiwify_sub_id 
      ON assinaturas_kiwify(kiwify_subscription_id)
    `);
  } catch (err: unknown) {
    console.warn("[Kiwify Infrastructure Warning]: Tabelas já preparadas ou DDL dispensável.", err);
  }
  kiwifyTablesEnsured = true;
}

export { normalizeKiwifyPayload, verifyKiwifyWebhookSecurity } from "./kiwify-parser";

/**
 * Controle de idempotência: Verifica e registra o evento na tabela kiwify_webhook_events.
 * Retorna false se o evento idêntico já tiver sido processado com sucesso.
 */
export async function registerWebhookIdempotency(
  event: NormalizedKiwifyEvent
): Promise<boolean> {
  await ensureKiwifyInfrastructure();
  const db = getDb();
  const dedupKey = `${event.orderId || "noid"}_${event.eventType}_${event.subscriptionId || "nosub"}`;

  try {
    const [existing] = await db
      .select({ id: kiwifyWebhookEvents.id, sucesso: kiwifyWebhookEvents.sucesso })
      .from(kiwifyWebhookEvents)
      .where(eq(kiwifyWebhookEvents.id, dedupKey))
      .limit(1);

    if (existing && existing.sucesso) {
      console.info(`[Kiwify Idempotency] Evento ${dedupKey} já processado anteriormente. Ignorando.`);
      return false;
    }

    await db
      .insert(kiwifyWebhookEvents)
      .values({
        id: dedupKey,
        eventType: event.eventType,
        orderId: event.orderId || null,
        subscriptionId: event.subscriptionId || null,
        processadoEm: new Date().toISOString(),
        sucesso: true,
      })
      .onConflictDoUpdate({
        target: kiwifyWebhookEvents.id,
        set: {
          processadoEm: new Date().toISOString(),
          sucesso: true,
          mensagemErro: null,
        },
      });

    return true;
  } catch (err: unknown) {
    console.error("[Kiwify Idempotency Error]:", err);
    // Em caso de falha de verificação no banco, prossegue cautelosamente para não perder o webhook
    return true;
  }
}

/**
 * Processa a lógica de negócio do evento Kiwify (ativação, cancelamento, inadimplência).
 */
export async function processNormalizedKiwifyEvent(event: NormalizedKiwifyEvent): Promise<{
  success: boolean;
  action: string;
  idAluno?: string;
}> {
  await ensureKiwifyInfrastructure();
  const db = getDb();

  if (!event.customerEmail) {
    return { success: false, action: "missing_email" };
  }

  const [existingUser] = await db
    .select({
      idAluno: usuarios.idAluno,
      nome: usuarios.nome,
      email: usuarios.email,
      statusPagamento: usuarios.statusPagamento,
      role: usuarios.role,
    })
    .from(usuarios)
    .where(eq(usuarios.email, event.customerEmail))
    .limit(1);

  let idAluno = existingUser?.idAluno;
  const isOrderApproved =
    event.eventType.includes("order_approved") ||
    event.eventType.includes("order.approved") ||
    event.eventType.includes("subscription_renewed") ||
    event.orderStatus === "paid" ||
    event.subscriptionStatus === "active";

  const isOrderRevoked =
    event.eventType.includes("order_refunded") ||
    event.eventType.includes("order.refunded") ||
    event.eventType.includes("order_chargedback") ||
    event.eventType.includes("order.chargedback") ||
    event.orderStatus === "refunded" ||
    event.orderStatus === "chargedback";

  const isLateOrOverdue =
    event.eventType.includes("subscription_late") ||
    event.eventType.includes("subscription_overdue") ||
    event.subscriptionStatus === "overdue" ||
    event.subscriptionStatus === "late";

  const isCanceled =
    event.eventType.includes("subscription_canceled") ||
    event.subscriptionStatus === "canceled";

  // 1. Caso de Aprovação ou Renovação
  if (isOrderApproved) {
    if (!idAluno) {
      idAluno = crypto.randomUUID();
      await db.insert(usuarios).values({
        idAluno,
        nome: event.customerName,
        email: event.customerEmail,
        statusPagamento: "Ativo",
        role: "aluno",
        objetivo: "10k",
      });
      console.info(`[Kiwify Provisioning] Novo aluno criado com sucesso: ${event.customerEmail} (${idAluno})`);
    } else {
      await db
        .update(usuarios)
        .set({ statusPagamento: "Ativo" })
        .where(eq(usuarios.idAluno, idAluno));
      console.info(`[Kiwify Provisioning] Aluno reativado para Ativo: ${event.customerEmail}`);
    }

    // Upsert na tabela assinaturas_kiwify
    await upsertKiwifySubscription({
      idAluno,
      kiwifyOrderId: event.orderId,
      kiwifySubscriptionId: event.subscriptionId,
      kiwifyProductId: event.productId,
      kiwifyPlanId: event.planId,
      planoNome: event.planName || "Assinatura FLEX",
      status: "active",
      dataInicio: event.startDate || new Date().toISOString(),
      proximaCobranca: event.nextPaymentDate || null,
    });

    return { success: true, action: "activated", idAluno };
  }

  // 2. Caso de Inadimplência ou Atraso
  if (isLateOrOverdue) {
    if (idAluno) {
      await db
        .update(usuarios)
        .set({ statusPagamento: "Inativo" })
        .where(eq(usuarios.idAluno, idAluno));

      await updateSubscriptionStatusByCustomer(idAluno, "overdue", event.subscriptionId);
      console.info(`[Kiwify Subscription] Aluno suspenso por inadimplência: ${event.customerEmail}`);
    }
    return { success: true, action: "inactivated_overdue", idAluno };
  }

  // 3. Caso de Reembolso ou Chargeback
  if (isOrderRevoked) {
    if (idAluno) {
      await db
        .update(usuarios)
        .set({ statusPagamento: "Inativo" })
        .where(eq(usuarios.idAluno, idAluno));

      const finalStatus: KiwifySubscriptionStatus = event.orderStatus === "chargedback" ? "chargedback" : "refunded";
      await updateSubscriptionStatusByCustomer(idAluno, finalStatus, event.subscriptionId);
      console.info(`[Kiwify Subscription] Acesso revogado por reembolso/chargeback: ${event.customerEmail}`);
    }
    return { success: true, action: "inactivated_refund", idAluno };
  }

  // 4. Caso de Cancelamento
  if (isCanceled) {
    if (idAluno) {
      await updateSubscriptionStatusByCustomer(idAluno, "canceled", event.subscriptionId);

      // Se a data de próxima cobrança já passou ou não existe, inativa imediatamente
      const shouldDeactivateImmediately =
        !event.nextPaymentDate || new Date(event.nextPaymentDate).getTime() <= Date.now();

      if (shouldDeactivateImmediately) {
        await db
          .update(usuarios)
          .set({ statusPagamento: "Inativo" })
          .where(eq(usuarios.idAluno, idAluno));
        console.info(`[Kiwify Subscription] Assinatura cancelada e acesso inativado: ${event.customerEmail}`);
      } else {
        console.info(`[Kiwify Subscription] Assinatura cancelada, mantendo acesso até o fim do ciclo: ${event.nextPaymentDate}`);
      }
    }
    return { success: true, action: "canceled", idAluno };
  }

  return { success: true, action: "unhandled_event", idAluno };
}

/**
 * Salva ou atualiza os dados da assinatura Kiwify associada a um aluno.
 */
async function upsertKiwifySubscription(data: {
  idAluno: string;
  kiwifyOrderId?: string;
  kiwifySubscriptionId?: string;
  kiwifyProductId?: string;
  kiwifyPlanId?: string;
  planoNome: string;
  status: KiwifySubscriptionStatus;
  dataInicio?: string | null;
  proximaCobranca?: string | null;
}): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();

  if (data.kiwifySubscriptionId) {
    const [existing] = await db
      .select({ id: assinaturasKiwify.id })
      .from(assinaturasKiwify)
      .where(eq(assinaturasKiwify.kiwifySubscriptionId, data.kiwifySubscriptionId))
      .limit(1);

    if (existing) {
      await db
        .update(assinaturasKiwify)
        .set({
          planoNome: data.planoNome,
          status: data.status,
          proximaCobranca: data.proximaCobranca ?? undefined,
          atualizadoEm: now,
        })
        .where(eq(assinaturasKiwify.id, existing.id));
      return;
    }
  }

  const id = crypto.randomUUID();
  await db.insert(assinaturasKiwify).values({
    id,
    idAluno: data.idAluno,
    kiwifyOrderId: data.kiwifyOrderId || null,
    kiwifySubscriptionId: data.kiwifySubscriptionId || null,
    kiwifyProductId: data.kiwifyProductId || null,
    kiwifyPlanId: data.kiwifyPlanId || null,
    planoNome: data.planoNome,
    status: data.status,
    dataInicio: data.dataInicio || now,
    proximaCobranca: data.proximaCobranca || null,
    atualizadoEm: now,
  });
}

async function updateSubscriptionStatusByCustomer(
  idAluno: string,
  newStatus: KiwifySubscriptionStatus,
  subscriptionId?: string
): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();

  if (subscriptionId) {
    await db
      .update(assinaturasKiwify)
      .set({ status: newStatus, atualizadoEm: now })
      .where(eq(assinaturasKiwify.kiwifySubscriptionId, subscriptionId));
    return;
  }

  await db
    .update(assinaturasKiwify)
    .set({ status: newStatus, atualizadoEm: now })
    .where(eq(assinaturasKiwify.idAluno, idAluno));
}

/**
 * Consulta a assinatura ativa ou mais recente de um aluno.
 */
export async function getUserKiwifySubscription(idAluno: string): Promise<AlunoSubscriptionSummary | null> {
  await ensureKiwifyInfrastructure();
  const db = getDb();

  try {
    const [row] = await db
      .select({
        id: assinaturasKiwify.id,
        idAluno: assinaturasKiwify.idAluno,
        planoNome: assinaturasKiwify.planoNome,
        status: assinaturasKiwify.status,
        dataInicio: assinaturasKiwify.dataInicio,
        proximaCobranca: assinaturasKiwify.proximaCobranca,
        kiwifySubscriptionId: assinaturasKiwify.kiwifySubscriptionId,
        atualizadoEm: assinaturasKiwify.atualizadoEm,
      })
      .from(assinaturasKiwify)
      .where(eq(assinaturasKiwify.idAluno, idAluno))
      .limit(1);

    if (!row) return null;

    return {
      id: row.id,
      idAluno: row.idAluno,
      planoNome: row.planoNome,
      status: row.status as KiwifySubscriptionStatus,
      dataInicio: row.dataInicio,
      proximaCobranca: row.proximaCobranca,
      kiwifySubscriptionId: row.kiwifySubscriptionId,
      atualizadoEm: row.atualizadoEm,
    };
  } catch (err: unknown) {
    console.error("[GetUserKiwifySubscription Error]:", err);
    return null;
  }
}

/**
 * Consulta a API pública da Kiwify para reconciliar os dados de uma assinatura.
 */
export async function fetchKiwifySubscriptionFromApi(
  subscriptionId: string
): Promise<KiwifyApiSubscriptionResponse | null> {
  const apiKey = process.env.KIWIFY_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[Kiwify API]: KIWIFY_API_KEY não configurada. Impossível consultar endpoint REST.");
    return null;
  }

  const accountId = process.env.KIWIFY_ACCOUNT_ID?.trim();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
  };
  if (accountId) {
    headers["x-kiwify-account-id"] = accountId;
  }

  try {
    const url = `https://public-api.kiwify.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`;
    const res = await fetch(url, { method: "GET", headers });

    if (!res.ok) {
      console.error(`[Kiwify API Error]: Falha ao buscar assinatura ${subscriptionId} (Status ${res.status})`);
      return null;
    }

    const json = (await res.json()) as KiwifyApiSubscriptionResponse;
    return json;
  } catch (err: unknown) {
    console.error(`[Kiwify API Exception]: Erro ao conectar com API Kiwify:`, err);
    return null;
  }
}

/**
 * Sincroniza forçadamente uma assinatura de um aluno via API REST Kiwify.
 */
export async function syncUserSubscriptionFromApi(idAluno: string): Promise<AlunoSubscriptionSummary | null> {
  const current = await getUserKiwifySubscription(idAluno);
  if (!current?.kiwifySubscriptionId) {
    return null;
  }

  const apiData = await fetchKiwifySubscriptionFromApi(current.kiwifySubscriptionId);
  if (!apiData) {
    return current;
  }

  const db = getDb();
  const now = new Date().toISOString();
  const newStatus = apiData.status || current.status;
  const isNowActive = newStatus === "active";

  await db
    .update(assinaturasKiwify)
    .set({
      status: newStatus,
      proximaCobranca: apiData.next_payment ?? current.proximaCobranca,
      atualizadoEm: now,
    })
    .where(eq(assinaturasKiwify.id, current.id));

  // Sincroniza também a liberação de acesso do usuário no app
  await db
    .update(usuarios)
    .set({ statusPagamento: isNowActive ? "Ativo" : "Inativo" })
    .where(eq(usuarios.idAluno, idAluno));

  return {
    ...current,
    status: newStatus,
    proximaCobranca: apiData.next_payment ?? current.proximaCobranca,
    atualizadoEm: now,
  };
}
