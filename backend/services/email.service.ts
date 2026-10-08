import { Resend } from "resend";

export interface SendPasswordResetEmailParams {
  toEmail: string;
  userName: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail({
  toEmail,
  userName,
  resetUrl,
}: SendPasswordResetEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || "Vida Ativa FLEX <onboarding@resend.dev>";

  if (!apiKey) {
    console.info(
      `\n[AUTH DEV - RESEND_API_KEY não configurada]\nDestinatário: ${toEmail}\nLink de redefinição: ${resetUrl}\n`
    );
    return { success: true, id: "dev-mock-id" };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: "Recuperação de Senha · Vida Ativa FLEX",
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Redefinição de Senha</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #101010; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8f8f3;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #101010; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" style="max-width: 520px; background-color: #1e1e1e; border: 1px solid #333333; border-radius: 16px; padding: 36px 32px;">
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <span style="font-size: 18px; font-weight: 900; letter-spacing: -0.04em; color: #f8f8f3;">
                        VIDA ATIVA <span style="color: #ffd700;">FLEX</span>
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size: 20px; font-weight: 800; color: #f8f8f3; padding-bottom: 12px; text-align: center;">
                      Redefinição de Senha
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size: 14px; line-height: 1.6; color: #a3a3a3; padding-bottom: 24px; text-align: center;">
                      Olá, <strong>${userName}</strong>.<br>
                      Recebemos uma solicitação para redefinir a senha da sua conta no Vida Ativa FLEX. Clique no botão abaixo para cadastrar uma nova senha:
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom: 28px;">
                      <a href="${resetUrl}" target="_blank" style="display: inline-block; background-color: #ffd700; color: #101010; font-size: 14px; font-weight: 900; text-decoration: none; padding: 14px 28px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.05em;">
                        Criar Nova Senha
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size: 12px; line-height: 1.5; color: #737373; border-top: 1px solid #2a2a2a; padding-top: 20px; text-align: center;">
                      Este link expira em <strong>30 minutos</strong> e só pode ser utilizado uma vez.<br>
                      Se você não solicitou a alteração, por favor ignore esta mensagem. Sua conta permanece segura.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("[Resend Error]:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: unknown) {
    console.error("[Resend Exception]:", err);
    const message = err instanceof Error ? err.message : "Erro ao enviar e-mail.";
    return { success: false, error: message };
  }
}
