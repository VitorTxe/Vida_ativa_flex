"use client";

import React, { useState } from "react";
import { LoaderCircle, Plus, Sparkles } from "lucide-react";
import type { TrainingSession } from "@/backend/types";
import type { StudentSummary, StudentTrainingDetail } from "@/frontend/types";
import { Button } from "@/components/ui/button";
import { useAdminStudentTrainings } from "@/frontend/hooks/use-admin-student-trainings";
import { AdminStudentTrainingsHeader } from "./admin-student-trainings-header";
import { AdminTrainingSessionCard } from "./admin-training-session-card";
import { AdminSessionFormDialog } from "./admin-session-form-dialog";
import { AdminDeleteSessionDialog } from "./admin-delete-session-dialog";
import { AdminCompletedTrainingsList } from "./admin-completed-trainings-list";

interface AdminStudentTrainingsProps {
  student: StudentSummary;
}

export function AdminStudentTrainings({ student }: AdminStudentTrainingsProps): React.JSX.Element {
  const {
    trainings,
    plan,
    loading,
    actionLoading,
    error,
    selectedWeek,
    setSelectedWeek,
    updateSession,
    addSession,
    deleteSession,
    deleteCompletion,
    initializePlan,
  } = useAdminStudentTrainings(student.idAluno);

  const [activeTab, setActiveTab] = useState<"plan" | "history">("plan");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<
    | { type: "session"; session: TrainingSession }
    | { type: "completion"; completion: StudentTrainingDetail }
    | null
  >(null);

  const currentWeek = plan?.semanas.find((s) => s.semana === selectedWeek) ?? plan?.semanas[0];
  const totalPlano = plan?.semanas.reduce((acc, s) => acc + s.sessoes.length, 0) || student.totalTreinosPlano || 12;

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "session") {
      await deleteSession(selectedWeek, deleteTarget.session.sessao);
    } else {
      await deleteCompletion(deleteTarget.completion.id);
    }
    setDeleteTarget(null);
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <AdminStudentTrainingsHeader
        student={student}
        totalTrainings={trainings.length}
        totalPlano={totalPlano}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-xs text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin text-primary" /> Carregando treinos...
        </div>
      ) : error ? (
        <p className="py-4 text-center text-xs text-destructive">{error}</p>
      ) : activeTab === "history" ? (
        <AdminCompletedTrainingsList
          trainings={trainings}
          disabled={actionLoading}
          onDeleteCompletion={(comp) => setDeleteTarget({ type: "completion", completion: comp })}
        />
      ) : !plan ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-10 text-center">
          <p className="text-xs text-muted-foreground">Nenhum plano de treino ativo para este aluno.</p>
          <Button size="sm" onClick={() => void initializePlan()} disabled={actionLoading} className="gap-2 font-bold">
            <Sparkles className="size-3.5" /> Inicializar Plano Base
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div className="flex flex-wrap gap-1">
              {plan.semanas.map((s) => (
                <button
                  key={s.semana}
                  type="button"
                  onClick={() => setSelectedWeek(s.semana)}
                  className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                    selectedWeek === s.semana ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Semana {s.semana}
                </button>
              ))}
            </div>
            <Button size="sm" variant="outline" onClick={() => { setEditingSession(null); setFormDialogOpen(true); }} disabled={actionLoading} className="h-8 gap-1.5 text-xs font-bold">
              <Plus className="size-3.5 text-primary" /> Novo Treino
            </Button>
          </div>

          {currentWeek && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Foco: {currentWeek.foco}</span>
                <span>{currentWeek.sessoes.length} {currentWeek.sessoes.length === 1 ? "sessão" : "sessões"}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {currentWeek.sessoes.map((session) => (
                  <AdminTrainingSessionCard
                    key={session.sessao}
                    session={session}
                    week={currentWeek.semana}
                    completion={trainings.find((t) => t.semana === currentWeek.semana && t.sessao === session.sessao)}
                    disabled={actionLoading}
                    onEdit={(s) => { setEditingSession(s); setFormDialogOpen(true); }}
                    onDelete={(s) => setDeleteTarget({ type: "session", session: s })}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <AdminSessionFormDialog
        open={formDialogOpen}
        week={selectedWeek}
        initialSession={editingSession}
        loading={actionLoading}
        onClose={() => setFormDialogOpen(false)}
        onSubmit={async (data) => (editingSession ? updateSession(selectedWeek, editingSession.sessao, data) : addSession(selectedWeek, data))}
      />

      <AdminDeleteSessionDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget?.type === "session" ? "Excluir Treino do Plano" : "Excluir Registro de Treino"}
        description={
          deleteTarget?.type === "session"
            ? `Tem certeza que deseja excluir a Sessão ${deleteTarget.session.sessao} (${deleteTarget.session.titulo}) do plano do aluno?`
            : "Tem certeza que deseja remover este treino concluído do histórico?"
        }
        loading={actionLoading}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
