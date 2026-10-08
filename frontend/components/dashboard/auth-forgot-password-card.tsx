"use client";

import React, { useState } from "react";
import { ArrowLeft, CheckCircle2, LoaderCircle, Mail } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";

interface AuthForgotPasswordCardProps {
  onBackToLogin: () => void;
}

export function AuthForgotPasswordCard({ onBackToLogin }: AuthForgotPasswordCardProps): React.JSX.Element {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        setError("Não foi possível processar a solicitação. Tente novamente.");
        return;
      }

      setSuccess(true);
    } catch (err: unknown) {
      console.error("Erro ao solicitar redefinição:", err);
      setError("Erro de conexão com o servidor. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="space-y-2">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Recuperação de conta</p>
        <h2 className="text-3xl font-black tracking-tight text-foreground">Esqueci minha senha</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Informe o e-mail da sua conta para receber as instruções e o link seguro de redefinição.
        </p>
      </div>

      {success ? (
        <div className="mt-8 space-y-6">
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-5 text-sm text-foreground">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-5 shrink-0 text-primary mt-0.5" />
              <div>
                <p className="font-black text-foreground">Solicitação enviada!</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Se o e-mail <strong>{email}</strong> estiver cadastrado em nossa base, você receberá um link em instantes para cadastrar uma nova senha.
                </p>
              </div>
            </div>
          </div>
          <Button
            type="button"
            onClick={onBackToLogin}
            className="h-12 w-full rounded-xl bg-primary font-black uppercase tracking-wide text-primary-foreground hover:bg-primary/90"
          >
            <ArrowLeft className="size-4" /> Voltar para o Login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block text-sm font-bold text-foreground">
            Seu E-mail
            <Input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              className="mt-1.5 h-12 rounded-xl border-border bg-background px-4"
            />
          </label>

          {error && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="h-12 w-full rounded-xl bg-primary font-black uppercase tracking-wide text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
          >
            {submitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" /> Enviando instruções...
              </>
            ) : (
              <>
                <Mail className="size-4" /> Enviar link de recuperação
              </>
            )}
          </Button>

          <button
            type="button"
            onClick={onBackToLogin}
            className="mt-4 flex w-full items-center justify-center gap-2 text-center text-sm font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Voltar para o Login
          </button>
        </form>
      )}
    </div>
  );
}
