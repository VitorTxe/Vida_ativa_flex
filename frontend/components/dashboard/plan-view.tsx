import React, { Fragment, useState } from "react";
import { Activity, Check, Clock3, Download, ExternalLink } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent } from "@/frontend/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import type { GeneratedTrainingPlan, TrainingSession } from "@/backend/types";
import type { Goal, VdotRow, Workout, ZoneKey } from "@/frontend/lib/fitness-data";
import type { StravaConnectionStatus, TrainingCompletion } from "@/frontend/types";
import { getPlanCycleProgress } from "@/frontend/lib/plan-progress";
import { CycleCallBanner, CycleCallButton } from "./cycle-call-banner";
import { formatDuration, StravaActivityDialog } from "./strava-activity-dialog";
import { StravaConnectButton } from "./strava-connect-button";

interface PlanViewProps {
  goal: Goal;
  result: VdotRow;
  week: number;
  workouts: Workout[];
  trainingPlan: GeneratedTrainingPlan | null;
  completions: TrainingCompletion[];
  stravaStatus: StravaConnectionStatus;
  onWeek: (week: number) => void;
  onToggle: (week: number, session: number) => void;
  onConnectStrava: () => void;
  onStravaLinked: (completion: TrainingCompletion) => void;
}

export function PlanView({
  goal,
  result,
  week,
  workouts,
  trainingPlan,
  completions,
  stravaStatus,
  onWeek,
  onToggle,
  onConnectStrava,
  onStravaLinked,
}: PlanViewProps): React.JSX.Element {
  const [stravaTarget, setStravaTarget] = useState<{ week: number; session: number } | null>(null);

  const cycleProgress = getPlanCycleProgress(trainingPlan, workouts, completions);

  if (trainingPlan) {
    const currentWeek = trainingPlan.semanas.find((item) => item.semana === week) ?? trainingPlan.semanas[0];
    return (
      <>
        <div className="space-y-5">
          <section className="flex flex-col justify-between gap-5 rounded-2xl border border-white/8 bg-[#1a1a1a] p-5 sm:flex-row sm:items-center sm:p-6">
            <Tabs value={String(currentWeek.semana)} onValueChange={(value) => onWeek(Number(value))}>
              <TabsList className="h-11 w-full bg-black/35 p-1 sm:w-auto">
                {trainingPlan.semanas.map((item) => (
                  <TabsTrigger key={item.semana} value={String(item.semana)} className="px-3 sm:px-4">
                    S{item.semana}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="flex flex-wrap items-center gap-3">
              <CycleCallButton progress={cycleProgress} />
              <StravaToolbar status={stravaStatus} onConnect={onConnectStrava} />
            </div>
          </section>

          <CycleCallBanner progress={cycleProgress} />

          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {currentWeek.sessoes.map((session) => {
              const completion = findCompletion(completions, currentWeek.semana, session.sessao);
              return (
                <GeneratedWorkoutCard
                  key={session.sessao}
                  session={session}
                  week={currentWeek.semana}
                  completion={completion}
                  stravaConnected={stravaStatus.connected}
                  onToggle={() => onToggle(currentWeek.semana, session.sessao)}
                  onImport={() => setStravaTarget({ week: currentWeek.semana, session: session.sessao })}
                />
              );
            })}
          </section>
        </div>
        {stravaTarget && (
          <StravaActivityDialog
            open
            week={stravaTarget.week}
            session={stravaTarget.session}
            onOpenChange={(open) => { if (!open) setStravaTarget(null); }}
            onLinked={onStravaLinked}
          />
        )}
      </>
    );
  }

  return (
    <>
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-5 rounded-2xl border border-white/8 bg-[#1a1a1a] p-5 lg:flex-row lg:items-center sm:p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-black text-primary-foreground">
              OBJETIVO {goal.toUpperCase()}
            </span>
            <span className="text-xs text-white/35">Ciclo 01</span>
          </div>
          <p className="mt-3 max-w-lg text-sm leading-6 text-white/50">
            Complete as três sessões na ordem que funcionar para você. Evite fazer os blocos 1 e 3 em dias consecutivos.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Tabs value={String(week)} onValueChange={(value) => onWeek(Number(value))}>
            <TabsList className="h-11 w-full bg-black/35 p-1 sm:w-auto">
              {[1, 2, 3, 4].map((item) => (
                <TabsTrigger key={item} value={String(item)} className="px-3 sm:px-4">
                  S{item}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="flex flex-wrap items-center gap-3">
            <CycleCallButton progress={cycleProgress} />
            <StravaToolbar status={stravaStatus} onConnect={onConnectStrava} />
          </div>
        </div>
      </section>

      <CycleCallBanner progress={cycleProgress} />

      <section className="grid gap-5 xl:grid-cols-3">
        {workouts.map((workout) => {
          const completion = findCompletion(completions, week, workout.session);
          return (
            <WorkoutCard
              key={workout.session}
              workout={workout}
              zones={result.zones}
              completion={completion}
              stravaConnected={stravaStatus.connected}
              onToggle={() => onToggle(week, workout.session)}
              onImport={() => setStravaTarget({ week, session: workout.session })}
            />
          );
        })}
      </section>
    </div>
    {stravaTarget && (
      <StravaActivityDialog
        open
        week={stravaTarget.week}
        session={stravaTarget.session}
        onOpenChange={(open) => { if (!open) setStravaTarget(null); }}
        onLinked={onStravaLinked}
      />
    )}
    </>
  );
}

function GeneratedWorkoutCard({
  session,
  week,
  completion,
  stravaConnected,
  onToggle,
  onImport,
}: {
  session: TrainingSession;
  week: number;
  completion: TrainingCompletion | null;
  stravaConnected: boolean;
  onToggle: () => void;
  onImport: () => void;
}): React.JSX.Element {
  const done = Boolean(completion);
  return (
    <Card className={`min-h-[390px] overflow-hidden border-white/8 py-0 shadow-none ${done ? "bg-[#171717] opacity-75" : "bg-[#1a1a1a]"}`}>
      <CardContent className="flex h-full flex-col p-6">
        <div className="flex items-start justify-between">
          <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <Activity className="size-5" />
          </span>
          <button
            onClick={onToggle}
            className={`grid size-10 place-items-center rounded-xl border transition ${
              done ? "border-primary bg-primary text-primary-foreground" : "border-white/10 hover:border-primary/60"
            }`}
            aria-label={done ? "Marcar treino como pendente" : "Marcar treino como concluído"}
          >
            {done ? <Check className="size-5" /> : <span className="size-3 rounded-full border border-white/35" />}
          </button>
        </div>
        <p className="mt-7 text-xs font-black uppercase tracking-[0.18em] text-primary">Sessão {session.sessao} · Semana {week}</p>
        <h3 className="mt-3 text-2xl font-black tracking-[-0.04em]">{session.titulo}</h3>
        <p className="mt-2 text-sm font-bold text-white/40">{session.tipo} · {session.intensidade}</p>
        <p className="mt-4 text-sm leading-7 text-white/55">{session.descricao}</p>
        {completion?.source === "strava" && <StravaCompletionDetails completion={completion} />}
        <div className="mt-auto pt-8">
          <div className="h-px bg-white/8" />
          <div className="mt-5 flex items-center gap-2 text-sm text-white/45">
            <Clock3 className="size-4 text-primary" />
            {session.duracaoMinutos} minutos
          </div>
          {stravaConnected && (
            <Button onClick={onImport} variant="outline" className="mt-4 h-10 w-full rounded-xl border-[#FC5200]/35 bg-[#FC5200]/5 text-[#FC5200] hover:bg-[#FC5200]/10 hover:text-[#FC5200]">
              <Download /> {completion?.source === "strava" ? "Trocar atividade" : "Importar do Strava"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function WorkoutCard({
  workout,
  zones,
  completion,
  stravaConnected,
  onToggle,
  onImport,
}: {
  workout: Workout;
  zones: Record<ZoneKey, string>;
  completion: TrainingCompletion | null;
  stravaConnected: boolean;
  onToggle: () => void;
  onImport: () => void;
}): React.JSX.Element {
  const done = Boolean(completion);
  return (
    <Card className={`min-h-[460px] overflow-hidden border-white/8 py-0 shadow-none ${done ? "bg-[#171717] opacity-75" : "bg-[#1a1a1a]"}`}>
      <CardContent className="flex h-full flex-col p-6">
        <div className="flex items-start justify-between">
          <span className="text-4xl">{workout.icon}</span>
          <button
            onClick={onToggle}
            className={`grid size-10 place-items-center rounded-xl border transition ${
              done ? "border-primary bg-primary text-primary-foreground" : "border-white/10 hover:border-primary/60"
            }`}
            aria-label={done ? "Marcar treino como pendente" : "Marcar treino como concluído"}
          >
            {done ? <Check className="size-5" /> : <span className="size-3 rounded-full border border-white/35" />}
          </button>
        </div>
        <p className="mt-7 text-xs font-black uppercase tracking-[0.18em] text-primary">Sessão {workout.session} · Semana {workout.week}</p>
        <h2 className="mt-3 text-2xl font-black tracking-[-0.04em]">{workout.name}</h2>
        <p className="mt-4 text-sm leading-7 text-white/55"><WorkoutText text={workout.description} zones={zones} /></p>
        {completion?.source === "strava" && <StravaCompletionDetails completion={completion} />}
        <div className="mt-auto pt-8">
          <div className="h-px bg-white/8" />
          <div className="mt-5 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-white/45">
              <Clock3 className="size-4 text-primary" />
              {workout.duration}
            </span>
            <span className="rounded-full bg-white/6 px-3 py-1.5 text-xs font-black text-primary">
              ALVO {workout.zone}
            </span>
          </div>
          {stravaConnected && (
            <Button onClick={onImport} variant="outline" className="mt-4 h-10 w-full rounded-xl border-[#FC5200]/35 bg-[#FC5200]/5 text-[#FC5200] hover:bg-[#FC5200]/10 hover:text-[#FC5200]">
              <Download /> {completion?.source === "strava" ? "Trocar atividade" : "Importar do Strava"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StravaToolbar({ status, onConnect }: { status: StravaConnectionStatus; onConnect: () => void }): React.JSX.Element {
  if (status.connected) {
    return (
      <span className="inline-flex h-10 items-center gap-2 rounded-xl border border-strava-border bg-strava-muted px-3.5 text-xs font-bold text-strava">
        <Activity className="size-4" /> Strava conectado
      </span>
    );
  }
  return <StravaConnectButton onClick={onConnect} variant="compact" />;
}

function StravaCompletionDetails({ completion }: { completion: TrainingCompletion }): React.JSX.Element {
  return (
    <div className="mt-5 rounded-2xl border border-strava-border bg-strava-muted p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-strava">Realizado com Strava</p>
          <p className="mt-1 truncate text-sm font-bold">{completion.activityName}</p>
        </div>
        {completion.stravaUrl && (
          <a href={completion.stravaUrl} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-strava hover:underline">
            Ver no Strava <ExternalLink className="size-3" />
          </a>
        )}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Metric value={completion.movingTime ? formatDuration(completion.movingTime) : "—"} label="movimento" />
        <Metric value={completion.distanceMeters ? `${(completion.distanceMeters / 1000).toFixed(2)} km` : "—"} label="distância" />
        <Metric value={completion.paceAverage ?? "—"} label="pace" />
      </div>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }): React.JSX.Element {
  return (
    <div className="rounded-xl bg-black/20 px-2 py-2">
      <p className="text-xs font-black">{value}</p>
      <p className="mt-1 text-[10px] text-white/35">{label}</p>
    </div>
  );
}

function findCompletion(completions: TrainingCompletion[], week: number, session: number): TrainingCompletion | null {
  return completions.find((item) => item.week === week && item.session === session) ?? null;
}

function WorkoutText({ text, zones }: { text: string; zones: Record<ZoneKey, string> }): React.JSX.Element {
  const parts = text.split(/(\{Z[1-7]\})/g);
  return (
    <>
      {parts.map((part, index) => {
        const match = part.match(/^\{(Z[1-7])\}$/);
        return match ? (
          <Fragment key={index}>
            <mark className="rounded bg-primary/15 px-1.5 py-0.5 font-bold text-primary">
              {match[1]} · {zones[match[1] as ZoneKey]} min/km
            </mark>
          </Fragment>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        );
      })}
    </>
  );
}
