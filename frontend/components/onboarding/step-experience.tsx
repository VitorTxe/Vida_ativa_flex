import React from "react";
import { Award, Compass, Flame } from "lucide-react";
import { Card, CardContent } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import type { RunningLevel } from "@/backend/types";

interface StepExperienceProps {
  value: RunningLevel;
  onChange: (level: RunningLevel) => void;
  idade: number;
  onIdade: (v: number) => void;
  pesoKg: number;
  onPeso: (v: number) => void;
  alturaCm: number;
  onAltura: (v: number) => void;
}

const levels: { id: RunningLevel; title: string; desc: string; icon: typeof Compass }[] = [
  {
    id: "iniciante",
    title: "Iniciante",
    desc: "Corro pouco ou estou começando/voltando agora.",
    icon: Compass,
  },
  {
    id: "intermediario",
    title: "Intermediário",
    desc: "Já corro com frequência (ex: 5k a 10k) e quero melhorar meu tempo.",
    icon: Flame,
  },
  {
    id: "avancado",
    title: "Avançado",
    desc: "Já faço distâncias maiores (21k/42k) ou busco metas de tempo específicas.",
    icon: Award,
  },
];

export function StepExperience({
  value,
  onChange,
  idade,
  onIdade,
  pesoKg,
  onPeso,
  alturaCm,
  onAltura,
}: StepExperienceProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#FFD700]">Passo 1 de 6</p>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">Qual é o seu nível atual na corrida?</h2>
        <p className="mt-1 text-sm text-white/50">Usado para calibrar a progressão de volume inicial.</p>
      </div>

      <div className="grid gap-3">
        {levels.map((item) => {
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

      <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">Dados biométricos</p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <label className="text-xs text-white/45">
            Idade
            <Input
              type="number"
              min={16}
              max={95}
              value={idade}
              onChange={(e) => onIdade(Number(e.target.value))}
              className="mt-1 h-11 rounded-xl border-white/10 bg-[#121212] px-3 text-center font-bold"
            />
          </label>
          <label className="text-xs text-white/45">
            Peso (kg)
            <Input
              type="number"
              min={35}
              max={300}
              step={0.5}
              value={pesoKg}
              onChange={(e) => onPeso(Number(e.target.value))}
              className="mt-1 h-11 rounded-xl border-white/10 bg-[#121212] px-3 text-center font-bold"
            />
          </label>
          <label className="text-xs text-white/45">
            Altura (cm)
            <Input
              type="number"
              min={130}
              max={230}
              value={alturaCm}
              onChange={(e) => onAltura(Number(e.target.value))}
              className="mt-1 h-11 rounded-xl border-white/10 bg-[#121212] px-3 text-center font-bold"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
