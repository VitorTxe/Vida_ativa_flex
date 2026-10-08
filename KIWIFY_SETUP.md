# Guia de Configuração da Integração com a Kiwify

Este documento descreve como configurar a integração em tempo real entre o **Vida Ativa - FLEX** e a plataforma **Kiwify** para gerenciamento automatizado do ciclo de vida das assinaturas.

---

## 1. Visão Geral da Arquitetura

- **Endpoint de Webhook:** `POST /api/webhooks/kiwify`
- **Validação de Segurança:** Token secreto via query param (`?token=...`), header (`x-kiwify-signature`) ou assinatura no payload.
- **Idempotência:** Controle automático na tabela `kiwify_webhook_events`. Eventos repetidos retornam HTTP 200 sem reprocessamento duplicado.
- **Sincronização em Tempo Real:**
  - `order_approved` ou `subscription_renewed` -> Criação ou ativação da conta do aluno (`statusPagamento = 'Ativo'`) e gravação da assinatura em `assinaturas_kiwify`.
  - `subscription_canceled` -> Atualiza status da assinatura para cancelada (inativa o aluno se o ciclo estiver vencido).
  - `subscription_late` / `subscription_overdue` -> Bloqueia o acesso imediatamente (`statusPagamento = 'Inativo'`).
  - `order_refunded` / `order_chargedback` -> Inativa imediatamente a conta.

---

## 2. Passo a Passo no Painel da Kiwify

### 2.1. Configuração do Webhook

1. Acesse o painel da **Kiwify** (`https://dashboard.kiwify.com.br`).
2. No menu lateral, acesse **Apps** > **Webhooks**.
3. Clique em **Criar Webhook**.
4. Defina o nome do webhook (ex: `Vida Ativa FLEX - Produção`).
5. No campo **URL do Webhook**, insira a URL da sua aplicação com o token secreto:
   ```
   https://seu-dominio.com/api/webhooks/kiwify?token=SEU_TOKEN_SECRETO
   ```
   *(Substitua `SEU_TOKEN_SECRETO` pelo mesmo valor definido na variável `KIWIFY_WEBHOOK_SECRET` do seu `.env.local` / Cloudflare).*
6. Selecione os eventos (*triggers*) desejados:
   - ✅ **Compra aprovada** (`order_approved`)
   - ✅ **Assinatura renovada** (`subscription_renewed`)
   - ✅ **Assinatura cancelada** (`subscription_canceled`)
   - ✅ **Assinatura atrasada** (`subscription_late`)
   - ✅ **Reembolso** (`order_refunded`)
   - ✅ **Chargeback** (`order_chargedback`)
7. Salve as configurações do Webhook.

---

## 3. Variáveis de Ambiente

Configure as seguintes variáveis no arquivo `.env.local` (ambiente de desenvolvimento) e nas variáveis do Cloudflare Pages / Workers:

```env
# Token secreto para validar a autenticidade dos webhooks da Kiwify
KIWIFY_WEBHOOK_SECRET=sua_chave_secreta_aqui

# (Opcional) Chave de API pública para reconciliação manual (Apps > API na Kiwify)
KIWIFY_API_KEY=

# (Opcional) Account ID caso exigido pela sua conta Kiwify
KIWIFY_ACCOUNT_ID=
```

---

## 4. Testes e Validação de Webhook

Você pode simular requisições de teste diretamente via `cURL` ou PowerShell:

### Exemplo: Simulando uma Compra Aprovada (`order_approved`)
```bash
curl -X POST "http://localhost:3000/api/webhooks/kiwify?token=sua_chave_secreta_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ord_teste_123",
    "order_status": "paid",
    "Customer": {
      "full_name": "Atleta Teste",
      "email": "atleta.teste@exemplo.com",
      "mobile": "11999999999"
    },
    "Subscription": {
      "id": "sub_teste_456",
      "status": "active",
      "start_date": "2026-10-02T00:00:00Z",
      "next_payment": "2026-11-02T00:00:00Z",
      "plan": {
        "id": "plano_mensal",
        "name": "Plano FLEX Mensal"
      }
    }
  }'
```

### Resposta Esperada (HTTP 200):
```json
{
  "received": true,
  "action": "activated",
  "idAluno": "uuid-do-aluno",
  "status": "success"
}
```

---

## 5. Visualização na Aplicação

- **Perfil do Aluno (`ProfileView`):** Exibe o nome do plano contratado, badge dinâmico do status e a data real da próxima cobrança.
- **Painel do Professor/Admin (`AdminDashboardView`):** Indica se o aluno possui vínculo com a Kiwify e disponibiliza botão para sincronização manual sob demanda via API.
