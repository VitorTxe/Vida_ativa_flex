"use client";

import React from "react";
import type { StudentSummary } from "@/frontend/types";

interface AdminStudentTrainingsHeaderProps {
  student: StudentSummary;
  totalTrainings: number;
  totalPlano: number;
  activeTab: "plan" | "history";
  onTabChange: (tab: "plan" | "history") => void;
}

export function AdminStudentTrainingsHeader({
  student,
  totalTrainings,
  totalPlano,
  activeTab,
  onTabChange,
}: AdminStudentTrainingsHeaderProps): React.JSX.Element {
  const percentual = Math.min(100, Math.round((totalTrainings / totalPlano) * 100));

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-base font-black text-foreground">{student.nome}</h3>
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase text-primary">
            {student.objetivo}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{student.email} · Foco: {student.focoPrincipal ?? "Geral"}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-right">
          <p className="text-[10px] font-bold uppercase text-primary">Conclusão</p>
          <p className="text-xs font-black text-foreground">{totalTrainings}/{totalPlano} ({percentual}%)</p>
        </div>
        <div className="flex rounded-lg border border-border bg-muted/30 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => onTabChange("plan")}
            className={`rounded-md px-2.5 py-1 font-bold transition ${activeTab === "plan" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            Plano
          </button>
          <button
            type="button"
            onClick={() => onTabChange("history")}
            className={`rounded-md px-2.5 py-1 font-bold transition ${activeTab === "history" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            Histórico ({totalTrainings})
          </button>
        </div>
      </div>
    </div>
  );
}
