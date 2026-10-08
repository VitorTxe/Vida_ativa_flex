"use client";

import React, { useEffect, useMemo, useState } from "react";
import { GraduationCap, LoaderCircle, Search, ShieldCheck, UserPlus, Users } from "lucide-react";
import type { AdminRole, AdminUserStatus, ManagedUser } from "@/frontend/types/admin-users.types";
import { AdminUserCard } from "./admin-user-card";
import { NewUserDialog } from "./new-user-dialog";

interface AdminUsersTabProps {
  currentUserId?: string;
}

export function AdminUsersTab({ currentUserId }: AdminUsersTabProps): React.JSX.Element {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | AdminRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | AdminUserStatus>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/users")
      .then(async (res) => {
        if (!res.ok) throw new Error("Não foi possível carregar a lista de usuários.");
        return (await res.json()) as { users: ManagedUser[] };
      })
      .then((data) => {
        if (active) {
          setUsers(data.users || []);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          console.error("[AdminUsersTab Error]:", err);
          setFeedback({ type: "error", message: "Erro ao buscar usuários do sistema." });
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleUpdateRole = async (idAluno: string, newRole: AdminRole) => {
    setActionLoadingId(idAluno);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/users/${idAluno}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = (await res.json()) as { user?: ManagedUser; error?: string };
      if (!res.ok || !data.user) throw new Error(data.error || "Falha ao alterar papel.");
      setUsers((prev) => prev.map((u) => (u.idAluno === idAluno ? data.user! : u)));
      setFeedback({ type: "success", message: `Papel atualizado para ${newRole === "professor" ? "Professor" : "Aluno"}.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao alterar papel do usuário.";
      console.error("[UpdateRole Error]:", err);
      setFeedback({ type: "error", message: msg });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateStatus = async (idAluno: string, newStatus: AdminUserStatus) => {
    setActionLoadingId(idAluno);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/users/${idAluno}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ statusPagamento: newStatus }),
      });
      const data = (await res.json()) as { user?: ManagedUser; error?: string };
      if (!res.ok || !data.user) throw new Error(data.error || "Falha ao alterar status.");
      setUsers((prev) => prev.map((u) => (u.idAluno === idAluno ? data.user! : u)));
      setFeedback({ type: "success", message: `Status alterado para ${newStatus}.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao alterar status do usuário.";
      console.error("[UpdateStatus Error]:", err);
      setFeedback({ type: "error", message: msg });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSyncKiwify = async (idAluno: string) => {
    setActionLoadingId(idAluno);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/subscriptions/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idAluno }),
      });
      const data = (await res.json()) as { success?: boolean; message?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "Falha ao sincronizar com Kiwify.");
      setFeedback({ type: "success", message: data.message || "Assinatura sincronizada com a Kiwify." });
      
      const usersRes = await fetch("/api/admin/users");
      if (usersRes.ok) {
        const usersData = (await usersRes.json()) as { users: ManagedUser[] };
        setUsers(usersData.users || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao sincronizar com Kiwify.";
      console.error("[SyncKiwify Error]:", err);
      setFeedback({ type: "error", message: msg });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.nome.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter !== "all" && u.statusPagamento !== statusFilter) return false;
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalProfessores = users.filter((u) => u.role === "professor").length;
  const totalAlunosAtivos = users.filter((u) => u.role === "aluno" && u.statusPagamento === "Ativo").length;

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center gap-2 text-xs text-muted-foreground">
        <LoaderCircle className="size-5 animate-spin text-primary" /> Carregando gestão de usuários...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total de Usuários" value={users.length} icon={Users} />
        <StatCard label="Alunos Ativos" value={totalAlunosAtivos} icon={ShieldCheck} />
        <StatCard label="Professores / Admins" value={totalProfessores} icon={GraduationCap} />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="w-full rounded-xl border border-border bg-input py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as "all" | AdminRole)}
              className="rounded-xl border border-border bg-input px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Todos os papéis</option>
              <option value="professor">Professores</option>
              <option value="aluno">Alunos</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | AdminUserStatus)}
              className="rounded-xl border border-border bg-input px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Todos os status</option>
              <option value="Ativo">Ativos</option>
              <option value="Inativo">Inativos</option>
            </select>
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-black text-primary-foreground transition hover:opacity-90"
            >
              <UserPlus className="size-3.5" /> Adicionar Usuário
            </button>
          </div>
        </div>

        {feedback && (
          <div className={`rounded-xl border p-3 text-xs font-semibold ${
            feedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}>
            {feedback.message}
          </div>
        )}

        <div className="space-y-2 mt-2">
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">Nenhum usuário encontrado com os filtros atuais.</div>
          ) : (
            filteredUsers.map((user) => (
              <AdminUserCard
                key={user.idAluno}
                user={user}
                isSelf={user.idAluno === currentUserId}
                actionLoading={actionLoadingId === user.idAluno}
                onUpdateRole={handleUpdateRole}
                onUpdateStatus={handleUpdateStatus}
                onSyncKiwify={handleSyncKiwify}
              />
            ))
          )}
        </div>
      </div>

      <NewUserDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onUserCreated={(newUser) => {
          setUsers((prev) => [newUser, ...prev]);
          setFeedback({ type: "success", message: `Usuário ${newUser.nome} cadastrado com sucesso!` });
        }}
      />
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ComponentType<{ className?: string }> }): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-semibold">{label}</p>
        <p className="text-xl font-black text-foreground">{value}</p>
      </div>
    </div>
  );
}
