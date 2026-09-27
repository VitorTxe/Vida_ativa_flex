"use client";

import React, { useEffect, useState } from "react";
import { Activity, GraduationCap, LoaderCircle, ShieldCheck } from "lucide-react";
import type { StudentSummary } from "@/frontend/types/messages.types";
import { AdminStudentsList } from "./admin-students-list";
import { AdminStudentTrainings } from "./admin-student-trainings";
import { AdminStudentChat } from "./admin-student-chat";
import { AdminUsersTab } from "./admin-users-tab";

interface AdminDashboardViewProps {
  currentUserId?: string;
}

export function AdminDashboardView({ currentUserId }: AdminDashboardViewProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<"trainings" | "users">("trainings");
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reloadStudents = async () => {
    try {
      const res = await fetch("/api/admin/students");
      if (!res.ok) throw new Error("Não foi possível recarregar alunos.");
      const data = (await res.json()) as { students: StudentSummary[] };
      setStudents(data.students || []);
    } catch (err: unknown) {
      console.error("Erro ao recarregar alunos:", err);
    }
  };

  useEffect(() => {
    let active = true;
    fetch("/api/admin/students")
      .then(async (res) => {
        if (!res.ok) throw new Error("Não foi possível carregar os alunos.");
        return (await res.json()) as { students: StudentSummary[] };
      })
      .then((data) => {
        if (active) {
          setStudents(data.students || []);
          if (data.students && data.students.length > 0 && !selectedStudentId) {
            setSelectedStudentId(data.students[0].idAluno);
          }
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          console.error("Erro ao carregar dados do admin:", err);
          setError("Erro ao carregar painel administrativo.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [selectedStudentId]);

  const selectedStudent = students.find((s) => s.idAluno === selectedStudentId) ?? students[0];

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center gap-2 text-xs text-muted-foreground">
        <LoaderCircle className="size-5 animate-spin text-primary" /> Carregando painel do professor...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-center text-xs text-destructive">
        <p className="font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
            <GraduationCap className="size-4" /> Painel do Treinador (Admin)
          </span>
          <h1 className="mt-1 text-2xl font-black text-foreground">
            {activeTab === "trainings" ? "Gestão de Alunos & Treinos" : "Gestão de Acessos & Usuários"}
          </h1>
        </div>

        {/* Seletor de Abas Responsivo */}
        <div className="flex rounded-xl border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => setActiveTab("trainings")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeTab === "trainings"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Activity className="size-3.5" /> Treinos & Alunos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeTab === "users"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldCheck className="size-3.5" /> Gestão de Usuários
          </button>
        </div>
      </div>

      {activeTab === "trainings" ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(300px,360px)_1fr]">
          <AdminStudentsList
            students={students}
            selectedStudentId={selectedStudent?.idAluno ?? null}
            onSelectStudent={(id) => setSelectedStudentId(id)}
          />

          {selectedStudent ? (
            <div className="flex flex-col gap-5">
              <AdminStudentTrainings student={selectedStudent} />
              <AdminStudentChat
                idAluno={selectedStudent.idAluno}
                alunoNome={selectedStudent.nome}
                onMessageSent={reloadStudents}
              />
            </div>
          ) : (
            <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-border bg-card p-6 text-xs text-muted-foreground">
              Nenhum aluno selecionado.
            </div>
          )}
        </div>
      ) : (
        <AdminUsersTab currentUserId={currentUserId} />
      )}
    </div>
  );
}
