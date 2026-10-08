"use client";

import React, { useState } from "react";
import { ExternalLink, Trash2 } from "lucide-react";
import type { TrainingCompletion } from "@/frontend/types";
import { formatDuration } from "./strava-activity-dialog";
import { Button } from "@/frontend/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/frontend/components/ui/alert-dialog";

interface StravaCompletionDetailsProps {
  completion: TrainingCompletion;
  onDeleteTime?: () => void;
  disabled?: boolean;
}

export function StravaCompletionDetails({
  completion,
  onDeleteTime,
  disabled = false,
}: StravaCompletionDetailsProps): React.JSX.Element {
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleConfirmDelete() {
    setDialogOpen(false);
    onDeleteTime?.();
  }

  return (
    <div className="mt-5 rounded-2xl border border-strava-border bg-strava-muted p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-strava">
            Realizado com Strava
          </p>
          <p className="mt-1 truncate text-sm font-bold text-foreground">
            {completion.activityName ?? "Atividade registrada"}
          </p>
        </div>
        {completion.stravaUrl && (
          <a
            href={completion.stravaUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-strava hover:underline"
          >
            Ver no Strava <ExternalLink className="size-3" />
          </a>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <MetricCard
          value={completion.movingTime ? formatDuration(completion.movingTime) : "—"}
          label="movimento"
        />
        <MetricCard
          value={completion.distanceMeters ? `${(completion.distanceMeters / 1000).toFixed(2)} km` : "—"}
          label="distância"
        />
        <MetricCard
          value={completion.paceAverage ?? "—"}
          label="pace"
        />
      </div>

      {onDeleteTime && (
        <div className="mt-3 flex items-center justify-end border-t border-strava-border/60 pt-2.5">
          <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                className="h-8 gap-1.5 px-2 text-xs font-semibold text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
                Excluir tempo realizado
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-border bg-card text-foreground">
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir tempo deste treino?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  Esta ação removerá o tempo e as métricas do Strava vinculadas a este treino. O treino voltará ao status pendente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmDelete}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  Excluir tempo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}

function MetricCard({ value, label }: { value: string; label: string }): React.JSX.Element {
  return (
    <div className="rounded-xl bg-background/60 px-2 py-2">
      <p className="text-xs font-black text-foreground">{value}</p>
      <p className="mt-1 text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
