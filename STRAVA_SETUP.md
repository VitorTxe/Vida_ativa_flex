# Configuração da integração Strava

## 1. Aplicativo no Strava

No painel `https://www.strava.com/settings/api`, configure:

- desenvolvimento: domínio de callback `localhost`;
- produção: apenas o host público, sem protocolo nem caminho;
- a URL de callback usada pelo app é `/api/strava/callback`.

Exemplo de produção:

```text
Site: https://app.exemplo.com
Authorization Callback Domain: app.exemplo.com
Redirect URI: https://app.exemplo.com/api/strava/callback
```

## 2. Variáveis locais

Copie os campos Strava de `.env.example` para `.env.local` e preencha:

```env
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_REDIRECT_URI=http://localhost:3000/api/strava/callback
STRAVA_TOKEN_ENCRYPTION_KEY=
STRAVA_WEBHOOK_VERIFY_TOKEN=
STRAVA_WEBHOOK_SUBSCRIPTION_ID=
```

Gere uma chave de criptografia aleatória com:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Nunca exponha `STRAVA_CLIENT_SECRET`, `STRAVA_TOKEN_ENCRYPTION_KEY`, access tokens ou refresh tokens no frontend ou no Git.

## 3. Banco de dados

A migração da integração está em `drizzle/0003_next_doorman.sql`.

Para o banco local usado pelo Wrangler:

```powershell
npx wrangler d1 execute vida-ativa-flex-db --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0003_next_doorman.sql
```

Antes de publicar, aplique a mesma migração no D1 remoto usando o fluxo de deploy adotado pelo projeto. O arquivo `schema_producao.sql` também contém as tabelas para instalações novas.

## 4. Webhook

O endpoint está disponível em:

```text
https://SEU-DOMINIO/api/strava/webhook
```

Crie uma única assinatura no endpoint `POST https://www.strava.com/api/v3/push_subscriptions`, usando o Client ID, Client Secret, URL acima e o mesmo valor de `STRAVA_WEBHOOK_VERIFY_TOKEN`. Salve o `id` retornado em `STRAVA_WEBHOOK_SUBSCRIPTION_ID`.

Sem esse último valor, eventos recebidos são reconhecidos com HTTP 200, mas ignorados para impedir exclusões forjadas.

## 5. Fluxo no produto

1. O atleta conecta a conta pelo botão oficial do Strava.
2. O servidor troca o código OAuth e criptografa os tokens com AES-GCM.
3. O atleta abre um treino e seleciona **Importar do Strava**.
4. A atividade selecionada é conferida novamente no servidor e vinculada à sessão.
5. O access token é renovado automaticamente antes de expirar.
6. Ao desconectar ou revogar acesso, os dados de atividades importados do Strava são removidos.
