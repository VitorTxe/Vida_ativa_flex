"use client";

import React from "react";
import { CheckCircle2, GraduationCap, LoaderCircle, ShieldAlert, User, XCircle } from "lucide-react";
import type { AdminRole, AdminUserStatus, ManagedUser } from "@/frontend/types/admin-users.types";

interface AdminUserCardProps {
  user: ManagedUser;
  isSelf: boolean;
  actionLoading: boolean;
  onUpdateRole: (idAluno: string, newRole: AdminRole) => Promise<void>;
  onUpdateStatus: (idAluno: string, newStatus: AdminUserStatus) => Promise<void>;
}

export function AdminUserCard({
  user,
  isSelf,
  actionLoading,
  onUpdateRole,
  onUpdateStatus,
}: AdminUserCardProps): React.JSX.Element {
  const isProfessor = user.role === "professor";
  const isAtivo = user.statusPagamento === "Ativo";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3 min-w-0">
        <div className={`grid size-10 shrink-0 place-items-center rounded-xl ${
          isProfessor ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}>
          {isProfessor ? <GraduationCap className="size-5" /> : <User className="size-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-black text-foreground">{user.nome}</p>
            {isSelf && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-black text-primary">
                Você
              </span>
            )}
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${
              isProfessor ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
            }`}>
              {isProfessor ? "Professor (Admin)" : "Aluno"}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${
              isAtivo ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/15 text-destructive"
            }`}>
              {isAtivo ? <CheckCircle2 className="size-2.5" /> : <XCircle className="size-2.5" />}
              {isAtivo ? "Ativo" : "Inativo"}
            </span>
          </div>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>Alvo: <strong className="text-foreground uppercase">{user.objetivo}</strong></span>
            <span>·</span>
            <span>{user.totalTreinosConcluidos} treinos realizados</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border sm:border-t-0 sm:pt-0">
        <button
          type="button"
          disabled={isSelf || actionLoading}
          onClick={() => void onUpdateRole(user.idAluno, isProfessor ? "aluno" : "professor")}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition disabled:opacity-40 ${
            isProfessor
              ? "border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
          }`}
          title={isSelf ? "Você não pode revogar sua própria permissão de professor" : undefined}
        >
          {actionLoading ? <LoaderCircle className="size-3.5 animate-spin" /> : <GraduationCap className="size-3.5" />}
          <span>{isProfessor ? "Rebaixar para Aluno" : "Promover a Professor"}</span>
        </button>

        <button
          type="button"
          disabled={isSelf || actionLoading}
          onClick={() => void onUpdateStatus(user.idAluno, isAtivo ? "Inativo" : "Ativo")}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition disabled:opacity-40 ${
            isAtivo
              ? "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
          }`}
          title={isSelf ? "Você não pode inativar seu próprio acesso" : undefined}
        >
          {actionLoading ? <LoaderCircle className="size-3.5 animate-spin" /> : <ShieldAlert className="size-3.5" />}
          <span>{isAtivo ? "Inativar" : "Ativar"}</span>
        </button>
      </div>
    </div>
  );
}
