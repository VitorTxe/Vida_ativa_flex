import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeKiwifyPayload, verifyKiwifyWebhookSecurity } from "@/backend/services/kiwify-parser";
import type { KiwifyWebhookRawPayload } from "@/backend/types/kiwify.types";

describe("Integração Kiwify - Parser e Segurança", () => {
  it("deve normalizar corretamente payload no formato envelope moderno (v1)", () => {
    const envelopePayload: KiwifyWebhookRawPayload = {
      id: "evt_123456",
      type: "order_approved",
      version: "1.0",
      created_at: "2026-10-02T12:00:00Z",
      data: {
        order_id: "ord_98765",
        order_status: "paid",
        Customer: {
          full_name: "Carlos Silveira",
          email: "carlos@teste.com",
          mobile: "11988887777",
        },
        Subscription: {
          id: "sub_555",
          status: "active",
          start_date: "2026-10-02T00:00:00Z",
          next_payment: "2026-11-02T00:00:00Z",
          plan: {
            id: "plan_mensal",
            name: "Plano FLEX Pro",
          },
        },
        Product: {
          product_id: "prod_001",
          product_name: "Vida Ativa - FLEX",
        },
      },
    };

    const normalized = normalizeKiwifyPayload(envelopePayload);

    assert.equal(normalized.orderId, "ord_98765");
    assert.equal(normalized.customerEmail, "carlos@teste.com");
    assert.equal(normalized.customerName, "Carlos Silveira");
    assert.equal(normalized.subscriptionId, "sub_555");
    assert.equal(normalized.subscriptionStatus, "active");
    assert.equal(normalized.planName, "Plano FLEX Pro");
    assert.equal(normalized.nextPaymentDate, "2026-11-02T00:00:00Z");
  });

  it("deve normalizar corretamente payload no formato clássico raiz", () => {
    const classicPayload: KiwifyWebhookRawPayload = {
      order_id: "ord_classic_111",
      order_status: "paid",
      Customer: {
        full_name: "Mariana Souza",
        email: "mariana@teste.com",
      },
      Subscription: {
        id: "sub_classic_222",
        status: "active",
        plan: {
          name: "Assinatura Trimestral",
        },
      },
    };

    const normalized = normalizeKiwifyPayload(classicPayload);

    assert.equal(normalized.orderId, "ord_classic_111");
    assert.equal(normalized.customerEmail, "mariana@teste.com");
    assert.equal(normalized.customerName, "Mariana Souza");
    assert.equal(normalized.subscriptionStatus, "active");
    assert.equal(normalized.planName, "Assinatura Trimestral");
  });

  it("deve identificar status canceled, overdue e refunded", () => {
    const canceledPayload: KiwifyWebhookRawPayload = {
      order_id: "ord_cancel_1",
      Customer: { email: "cancel@teste.com" },
      Subscription: { status: "canceled" },
    };
    assert.equal(normalizeKiwifyPayload(canceledPayload).subscriptionStatus, "canceled");

    const overduePayload: KiwifyWebhookRawPayload = {
      order_id: "ord_overdue_1",
      Customer: { email: "late@teste.com" },
      Subscription: { status: "overdue" },
    };
    assert.equal(normalizeKiwifyPayload(overduePayload).subscriptionStatus, "overdue");

    const refundedPayload: KiwifyWebhookRawPayload = {
      order_id: "ord_refund_1",
      Customer: { email: "refund@teste.com" },
      Subscription: { status: "refunded" },
    };
    assert.equal(normalizeKiwifyPayload(refundedPayload).subscriptionStatus, "refunded");
  });

  it("deve validar o token secreto fornecido via query param ou payload", () => {
    const previousSecret = process.env.KIWIFY_WEBHOOK_SECRET;
    try {
      process.env.KIWIFY_WEBHOOK_SECRET = "segredo_super_seguro_kiwify";

      // Query param válido
      const validReq = new Request("http://localhost:3000/api/webhooks/kiwify?token=segredo_super_seguro_kiwify");
      assert.equal(verifyKiwifyWebhookSecurity(validReq, {}), true);

      // Query param inválido
      const invalidReq = new Request("http://localhost:3000/api/webhooks/kiwify?token=token_errado");
      assert.equal(verifyKiwifyWebhookSecurity(invalidReq, {}), false);

      // Assinatura válida no payload
      const validPayloadReq = new Request("http://localhost:3000/api/webhooks/kiwify");
      assert.equal(
        verifyKiwifyWebhookSecurity(validPayloadReq, { signature: "segredo_super_seguro_kiwify" }),
        true
      );
    } finally {
      process.env.KIWIFY_WEBHOOK_SECRET = previousSecret;
    }
  });
});
