import { NextResponse } from "next/server";
import {
  normalizeKiwifyPayload,
  processNormalizedKiwifyEvent,
  registerWebhookIdempotency,
  verifyKiwifyWebhookSecurity,
} from "@/backend/services/kiwify.service";
import type { KiwifyWebhookRawPayload } from "@/backend/types/kiwify.types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rawBody = (await request.json().catch(() => null)) as KiwifyWebhookRawPayload | null;

    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json({ error: "Corpo da requisição inválido ou ausente." }, { status: 400 });
    }

    // 1. Verificação de segurança (token ou assinatura)
    const isAuthorized = verifyKiwifyWebhookSecurity(request, rawBody);
    if (!isAuthorized) {
      console.warn("[Kiwify Webhook] Tentativa de webhook com assinatura/token inválido.");
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    // 2. Normalização do evento
    const event = normalizeKiwifyPayload(rawBody);

    // 3. Controle de Idempotência
    const isNewEvent = await registerWebhookIdempotency(event);
    if (!isNewEvent) {
      return NextResponse.json(
        { received: true, message: "Evento já processado anteriormente.", eventId: event.eventId },
        { status: 200 }
      );
    }

    // 4. Processamento das regras de negócio
    const result = await processNormalizedKiwifyEvent(event);

    return NextResponse.json(
      {
        received: true,
        action: result.action,
        idAluno: result.idAluno,
        status: "success",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[Kiwify Webhook Exception]: Erro crítico ao processar webhook:", error);
    const message = error instanceof Error ? error.message : "Erro interno no processamento do webhook.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
