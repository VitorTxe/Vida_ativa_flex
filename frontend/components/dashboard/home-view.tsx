import React from "react";
import { Activity, ArrowRight, Check, Gauge, Sparkles } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent } from "@/frontend/components/ui/card";
import type { GeneratedTrainingPlan, TrainingSession } from "@/backend/types";
import type { Goal, VdotRow, Workout } from "@/frontend/lib/fitness-data";
import type { View } from "@/frontend/types/dashboard.types";

interface HomeViewProps {
  result: VdotRow;
  goal: Goal;
  workouts: Workout[];
  trainingPlan: GeneratedTrainingPlan | null;
  completed: number[];
  onNavigate: (view: View) => void;
  onToggle: (session: number) => void;
}

export function HomeView({
  result,
  goal,
  workouts,
  trainingPlan,
  completed,
  onNavigate,
  onToggle,
}: HomeViewProps): React.JSX.Element {
  if (trainingPlan) {
    return <PersonalizedHome plan={trainingPlan} completed={completed} onNavigate={onNavigate} onToggle={onToggle} />;
  }
  const next = workouts.find((item) => !completed.includes(item.session)) ?? workouts[0];
  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.38fr)_minmax(320px,.72fr)]">
        <Card className="relative overflow-hidden border-white/8 bg-[#1A1A1A] py-0 shadow-none">
          <div className="absolute right-[-8%] top-[-28%] size-72 rounded-full bg-[#FFD700]/10 blur-3xl" />
          <CardContent className="relative grid min-h-[360px] gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_.9fr]">
            <div className="flex flex-col">
              <span className="grid size-11 place-items-center rounded-2xl bg-[#FFD700] text-black">
                <Sparkles className="size-5" />
              </span>
              <p className="mt-7 text-xs font-black uppercase tracking-[0.2em] text-[#FFD700]">Seu ciclo em movimento</p>
              <h2 className="mt-3 max-w-lg text-3xl font-black leading-[1.02] tracking-[-0.055em] sm:text-5xl">
                Três sessões.<br />Do seu jeito.
              </h2>
              <p className="mt-4 max-w-md text-base leading-7 text-white/55">
                Sem dias fixos. Complete os blocos no seu ritmo e preserve ao menos um dia leve entre as sessões intensas.
              </p>
              <Button onClick={() => onNavigate("plan")} className="mt-7 h-11 w-fit rounded-xl bg-[#FFD700] px-5 font-extrabold text-black hover:bg-[#ffe13d]">
                Abrir plano da semana <ArrowRight />
              </Button>
            </div>
            <div className="flex flex-col justify-end rounded-[1.6rem] border border-white/8 bg-black/30 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">Próximo bloco</p>
                <span className="rounded-full bg-[#FFD700]/10 px-3 py-1 text-xs font-bold text-[#FFD700]">{goal}</span>
              </div>
              <p className="mt-8 text-4xl">{next.icon}</p>
              <h3 className="mt-3 text-xl font-black">{next.name}</h3>
              <p className="mt-2 text-sm leading-6 text-white/50">{next.duration} · alvo {next.zone}</p>
              <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/8">
                <div className="h-full w-1/3 rounded-full bg-[#FFD700]" />
              </div>
              <p className="mt-3 text-xs text-white/35">{completed.length} de 3 sessões concluídas</p>
            </div>
          </CardContent>
        </Card>
        <PaceSpotlight result={result} onClick={() => onNavigate("paces")} />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr_1fr]">
        {workouts.map((workout) => (
          <CompactWorkout key={workout.session} workout={workout} done={completed.includes(workout.session)} onToggle={() => onToggle(workout.session)} />
        ))}
      </section>
    </div>
  );
}

export function PersonalizedHome({
  plan,
  completed,
  onNavigate,
  onToggle,
}: {
  plan: GeneratedTrainingPlan;
  completed: number[];
  onNavigate: (view: View) => void;
  onToggle: (session: number) => void;
}): React.JSX.Element {
  const week = plan.semanas[0];
  const next = week.sessoes.find((item) => !completed.includes(item.sessao)) ?? week.sessoes[0];
  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.38fr)_minmax(320px,.72fr)]">
        <Card className="relative overflow-hidden border-white/8 bg-[#1A1A1A] py-0 shadow-none">
          <div className="absolute right-[-8%] top-[-28%] size-72 rounded-full bg-[#FFD700]/10 blur-3xl" />
          <CardContent className="relative flex min-h-[360px] flex-col p-6 sm:p-8">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#FFD700] text-black"><Sparkles className="size-5" /></span>
            <p className="mt-7 text-xs font-black uppercase tracking-[0.2em] text-[#FFD700]">Seu plano personalizado</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-black leading-[1.02] tracking-[-0.055em] sm:text-5xl">
              {week.sessoes.length} sessões.<br />No seu momento.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/55">{plan.resumo}</p>
            <Button onClick={() => onNavigate("plan")} className="mt-7 h-11 w-fit rounded-xl bg-[#FFD700] px-5 font-extrabold text-black hover:bg-[#ffe13d]">
              Abrir plano completo <ArrowRight />
            </Button>
          </CardContent>
        </Card>
        <Card className="border-[#FFD700]/30 bg-[#FFD700] py-0 text-black shadow-none">
          <CardContent className="flex h-full min-h-[330px] flex-col p-6 sm:p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] opacity-55">Próxima sessão</p>
                <p className="mt-3 text-3xl font-black tracking-[-0.05em]">{next.titulo}</p>
              </div>
              <Activity className="size-7" />
            </div>
            <p className="mt-6 text-sm font-bold opacity-60">{next.tipo} · {next.intensidade}</p>
            <p className="mt-3 text-sm leading-6 opacity-65">{next.descricao}</p>
            <div className="mt-auto pt-7">
              <p className="text-4xl font-black">{next.duracaoMinutos} min</p>
              <p className="text-sm font-bold opacity-55">duração estimada</p>
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {week.sessoes.map((session) => (
          <GeneratedCompactSession key={session.sessao} session={session} done={completed.includes(session.sessao)} onToggle={() => onToggle(session.sessao)} />
        ))}
      </section>
    </div>
  );
}

export function PaceSpotlight({ result, onClick }: { result: VdotRow; onClick: () => void }): React.JSX.Element {
  return (
    <Card className="border-[#FFD700]/30 bg-[#FFD700] py-0 text-black shadow-none">
      <CardContent className="flex h-full min-h-[330px] flex-col p-6 sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] opacity-55">Faixa atual</p>
            <p className="mt-2 text-5xl font-black tracking-[-0.07em]">VDOT {result.vdot}</p>
          </div>
          <Gauge className="size-7" />
        </div>
        <div className="my-7 h-px bg-black/15" />
        <p className="text-sm font-bold opacity-60">Rodagem / Base · Z2</p>
        <p className="mt-2 text-4xl font-black tracking-[-0.05em]">{result.zones.Z2}</p>
        <p className="mt-1 text-sm font-bold opacity-60">min/km</p>
        <Button onClick={onClick} className="mt-auto h-11 rounded-xl bg-black font-bold text-white hover:bg-black/85">
          Abrir régua completa <ArrowRight />
        </Button>
      </CardContent>
    </Card>
  );
}

export function CompactWorkout({ workout, done, onToggle }: { workout: Workout; done: boolean; onToggle: () => void }): React.JSX.Element {
  return (
    <Card className={`border-white/8 py-0 shadow-none transition ${done ? "bg-[#FFD700]/[0.06]" : "bg-[#1a1a1a]"}`}>
      <CardContent className="flex items-center gap-4 p-5">
        <button
          onClick={onToggle}
          className={`grid size-11 shrink-0 place-items-center rounded-xl border text-lg ${
            done ? "border-[#FFD700] bg-[#FFD700] text-black" : "border-white/10 bg-black/20"
          }`}
          aria-label={done ? "Marcar como pendente" : "Marcar como concluído"}
        >
          {done ? <Check className="size-5" /> : workout.icon}
        </button>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#FFD700]">Sessão {workout.session} · {workout.zone}</p>
          <p className={`mt-1 truncate font-bold ${done ? "text-white/45 line-through" : ""}`}>{workout.name}</p>
          <p className="mt-1 text-xs text-white/35">{workout.duration}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function GeneratedCompactSession({ session, done, onToggle }: { session: TrainingSession; done: boolean; onToggle: () => void }): React.JSX.Element {
  return (
    <Card className={`border-white/8 py-0 shadow-none transition ${done ? "bg-[#FFD700]/[0.06]" : "bg-[#1a1a1a]"}`}>
      <CardContent className="flex items-center gap-4 p-5">
        <button
          onClick={onToggle}
          className={`grid size-11 shrink-0 place-items-center rounded-xl border ${
            done ? "border-[#FFD700] bg-[#FFD700] text-black" : "border-white/10 bg-black/20 text-[#FFD700]"
          }`}
          aria-label={done ? "Marcar como pendente" : "Marcar como concluído"}
        >
          {done ? <Check className="size-5" /> : <Activity className="size-5" />}
        </button>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#FFD700]">Sessão {session.sessao} · {session.tipo}</p>
          <p className={`mt-1 truncate font-bold ${done ? "text-white/45 line-through" : ""}`}>{session.titulo}</p>
          <p className="mt-1 text-xs text-white/35">{session.duracaoMinutos} min · {session.intensidade}</p>
        </div>
      </CardContent>
    </Card>
  );
}
