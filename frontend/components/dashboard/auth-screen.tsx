import React, { useState } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, UserPlus } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import type { AuthUser } from "@/frontend/types/dashboard.types";
import { Brand } from "./dashboard-nav-items";

interface AuthScreenProps {
  onAuthenticated: (user: AuthUser) => void;
}

export function AuthScreen({ onAuthenticated }: AuthScreenProps): React.JSX.Element {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (mode === "register" && senha !== confirmarSenha) {
      setError("As senhas não coincidem. Confirme a mesma senha.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(mode === "login" ? { email, senha } : { nome, email, senha }),
      });
      const data = (await response.json()) as { user?: AuthUser; error?: string };
      if (!response.ok || !data.user) {
        setError(data.error ?? "Não foi possível continuar.");
        return;
      }
      onAuthenticated(data.user);
    } catch (err: unknown) {
      console.error("Erro na requisição de autenticação:", err);
      setError("Não foi possível acessar o servidor. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  function changeMode(nextMode: "login" | "register") {
    setMode(nextMode);
    setError("");
    setSenha("");
    setConfirmarSenha("");
  }

  return (
    <main className="grid min-h-screen bg-[#101010] text-white lg:grid-cols-[1fr_1fr]">
      <section className="relative hidden overflow-hidden border-r border-white/8 p-12 lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,215,0,.18),transparent_36%),linear-gradient(145deg,#181818,#0d0d0d)]" />
        <div className="relative"><Brand /></div>
        <div className="relative mt-auto max-w-xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#FFD700]">Assessoria sem agenda engessada</p>
          <h1 className="mt-5 text-6xl font-black leading-[.95] tracking-[-0.07em]">Corra no seu ritmo. Evolua com método.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-white/50">Três sessões flexíveis por semana, zonas personalizadas e autonomia para encaixar o treino na vida real.</p>
        </div>
      </section>
      <section className="flex items-center justify-center p-5 sm:p-10">
        <Card className="w-full max-w-md border-white/8 bg-[#191919] py-0 shadow-2xl">
          <CardContent className="p-6 sm:p-8">
            <div className="lg:hidden"><Brand /></div>
            <p className="mt-10 text-xs font-black uppercase tracking-[0.18em] text-[#FFD700] lg:mt-0">{mode === "login" ? "Bem-vindo de volta" : "Comece na FLEX"}</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em]">{mode === "login" ? "Entre para treinar" : "Crie sua conta"}</h2>
            <p className="mt-2 text-sm leading-6 text-white/45">{mode === "login" ? "Use seu e-mail e senha para continuar." : "Informe seus dados para acessar seu plano."}</p>
            <form onSubmit={submit} className="mt-8 space-y-4">
              {mode === "register" && (
                <label className="block text-sm font-bold">
                  Nome
                  <Input type="text" autoComplete="name" required minLength={2} maxLength={80} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome completo" className="mt-1.5 h-12 rounded-xl border-white/10 bg-black/25 px-4" />
                </label>
              )}
              <label className="block text-sm font-bold">
                E-mail
                <Input type="email" autoComplete="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" className="mt-1.5 h-12 rounded-xl border-white/10 bg-black/25 px-4" />
              </label>

              <label className="block text-sm font-bold">
                Senha
                <div className="relative mt-1.5">
                  <Input
                    type={showSenha ? "text" : "password"}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    required
                    minLength={8}
                    maxLength={128}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Mínimo de 8 caracteres"
                    className="h-12 rounded-xl border-white/10 bg-black/25 pl-4 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(!showSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-white/40 transition hover:text-white"
                    title={showSenha ? "Ocultar senha" : "Exibir senha"}
                    tabIndex={-1}
                  >
                    {showSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </label>

              {mode === "register" && (
                <label className="block text-sm font-bold">
                  Confirmar Senha
                  <div className="relative mt-1.5">
                    <Input
                      type={showConfirmarSenha ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      maxLength={128}
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      placeholder="Repita a senha digitada"
                      className="h-12 rounded-xl border-white/10 bg-black/25 pl-4 pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-white/40 transition hover:text-white"
                      title={showConfirmarSenha ? "Ocultar senha" : "Exibir senha"}
                      tabIndex={-1}
                    >
                      {showConfirmarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </label>
              )}

              {error && <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200" role="alert">{error}</p>}
              <Button type="submit" disabled={submitting} className="h-12 w-full rounded-xl bg-[#FFD700] font-extrabold text-black hover:bg-[#ffe13d]">
                {submitting ? <><LoaderCircle className="animate-spin" /> Aguarde</> : mode === "login" ? <>Entrar na FLEX <ArrowRight /></> : <>Criar minha conta <UserPlus /></>}
              </Button>
            </form>
            <button type="button" onClick={() => changeMode(mode === "login" ? "register" : "login")} className="mt-5 w-full text-center text-sm font-semibold text-white/55 transition hover:text-[#FFD700]">
              {mode === "login" ? "Ainda não tem conta? Cadastre-se" : "Já tem uma conta? Entrar"}
            </button>
            <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-white/35"><LockKeyhole className="size-3.5" /> Ambiente protegido e acesso individual</p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
