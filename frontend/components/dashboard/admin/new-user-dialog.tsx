"use client";

import React, { useState } from "react";
import { LoaderCircle, UserPlus, X } from "lucide-react";
import type { AdminRole, CreateUserPayload, ManagedUser } from "@/frontend/types/admin-users.types";
import type { Goal } from "@/frontend/lib/fitness-data";

interface NewUserDialogProps {
  open: boolean;
  onClose: () => void;
  onUserCreated: (newUser: ManagedUser) => void;
}

export function NewUserDialog({ open, onClose, onUserCreated }: NewUserDialogProps): React.JSX.Element | null {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [role, setRole] = useState<AdminRole>("aluno");
  const [objetivo, setObjetivo] = useState<Goal | "42k">("10k");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (nome.trim().length < 2) {
      setErrorMsg("O nome deve ter no mínimo 2 caracteres.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg("Informe um e-mail válido.");
      return;
    }
    if (senha.length < 8) {
      setErrorMsg("A senha inicial deve ter no mínimo 8 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const payload: CreateUserPayload = {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha,
        role,
        objetivo,
        statusPagamento: "Ativo",
      };

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { user?: ManagedUser; error?: string };

      if (!response.ok || !data.user) {
        throw new Error(data.error || "Falha ao criar usuário.");
      }

      onUserCreated(data.user);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido ao cadastrar usuário.";
      console.error("[NewUserDialog Error]:", err);
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 rounded-xl p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Fechar"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UserPlus className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground">Novo Usuário</h2>
            <p className="text-xs text-muted-foreground">Cadastre um atleta ou novo professor na plataforma.</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome Completo</label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Carlos Silva"
              className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="atleta@exemplo.com"
              className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Senha Inicial</label>
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Papel (Permissão)</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as AdminRole)}
                className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="aluno">Aluno</option>
                <option value="professor">Professor (Admin)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Objetivo Inicial</label>
              <select
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value as Goal | "42k")}
                className="mt-1 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="5k">5 km</option>
                <option value="10k">10 km</option>
                <option value="21k">21 km</option>
                <option value="42k">42 km</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-black text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {loading && <LoaderCircle className="size-4 animate-spin" />}
              {loading ? "Cadastrando..." : "Cadastrar Usuário"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
