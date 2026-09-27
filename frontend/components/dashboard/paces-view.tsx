import React from "react";
import { CircleHelp, RotateCcw } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent } from "@/frontend/components/ui/card";
import { ZONE_META, type VdotRow } from "@/frontend/lib/fitness-data";

export function PacesView({
  result,
  onRetest,
}: {
  result: VdotRow;
  onRetest: () => void;
}): React.JSX.Element {
  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/8 bg-[#1a1a1a] p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <span className="grid size-12 place-items-center rounded-2xl bg-[#FFD700] font-black text-black">
            {result.vdot}
          </span>
          <div>
            <p className="font-bold">VDOT atual</p>
            <p className="text-sm text-white/45">Baseado no teste de {result.label} · atualizado em 02 set 2026</p>
          </div>
        </div>
        <Button
          onClick={onRetest}
          variant="outline"
          className="h-10 rounded-xl border-white/10 bg-transparent text-white hover:bg-white/5 hover:text-white"
        >
          <RotateCcw /> Refazer teste
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ZONE_META.map((zone, index) => (
          <Card
            key={zone.key}
            className={`group min-h-[230px] overflow-hidden border-white/8 py-0 shadow-none transition hover:-translate-y-1 ${
              zone.key === "Z4" ? "bg-[#FFD700] text-black" : "bg-[#1a1a1a]"
            }`}
          >
            <CardContent className="flex h-full flex-col p-6">
              <div className="flex items-start justify-between">
                <span
                  className={`grid size-11 place-items-center rounded-xl text-sm font-black ${
                    zone.key === "Z4" ? "bg-black text-[#FFD700]" : "bg-white/6"
                  }`}
                >
                  {zone.key}
                </span>
                <span className="text-xs font-bold opacity-40">0{index + 1}</span>
              </div>
              <p className="mt-8 text-sm font-bold opacity-55">{zone.name}</p>
              <p className="mt-2 text-3xl font-black tracking-[-0.04em]">{result.zones[zone.key]}</p>
              <p className="mt-auto pt-5 text-xs font-bold uppercase tracking-[0.14em] opacity-40">
                min/km · {zone.short}
              </p>
            </CardContent>
          </Card>
        ))}
        <Card className="min-h-[230px] border-dashed border-white/14 bg-transparent py-0 shadow-none">
          <CardContent className="flex h-full flex-col items-start justify-center p-6">
            <CircleHelp className="size-7 text-[#FFD700]" />
            <p className="mt-4 font-bold">Como usar as zonas?</p>
            <p className="mt-2 text-sm leading-6 text-white/45">
              O treino já mostra o pace correto em cada bloco. Você só precisa acompanhar o esforço.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
