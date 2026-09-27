"use client";

import React from "react";
import { CalendarCheck, Clock } from "lucide-react";
import type { StudentSummary } from "@/frontend/types/messages.types";

interface AdminStudentCardProps {
  student: StudentSummary;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function formatMessageTime(dateIso?: string | null): string {
  if (!dateIso) return "";
  try {
    const date = new Date(dateIso);
    if (isNaN(date.getTime())) return "";
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
}

export function AdminStudentCard({ student, isSelected, onSelect }: AdminStudentCardProps): React.JSX.Element {
  const hasUnread = student.mensagensNaoLidas > 0;
  const timeLabel = formatMessageTime(student.ultimaMensagemEm);

  return (
    <button
      type="button"
      onClick={() => onSelect(student.idAluno)}
      className={`flex flex-col gap-1.5 rounded-xl border p-3 text-left transition ${
        isSelected
          ? "border-primary bg-primary/10 shadow-sm"
          : hasUnread
          ? "border-primary/40 bg-primary/[0.04] hover:bg-primary/[0.08]"
          : "border-border bg-muted/30 hover:border-border hover:bg-muted/60"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="truncate text-xs font-black text-foreground">{student.nome}</p>
          {hasUnread && <span className="size-2 rounded-full bg-primary shrink-0 animate-pulse" />}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {timeLabel && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="size-2.5" /> {timeLabel}
            </span>
          )}
          {student.temSolicitacaoAvaliacao && (
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary flex items-center gap-1">
              <CalendarCheck className="size-2.5" /> Call
            </span>
          )}
          {hasUnread && (
            <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-black text-destructive-foreground">
              {student.mensagensNaoLidas}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Alvo: {student.objetivo}</span>
        <span className="font-semibold text-foreground">
          {student.totalTreinosConcluidos}/{student.totalTreinosPlano || (student.treinosPorSemana ? student.treinosPorSemana * 4 : 12)} treinos
        </span>
      </div>
    </button>
  );
}
