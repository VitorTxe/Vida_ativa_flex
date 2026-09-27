import React from "react";
import { Zap } from "lucide-react";
import { Card, CardContent } from "@/frontend/components/ui/card";

interface StepFrequencyProps {
  value: 2 | 3 | 4;
  onChange: (freq: 2 | 3 | 4) => void;
}

const frequencies: {
  id: 2 | 3 | 4;
  title: string;
  badge?: string;
  desc: string;
}[] = [
  {
    id: 3,
    title: "3 treinos por semana",
    badge: "Mais Escolhido",
    desc: "Formato Padrão do Vida Ativa Flex: Sessão 1 (Estímulo ⚡), Sessão 2 (Base 🔄) e Sessão 3 (Longão 🎯).",
  },
  {
    id: 4,
    title: "4 treinos por semana",
    desc: "Para quem quer mais volume: adiciona 1 rodagem extra de recuperação ou base aeróbia em Z2.",
  },
  {
    id: 2,
    title: "2 treinos por semana",
    desc: "Foco ultra-enxuto para semanas corridas: 1 treino de Qualidade ⚡ + 1 treino de Longão 🎯.",
  },
];

export function StepFrequency({ value, onChange }: StepFrequencyProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#FFD700]">Passo 3 de 6</p>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">Quantos dias por semana pretende treinar?</h2>
        <p className="mt-1 text-sm text-white/50">Você tem total liberdade para treinar nos dias que preferir.</p>
      </div>

      <div className="grid gap-3">
        {frequencies.map((item) => {
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
              <CardContent className="flex items-start gap-4 p-4 sm:p-5">
                <span
                  className={`mt-0.5 grid size-11 shrink-0 place-items-center rounded-xl font-black text-lg ${
                    active ? "bg-[#FFD700] text-black" : "bg-white/5 text-white/60"
                  }`}
                >
                  {item.id}x
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`font-bold ${active ? "text-[#FFD700]" : "text-white"}`}>{item.title}</p>
                    {item.badge && (
                      <span className="rounded-full bg-[#FFD700]/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#FFD700]">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-white/45">{item.desc}</p>
                </div>
                <div
                  className={`mt-1 size-5 rounded-full border-2 grid place-items-center shrink-0 ${
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

      <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 p-4 text-xs leading-5 text-white/45">
        <Zap className="size-4 shrink-0 text-[#FFD700]" />
        No modelo FLEX você não tem agenda engessada: basta realizar os blocos semanais na ordem que quiser!
      </div>
    </div>
  );
}
