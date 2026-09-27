"use client";

import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { StudentSummary } from "@/frontend/types/messages.types";
import { AdminStudentCard } from "./admin-student-card";

interface AdminStudentsListProps {
  students: StudentSummary[];
  selectedStudentId: string | null;
  onSelectStudent: (id: string) => void;
}

export function AdminStudentsList({
  students,
  selectedStudentId,
  onSelectStudent,
}: AdminStudentsListProps): React.JSX.Element {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "doubts" | "eval">("all");

  const filteredAndRanked = useMemo(() => {
    const list = students.filter((s) => {
      const matchSearch =
        s.nome.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (filter === "doubts") return s.mensagensNaoLidas > 0;
      if (filter === "eval") return s.temSolicitacaoAvaliacao;
      return true;
    });

    // Ordenação unificada: novas mensagens no topo, ranqueadas da mais recente para a mais antiga
    return list.sort((a, b) => {
      const aUnread = a.mensagensNaoLidas > 0;
      const bUnread = b.mensagensNaoLidas > 0;

      if (aUnread && !bUnread) return -1;
      if (!aUnread && bUnread) return 1;

      if (aUnread && bUnread) {
        const aDate = a.ultimaMensagemNaoLidaEm || a.ultimaMensagemEm || "";
        const bDate = b.ultimaMensagemNaoLidaEm || b.ultimaMensagemEm || "";
        return bDate.localeCompare(aDate);
      }

      const aDate = a.ultimaMensagemEm || "";
      const bDate = b.ultimaMensagemEm || "";
      if (aDate && !bDate) return -1;
      if (!aDate && bDate) return 1;
      if (aDate && bDate) {
        const diff = bDate.localeCompare(aDate);
        if (diff !== 0) return diff;
      }

      return a.nome.localeCompare(b.nome);
    });
  }, [students, search, filter]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-black uppercase tracking-wider text-primary">Alunos ({students.length})</h2>
        <div className="flex gap-1">
          <FilterChip active={filter === "all"} label="Todos" onClick={() => setFilter("all")} />
          <FilterChip active={filter === "doubts"} label="Dúvidas" onClick={() => setFilter("doubts")} />
          <FilterChip active={filter === "eval"} label="Avaliação" onClick={() => setFilter("eval")} />
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar aluno..."
          className="w-full rounded-xl border border-border bg-input py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="flex flex-col gap-2 max-h-[520px] overflow-y-auto pr-1">
        {filteredAndRanked.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">Nenhum aluno encontrado.</p>
        )}
        {filteredAndRanked.map((student) => (
          <AdminStudentCard
            key={student.idAluno}
            student={student}
            isSelected={selectedStudentId === student.idAluno}
            onSelect={onSelectStudent}
          />
        ))}
      </div>
    </div>
  );
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
