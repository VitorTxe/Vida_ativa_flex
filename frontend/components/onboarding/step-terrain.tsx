import React from "react";
import { Footprints, Layers, Mountain } from "lucide-react";
import { Card, CardContent } from "@/frontend/components/ui/card";
import type { TerrainPreference } from "@/backend/types";

interface StepTerrainProps {
  value: TerrainPreference;
  onChange: (terrain: TerrainPreference) => void;
}

const terrains: {
  id: TerrainPreference;
  title: string;
  desc: string;
  icon: typeof Mountain;
}[] = [
  {
    id: "rua",
    title: "Rua / Asfalto / Parques",
    desc: "Treinos ao ar livre com percursos reais e variações altimétricas.",
    icon: Mountain,
  },
  {
    id: "esteira",
    title: "Esteira",
    desc: "Ambiente controlado na academia ou em casa, com foco em cadência estável.",
    icon: Footprints,
  },
  {
    id: "misto",
    title: "Misto (Rua e Esteira)",
    desc: "Combinação flexível de acordo com clima, horários e conveniência.",
    icon: Layers,
  },
];

export function StepTerrain({ value, onChange }: StepTerrainProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#FFD700]">Passo 5 de 6</p>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">Onde costuma fazer a maior parte dos treinos?</h2>
        <p className="mt-1 text-sm text-white/50">A IA ajustará dicas de cadência, ritmo e inclinação técnica.</p>
      </div>

      <div className="grid gap-3">
        {terrains.map((item) => {
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
    </div>
  );
}
