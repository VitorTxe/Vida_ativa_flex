import React from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, ChevronRight, Clock3, Gauge, ShieldCheck, TimerReset } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import type { VdotRow } from "@/frontend/lib/fitness-data";

interface TestViewProps {
  minutes: number;
  seconds: number;
  result: VdotRow;
  message: string;
  onMinutes: (value: number) => void;
  onSeconds: (value: number) => void;
  onCalculate: () => void;
  onSeePaces: () => void;
}

export function TestView({
  minutes,
  seconds,
  result,
  message,
  onMinutes,
  onSeconds,
  onCalculate,
  onSeePaces,
}: TestViewProps): React.JSX.Element {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
      <Card className="overflow-hidden border-white/8 bg-[#1A1A1A] py-0 shadow-none">
        <CardContent className="grid min-h-[540px] gap-10 p-6 sm:p-8 lg:grid-cols-[1fr_.9fr]">
          <div className="flex flex-col">
            <span className="grid size-12 place-items-center rounded-2xl bg-[#FFD700] text-black">
              <TimerReset className="size-6" />
            </span>
            <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-[#FFD700]">Teste de 3 km</p>
            <h2 className="mt-3 max-w-md text-4xl font-black leading-[1.04] tracking-[-0.055em]">
              Um teste simples. Sete ritmos úteis.
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-white/55">
              Use um percurso plano ou tempo de prova recente. Corra forte, mas de forma sustentável do primeiro ao último quilômetro.
            </p>
            <div className="mt-auto grid gap-3 pt-8 sm:grid-cols-2">
              <InfoPill icon={Clock3} label="Último teste" value="02 set 2026" />
              <InfoPill icon={ShieldCheck} label="Faixa válida" value="9:30 a 18:30" />
            </div>
          </div>
          <div className="flex flex-col justify-center rounded-[1.75rem] border border-white/8 bg-black/25 p-5 sm:p-7">
            <p className="font-bold">Seu tempo nos 3 km</p>
            <p className="mt-1 text-sm text-white/40">Preencha minutos e segundos.</p>
            <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
              <NumberField label="Minutos" value={minutes} min={9} max={18} onChange={onMinutes} />
              <span className="pb-5 text-2xl font-black text-[#FFD700]">:</span>
              <NumberField label="Segundos" value={seconds} min={0} max={59} onChange={onSeconds} />
            </div>
            <Button onClick={onCalculate} className="mt-5 h-12 rounded-xl bg-[#FFD700] font-extrabold text-black hover:bg-[#ffe13d]">
              Calcular minhas zonas <ChevronRight />
            </Button>
            <p className="mt-4 min-h-5 text-sm text-[#FFD700]" role="status">{message}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-[#FFD700]/25 bg-[#FFD700] py-0 text-black shadow-none">
        <CardContent className="flex h-full min-h-[390px] flex-col p-7">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] opacity-55">Resultado atual</p>
              <p className="mt-2 text-6xl font-black tracking-[-0.08em]">{result.vdot}</p>
              <p className="font-bold opacity-60">VDOT estimado</p>
            </div>
            <Gauge className="size-8" />
          </div>
          <div className="my-8 h-px bg-black/15" />
          <p className="text-sm font-bold opacity-60">Sua rodagem de base</p>
          <p className="mt-2 text-4xl font-black tracking-[-0.05em]">{result.zones.Z2}</p>
          <p className="text-sm font-bold opacity-60">min/km · Z2</p>
          <Button onClick={onSeePaces} className="mt-auto h-12 rounded-xl bg-black font-bold text-white hover:bg-black/85">
            Ver todas as zonas <ArrowRight />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}): React.JSX.Element {
  return (
    <label className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">
      {label}
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 h-16 rounded-xl border-white/10 bg-[#121212] px-4 text-center text-2xl font-black text-white"
      />
    </label>
  );
}

function InfoPill({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }): React.JSX.Element {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
      <Icon className="size-4 text-[#FFD700]" />
      <p className="mt-3 text-xs text-white/35">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}
