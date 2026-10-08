"use client";

import React from "react";
import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react";
import type { TrainingSession } from "@/backend/types";
import type { StudentTrainingDetail } from "@/frontend/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AdminTrainingSessionCardProps {
  session: TrainingSession;
  week: number;
  completion?: StudentTrainingDetail;
  disabled?: boolean;
  onEdit: (session: TrainingSession) => void;
  onDelete: (session: TrainingSession) => void;
}

export function AdminTrainingSessionCard({
  session,
  week,
  completion,
  disabled,
  onEdit,
  onDelete,
}: AdminTrainingSessionCardProps): React.JSX.Element {
  const isDone = Boolean(completion);

  return (
    <div className="group flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <Activity className="size-4" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Sessão {session.sessao} · Semana {week}
            </span>
          </div>

          {isDone ? (
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
              <CheckCircle2 className="mr-1 size-3" /> Concluído
            </Badge>
          ) : (
            <Badge variant="outline" className="border-border bg-muted/30 text-muted-foreground text-[10px]">
              Pendente
            </Badge>
          )}
        </div>

        <div>
          <h4 className="text-sm font-black text-foreground group-hover:text-primary transition-colors">
            {session.titulo}
          </h4>
          <p className="text-xs font-semibold text-muted-foreground">
            {session.tipo}
          </p>
        </div>

        {/* Metadados / Pills em Bento Grid responsivo */}
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 font-medium text-foreground">
            <Clock className="size-3 text-primary" /> {session.duracaoMinutos} min
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 font-medium text-foreground">
            <Flame className="size-3 text-amber-500" /> {session.intensidade}
          </span>
          {session.diaSugerido && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 font-medium text-muted-foreground">
              <Calendar className="size-3" /> {session.diaSugerido}
            </span>
          )}
          {session.terrenoSugerido && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 font-medium text-muted-foreground">
              <MapPin className="size-3" /> {session.terrenoSugerido}
            </span>
          )}
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
          {session.descricao}
        </p>

        {completion && (
          <div className="rounded-lg border border-border bg-muted/20 p-2 text-[11px] text-muted-foreground">
            <p className="font-semibold text-foreground">
              Realizado: {completion.nomeAtividade ?? (completion.origem === "strava" ? "Strava" : "Manual")}
            </p>
            <p>
              {completion.distanciaMetros ? `${(completion.distanciaMetros / 1000).toFixed(2)} km` : ""}
              {completion.paceMedio ? ` · Pace: ${completion.paceMedio}` : ""}
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-border/60 pt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onEdit(session)}
          className="h-8 gap-1.5 text-xs font-bold"
        >
          <Pencil className="size-3.5" /> Editar
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onDelete(session)}
          className="h-8 gap-1.5 text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3.5" /> Excluir
        </Button>
      </div>
    </div>
  );
}
