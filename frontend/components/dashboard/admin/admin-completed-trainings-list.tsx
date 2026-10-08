"use client";

import React from "react";
import { CheckCircle2, Flame, Trash2 } from "lucide-react";
import type { StudentTrainingDetail } from "@/frontend/types";
import { Button } from "@/components/ui/button";

interface AdminCompletedTrainingsListProps {
  trainings: StudentTrainingDetail[];
  disabled?: boolean;
  onDeleteCompletion: (completion: StudentTrainingDetail) => void;
}

export function AdminCompletedTrainingsList({
  trainings,
  disabled,
  onDeleteCompletion,
}: AdminCompletedTrainingsListProps): React.JSX.Element {
  if (trainings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
        Nenhum treino realizado ainda neste ciclo pelo aluno.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
      {trainings.map((t) => (
        <div
          key={t.id}
          className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-xs transition-colors hover:border-primary/30"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="size-4" />
            </span>
            <div>
              <p className="font-bold text-foreground">
                Semana {t.semana} · Sessão {t.sessao}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {t.nomeAtividade ?? (t.origem === "strava" ? "Treino Strava" : "Conclusão Manual")}
                {t.concluidoEm ? ` · ${new Date(t.concluidoEm).toLocaleDateString("pt-BR")}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-bold text-foreground">
                {t.distanciaMetros ? `${(t.distanciaMetros / 1000).toFixed(2)} km` : "Concluído"}
              </p>
              <p className="text-[11px] text-muted-foreground">{t.paceMedio ?? "Pace livre"}</p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              onClick={() => onDeleteCompletion(t)}
              title="Excluir este registro de conclusão"
              className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
