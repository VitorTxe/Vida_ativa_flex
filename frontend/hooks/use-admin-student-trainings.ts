"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { GeneratedTrainingPlan } from "@/backend/types";
import type {
  AdminTrainingsData,
  SessionFormData,
  StudentTrainingDetail,
} from "@/frontend/types";

interface UseAdminStudentTrainingsResult {
  trainings: StudentTrainingDetail[];
  plan: GeneratedTrainingPlan | null;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  selectedWeek: number;
  setSelectedWeek: (week: number) => void;
  reloadTrainings: () => Promise<void>;
  updateSession: (week: number, session: number, data: SessionFormData) => Promise<boolean>;
  addSession: (week: number, data: SessionFormData) => Promise<boolean>;
  deleteSession: (week: number, session: number) => Promise<boolean>;
  deleteCompletion: (completionId: string) => Promise<boolean>;
  updateWeekFocus: (week: number, foco: string) => Promise<boolean>;
  initializePlan: () => Promise<boolean>;
}

export function useAdminStudentTrainings(idAluno: string): UseAdminStudentTrainingsResult {
  const [trainings, setTrainings] = useState<StudentTrainingDetail[]>([]);
  const [plan, setPlan] = useState<GeneratedTrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(1);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const reloadTrainings = useCallback(async () => {
    setLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/students/${idAluno}/trainings`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Não foi possível carregar os treinos do aluno.");
        }
        return (await res.json()) as AdminTrainingsData;
      })
      .then((data) => {
        if (!active) return;
        setTrainings(data.trainings || []);
        setPlan(data.plan || null);
        if (data.plan?.semanas?.[0]?.semana) {
          setSelectedWeek((prev) => {
            const hasPrev = data.plan?.semanas.some((s) => s.semana === prev);
            return hasPrev ? prev : data.plan?.semanas[0].semana ?? 1;
          });
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        console.error(`[useAdminStudentTrainings] Erro ao buscar treinos do aluno ${idAluno}:`, err);
        const msg = err instanceof Error ? err.message : "Erro desconhecido ao carregar treinos.";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [idAluno, refreshTrigger]);

  const updateSession = async (
    week: number,
    session: number,
    data: SessionFormData
  ): Promise<boolean> => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/students/${idAluno}/trainings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_session",
          week,
          session,
          sessionData: data,
        }),
      });

      if (!res.ok) {
        const errorJson = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorJson?.error ?? "Erro ao salvar alterações no treino.");
      }

      const resData = (await res.json()) as { plan: GeneratedTrainingPlan };
      setPlan(resData.plan);
      toast.success("Treino atualizado com sucesso!");
      return true;
    } catch (err: unknown) {
      console.error(`[useAdminStudentTrainings] Erro ao atualizar sessão ${session} sem ${week}:`, err);
      const msg = err instanceof Error ? err.message : "Falha ao atualizar sessão de treino.";
      toast.error(msg);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const addSession = async (week: number, data: SessionFormData): Promise<boolean> => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/students/${idAluno}/trainings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_session",
          week,
          sessionData: data,
        }),
      });

      if (!res.ok) {
        const errorJson = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorJson?.error ?? "Erro ao adicionar treino na semana.");
      }

      const resData = (await res.json()) as { plan: GeneratedTrainingPlan };
      setPlan(resData.plan);
      toast.success("Novo treino adicionado com sucesso!");
      return true;
    } catch (err: unknown) {
      console.error(`[useAdminStudentTrainings] Erro ao adicionar sessão na semana ${week}:`, err);
      const msg = err instanceof Error ? err.message : "Falha ao adicionar sessão.";
      toast.error(msg);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const deleteSession = async (week: number, session: number): Promise<boolean> => {
    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/admin/students/${idAluno}/trainings?action=delete_session&week=${week}&session=${session}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const errorJson = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorJson?.error ?? "Erro ao excluir treino.");
      }

      const resData = (await res.json()) as { plan: GeneratedTrainingPlan };
      setPlan(resData.plan);
      setTrainings((prev) => prev.filter((t) => !(t.semana === week && t.sessao === session)));
      toast.success("Treino excluído com sucesso do plano!");
      return true;
    } catch (err: unknown) {
      console.error(`[useAdminStudentTrainings] Erro ao excluir sessão ${session} sem ${week}:`, err);
      const msg = err instanceof Error ? err.message : "Falha ao excluir treino.";
      toast.error(msg);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const deleteCompletion = async (completionId: string): Promise<boolean> => {
    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/admin/students/${idAluno}/trainings?action=delete_completion&completionId=${completionId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const errorJson = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorJson?.error ?? "Erro ao excluir registro de treino realizado.");
      }

      setTrainings((prev) => prev.filter((t) => t.id !== completionId));
      toast.success("Registro de treino realizado excluído!");
      return true;
    } catch (err: unknown) {
      console.error(`[useAdminStudentTrainings] Erro ao excluir conclusão ${completionId}:`, err);
      const msg = err instanceof Error ? err.message : "Falha ao excluir conclusão.";
      toast.error(msg);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const updateWeekFocus = async (week: number, foco: string): Promise<boolean> => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/students/${idAluno}/trainings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_week_focus",
          week,
          foco,
        }),
      });

      if (!res.ok) {
        const errorJson = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorJson?.error ?? "Erro ao atualizar foco da semana.");
      }

      const resData = (await res.json()) as { plan: GeneratedTrainingPlan };
      setPlan(resData.plan);
      toast.success("Foco da semana atualizado!");
      return true;
    } catch (err: unknown) {
      console.error(`[useAdminStudentTrainings] Erro ao atualizar foco da sem ${week}:`, err);
      const msg = err instanceof Error ? err.message : "Falha ao atualizar foco.";
      toast.error(msg);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const initializePlan = async (): Promise<boolean> => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/students/${idAluno}/trainings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "initialize_plan" }),
      });

      if (!res.ok) {
        const errorJson = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorJson?.error ?? "Erro ao inicializar plano do aluno.");
      }

      const resData = (await res.json()) as { plan: GeneratedTrainingPlan };
      setPlan(resData.plan);
      toast.success("Plano base estruturado com sucesso!");
      return true;
    } catch (err: unknown) {
      console.error(`[useAdminStudentTrainings] Erro ao inicializar plano para ${idAluno}:`, err);
      const msg = err instanceof Error ? err.message : "Falha ao inicializar plano.";
      toast.error(msg);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    trainings,
    plan,
    loading,
    actionLoading,
    error,
    selectedWeek,
    setSelectedWeek,
    reloadTrainings,
    updateSession,
    addSession,
    deleteSession,
    deleteCompletion,
    updateWeekFocus,
    initializePlan,
  };
}
