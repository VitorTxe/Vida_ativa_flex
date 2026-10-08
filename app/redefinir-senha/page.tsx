"use client";

import React, { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";

function ResetPasswordForm(): React.JSX.Element {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Token de redefinição não encontrado. Solicite um novo link de recuperação.");
    }
  }, [token]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (novaSenha !== confirmarSenha) {
      setError("As senhas não coincidem. Digite a mesma senha nos dois campos.");
      return;
    }

    if (novaSenha.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, novaSenha }),
      });

      const data = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !data.success) {
        setError(data.error ?? "Não foi possível redefinir a senha. O link pode ter expirado.");
        return;
      }

      setSuccess(true);
    } catch (err: unknown) {
      console.error("Erro na redefinição de senha:", err);
      setError("Erro de conexão com o servidor. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-border bg-card py-0 shadow-2xl">
      <CardContent className="p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <Image src="/logo-symbol.svg" alt="Vida Ativa FLEX" width={32} height={32} priority />
          <span className="text-xs font-black tracking-tight text-foreground">
            VIDA ATIVA <span className="text-primary">FLEX</span>
          </span>
        </div>

        <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Segurança</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground sm:text-3xl">Criar nova senha</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Escolha uma senha segura com no mínimo 8 caracteres para acessar seus treinos.
        </p>

        {success ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-5 text-sm text-foreground">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="size-5 shrink-0 text-primary mt-0.5" />
                <div>
                  <p className="font-black text-foreground">Senha alterada com sucesso!</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Sua nova senha já está ativa. Você pode entrar agora mesmo na sua conta.
                  </p>
                </div>
              </div>
            </div>
            <Button asChild className="h-12 w-full rounded-xl bg-primary font-black uppercase tracking-wide text-primary-foreground hover:bg-primary/90">
              <Link href="/?mode=login">
                Entrar na minha conta <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block text-sm font-bold text-foreground">
              Nova Senha
              <div className="relative mt-1.5">
                <Input
                  type={showSenha ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={128}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                  className="h-12 rounded-xl border-border bg-background pl-4 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground transition hover:text-foreground"
                  tabIndex={-1}
                >
                  {showSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>

            <label className="block text-sm font-bold text-foreground">
              Confirmar Nova Senha
              <div className="relative mt-1.5">
                <Input
                  type={showConfirmar ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={128}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="h-12 rounded-xl border-border bg-background pl-4 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmar(!showConfirmar)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground transition hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmar ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>

            {error && (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={submitting || !token}
              className="h-12 w-full rounded-xl bg-primary font-black uppercase tracking-wide text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
            >
              {submitting ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" /> Atualizando senha...
                </>
              ) : (
                <>
                  Salvar Nova Senha <ArrowRight className="size-4" />
                </>
              )}
            </Button>

            <div className="pt-2 text-center">
              <Link href="/?mode=login" className="text-xs font-semibold text-muted-foreground transition hover:text-foreground">
                Lembrou sua senha? Voltar para o login
              </Link>
            </div>
          </form>
        )}

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <LockKeyhole className="size-3.5" /> Conexão criptografada de ponta a ponta
        </p>
      </CardContent>
    </Card>
  );
}

export default function RedefinirSenhaPage(): React.JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-5 text-foreground">
      <Suspense fallback={<LoaderCircle className="size-8 animate-spin text-primary" />}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
