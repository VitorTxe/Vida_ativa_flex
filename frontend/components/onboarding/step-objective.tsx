import React from "react";
import { Flag, HeartPulse, Trophy } from "lucide-react";
import { Card, CardContent } from "@/frontend/components/ui/card";
import type { CycleFocus, TargetDistance } from "@/backend/types";

interface StepObjectiveProps {
  value: CycleFocus;
  onChange: (focus: CycleFocus) => void;
  distancia: TargetDistance;
  onDistancia: (d: TargetDistance) => void;
}

const objectives: { id: CycleFocus; title: string; desc: string; icon: typeof Trophy }[] = [
  {
    id: "primeira_prova",
    title: "Concluir a primeira prova",
    desc: "Cruzar a linha de chegada de 5k, 10k, 21k ou 42k pela primeira vez.",
    icon: Flag,
  },
  {
    id: "recorde_pessoal",
    title: "Bater meu recorde pessoal",
    desc: "Buscar um ritmo (pace) mais forte e baixar meu tempo na distância alvo.",
    icon: Trophy,
  },
  {
    id: "condicionamento",
    title: "Saúde, constância e condicionamento",
    desc: "Manter o hábito sem foco em prova, priorizando longevidade e bem-estar.",
    icon: HeartPulse,
  },
];

const distances: TargetDistance[] = ["5k", "10k", "21k", "42k"];

export function StepObjective({
  value,
  onChange,
  distancia,
  onDistancia,
}: StepObjectiveProps): React.JSX.Element {
  const needsDistance = value === "primeira_prova" || value === "recorde_pessoal";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#FFD700]">Passo 2 de 6</p>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">Qual é o seu foco principal neste ciclo?</h2>
        <p className="mt-1 text-sm text-white/50">O método se adapta ao seu objetivo real.</p>
      </div>

      <div className="grid gap-3">
        {objectives.map((item) => {
          const Icon = item.icon;
          const active = value === item.id;
          return (
            <Card
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`cursor-pointer border-white/8 py-0 transition-all ${
                active
                  ? "border-[#FFD700] bg-[#FFD700]/[0.08]"
                  : "bg-[#181818] hover:border-white/20 hover:bg-white/[0.03]"
              }`}
            >
              <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                <span
                  className={`grid size-11 shrink-0 place-items-center rounded-xl ${
                    active ? "bg-[#FFD700] text-black" : "bg-white/5 text-white/60"
                  }`}
                >
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`font-bold ${active ? "text-[#FFD700]" : "text-white"}`}>{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-white/45">{item.desc}</p>
                </div>
                <div
                  className={`size-5 rounded-full border-2 grid place-items-center ${
                    active ? "border-[#FFD700] bg-[#FFD700]" : "border-white/20"
                  }`}
                >
                  {active && <span className="size-2 rounded-full bg-black" />}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {needsDistance && (
        <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">Qual é a distância alvo?</p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {distances.map((dist) => {
              const active = distancia === dist;
              return (
                <button
                  key={dist}
                  type="button"
                  onClick={() => onDistancia(dist)}
                  className={`h-11 rounded-xl font-black text-sm transition ${
                    active ? "bg-[#FFD700] text-black" : "bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {dist.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
