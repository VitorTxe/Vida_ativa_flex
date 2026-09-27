import React from "react";
import { Check, Sparkles } from "lucide-react";
import type { Weekday } from "@/backend/types";

interface StepRoutineDaysProps {
  selectedDays: Weekday[];
  onToggleDay: (day: Weekday) => void;
}

const days: { id: Weekday; label: string; short: string }[] = [
  { id: "seg", label: "Segunda-feira", short: "Seg" },
  { id: "ter", label: "Terça-feira", short: "Ter" },
  { id: "qua", label: "Quarta-feira", short: "Qua" },
  { id: "qui", label: "Quinta-feira", short: "Qui" },
  { id: "sex", label: "Sexta-feira", short: "Sex" },
  { id: "sab", label: "Sábado", short: "Sáb" },
  { id: "dom", label: "Domingo", short: "Dom" },
];

export function StepRoutineDays({
  selectedDays,
  onToggleDay,
}: StepRoutineDaysProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#FFD700]">Passo 4 de 6</p>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">Em quais dias você tem mais tempo livre?</h2>
        <p className="mt-1 text-sm text-white/50">Toque para selecionar os dias mais convenientes para sua rotina.</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {days.map((day) => {
          const isSelected = selectedDays.includes(day.id);
          return (
            <button
              key={day.id}
              type="button"
              onClick={() => onToggleDay(day.id)}
              className={`flex items-center justify-between rounded-xl border p-3.5 text-left transition ${
                isSelected
                  ? "border-[#FFD700] bg-[#FFD700]/10 text-white"
                  : "border-white/8 bg-[#181818] text-white/60 hover:border-white/20"
              }`}
            >
              <div>
                <p className="text-xs font-bold text-white/40 uppercase tracking-wider">{day.short}</p>
                <p className="mt-0.5 text-sm font-bold">{day.label.split("-")[0]}</p>
              </div>
              <div
                className={`grid size-6 place-items-center rounded-lg border ${
                  isSelected ? "border-[#FFD700] bg-[#FFD700] text-black" : "border-white/15"
                }`}
              >
                {isSelected && <Check className="size-3.5 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/[0.06] p-4 text-xs leading-6 text-white/60">
        <div className="flex items-center gap-2 font-bold text-[#FFD700]">
          <Sparkles className="size-4" />
          Nota da metodologia FLEX:
        </div>
        <p className="mt-1">
          Isso serve apenas para organizarmos a sua visualização, mas lembre-se: no <strong>VIDA ATIVA - FLEX</strong>{" "}
          você pode inverter ou ajustar os dias sempre que sua rotina mudar!
        </p>
      </div>
    </div>
  );
}
