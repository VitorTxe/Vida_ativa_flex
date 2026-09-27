"use client";

import React, { useEffect, useState } from "react";
import { Activity, CheckCircle2, Flame, LoaderCircle } from "lucide-react";
import type { StudentSummary, StudentTrainingDetail } from "@/frontend/types/messages.types";

interface AdminStudentTrainingsProps {
  student: StudentSummary;
}

export function AdminStudentTrainings({ student }: AdminStudentTrainingsProps): React.JSX.Element {
  const [trainings, setTrainings] = useState<StudentTrainingDetail[]>([]);
  const [customTotalPlan, setCustomTotalPlan] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setCustomTotalPlan(null);
    fetch(`/api/admin/students/${student.idAluno}/trainings`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Não foi possível carregar os treinos.");
        return (await res.json()) as { trainings: StudentTrainingDetail[]; planJson?: string | null };
      })
      .then((data) => {
        if (!active) return;
        setTrainings(data.trainings || []);
        if (data.planJson) {
          try {
            const parsed = JSON.parse(data.planJson) as { semanas?: Array<{ sessoes?: unknown[] }> };
            if (parsed.semanas && Array.isArray(parsed.semanas)) {
              const soma = parsed.semanas.reduce((acc, sem) => acc + (sem.sessoes?.length ?? 0), 0);
              if (soma > 0) setCustomTotalPlan(soma);
            }
          } catch {
            // mantém fallback
          }
        }
      })
      .catch((err: unknown) => {
        console.error("Erro ao carregar treinos do aluno:", err);
        if (active) setError(err instanceof Error ? err.message : "Erro desconhecido.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [student.idAluno]);

  const totalPlano =
    customTotalPlan ||
    student.totalTreinosPlano ||
    (student.treinosPorSemana ? student.treinosPorSemana * 4 : 12);
  const percentual = Math.min(100, Math.round((student.totalTreinosConcluidos / totalPlano) * 100));

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-foreground">{student.nome}</h3>
          <p className="text-xs text-muted-foreground">{student.email} · {student.focoPrincipal}</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-right">
          <p className="text-[10px] uppercase font-bold text-primary">Conclusão</p>
          <p className="text-xs font-black text-foreground">
            {student.totalTreinosConcluidos}/{totalPlano} ({percentual}%)
          </p>
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin text-primary" /> Carregando treinos...
          </div>
        )}
        {!loading && error && (
          <p className="py-4 text-center text-xs text-destructive">{error}</p>
        )}
        {!loading && !error && trainings.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">Nenhum treino realizado ainda neste ciclo.</p>
        )}
        {!loading &&
          !error &&
          trainings.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <CheckCircle2 className="size-4" />
                </span>
                <div>
                  <p className="font-bold text-foreground">
                    Semana {t.semana} · Sessão {t.sessao}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {t.nomeAtividade ?? (t.origem === "strava" ? "Treino Strava" : "Conclusão Manual")}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-foreground">
                  {t.distanciaMetros ? `${(t.distanciaMetros / 1000).toFixed(2)} km` : "Sessão Concluída"}
                </p>
                <p className="text-[11px] text-muted-foreground">{t.paceMedio ?? "Pace livre"}</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
