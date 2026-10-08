import React, { Fragment, useState } from "react";
import { Activity, Check, Clock3, Download } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent } from "@/frontend/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import type { GeneratedTrainingPlan, TrainingSession } from "@/backend/types";
import type { Goal, VdotRow, Workout, ZoneKey } from "@/frontend/lib/fitness-data";
import type { StravaConnectionStatus, TrainingCompletion } from "@/frontend/types";
import { getPlanCycleProgress } from "@/frontend/lib/plan-progress";
import { CycleCallBanner, CycleCallButton } from "./cycle-call-banner";
import { StravaActivityDialog } from "./strava-activity-dialog";
import { StravaCompletionDetails } from "./strava-completion-details";
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
  onDeleteCompletion?: (week: number, session: number) => void;
  onConnectStrava: () => void;
  onStravaLinked: (completion: TrainingCompletion) => void;
  canScheduleCall?: boolean;
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
  onDeleteCompletion,
  onConnectStrava,
  onStravaLinked,
  canScheduleCall = true,
}: PlanViewProps): React.JSX.Element {
  const [stravaTarget, setStravaTarget] = useState<{ week: number; session: number } | null>(null);

  const cycleProgress = getPlanCycleProgress(trainingPlan, workouts, completions);

  if (trainingPlan) {
    const currentWeek = trainingPlan.semanas.find((item) => item.semana === week) ?? trainingPlan.semanas[0];
    return (
      <>
        <div className="space-y-5">
          <section className="flex flex-col justify-between gap-5 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:p-6">
            <Tabs value={String(currentWeek.semana)} onValueChange={(value) => onWeek(Number(value))}>
              <TabsList className="h-11 w-full bg-background/50 p-1 sm:w-auto">
                {trainingPlan.semanas.map((item) => (
                  <TabsTrigger key={item.semana} value={String(item.semana)} className="px-3 sm:px-4">
                    S{item.semana}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="flex flex-wrap items-center gap-3">
              <CycleCallButton progress={cycleProgress} canScheduleCall={canScheduleCall} />
              <StravaToolbar status={stravaStatus} onConnect={onConnectStrava} />
            </div>
          </section>

          <CycleCallBanner progress={cycleProgress} canScheduleCall={canScheduleCall} />

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
                  onDeleteTime={() => onDeleteCompletion?.(currentWeek.semana, session.sessao)}
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
        <section className="flex flex-col justify-between gap-5 rounded-2xl border border-border bg-card p-5 lg:flex-row lg:items-center sm:p-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-black text-primary-foreground">
                OBJETIVO {goal.toUpperCase()}
              </span>
              <span className="text-xs text-muted-foreground">Ciclo 01</span>
            </div>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
              Complete as três sessões na ordem que funcionar para você. Evite fazer os blocos 1 e 3 em dias consecutivos.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Tabs value={String(week)} onValueChange={(value) => onWeek(Number(value))}>
              <TabsList className="h-11 w-full bg-background/50 p-1 sm:w-auto">
                {[1, 2, 3, 4].map((item) => (
                  <TabsTrigger key={item} value={String(item)} className="px-3 sm:px-4">
                    S{item}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="flex flex-wrap items-center gap-3">
              <CycleCallButton progress={cycleProgress} canScheduleCall={canScheduleCall} />
              <StravaToolbar status={stravaStatus} onConnect={onConnectStrava} />
            </div>
          </div>
        </section>

        <CycleCallBanner progress={cycleProgress} canScheduleCall={canScheduleCall} />

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
                onDeleteTime={() => onDeleteCompletion?.(week, workout.session)}
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
  onDeleteTime,
  onImport,
}: {
  session: TrainingSession;
  week: number;
  completion: TrainingCompletion | null;
  stravaConnected: boolean;
  onToggle: () => void;
  onDeleteTime: () => void;
  onImport: () => void;
}): React.JSX.Element {
  const done = Boolean(completion);
  return (
    <Card className={`min-h-[390px] overflow-hidden border-border py-0 shadow-none ${done ? "bg-card/75 opacity-80" : "bg-card"}`}>
      <CardContent className="flex h-full flex-col p-6">
        <div className="flex items-start justify-between">
          <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <Activity className="size-5" />
          </span>
          <button
            onClick={onToggle}
            className={`grid size-10 place-items-center rounded-xl border transition ${
              done ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/60"
            }`}
            aria-label={done ? "Marcar treino como pendente" : "Marcar treino como concluído"}
          >
            {done ? <Check className="size-5" /> : <span className="size-3 rounded-full border border-muted-foreground" />}
          </button>
        </div>
        <p className="mt-7 text-xs font-black uppercase tracking-[0.18em] text-primary">Sessão {session.sessao} · Semana {week}</p>
        <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-foreground">{session.titulo}</h3>
        <p className="mt-2 text-sm font-bold text-muted-foreground">{session.tipo} · {session.intensidade}</p>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">{session.descricao}</p>
        {completion?.source === "strava" && (
          <StravaCompletionDetails completion={completion} onDeleteTime={onDeleteTime} />
        )}
        <div className="mt-auto pt-8">
          <div className="h-px bg-border" />
          <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock3 className="size-4 text-primary" />
            {session.duracaoMinutos} minutos
          </div>
          {stravaConnected && (
            <Button
              onClick={onImport}
              variant="outline"
              className="mt-4 h-10 w-full rounded-xl border-strava-border bg-strava-muted text-strava hover:bg-strava/15 hover:text-strava"
            >
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
  onDeleteTime,
  onImport,
}: {
  workout: Workout;
  zones: Record<ZoneKey, string>;
  completion: TrainingCompletion | null;
  stravaConnected: boolean;
  onToggle: () => void;
  onDeleteTime: () => void;
  onImport: () => void;
}): React.JSX.Element {
  const done = Boolean(completion);
  return (
    <Card className={`min-h-[460px] overflow-hidden border-border py-0 shadow-none ${done ? "bg-card/75 opacity-80" : "bg-card"}`}>
      <CardContent className="flex h-full flex-col p-6">
        <div className="flex items-start justify-between">
          <span className="text-4xl">{workout.icon}</span>
          <button
            onClick={onToggle}
            className={`grid size-10 place-items-center rounded-xl border transition ${
              done ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/60"
            }`}
            aria-label={done ? "Marcar treino como pendente" : "Marcar treino como concluído"}
          >
            {done ? <Check className="size-5" /> : <span className="size-3 rounded-full border border-muted-foreground" />}
          </button>
        </div>
        <p className="mt-7 text-xs font-black uppercase tracking-[0.18em] text-primary">Sessão {workout.session} · Semana {workout.week}</p>
        <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-foreground">{workout.name}</h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground"><WorkoutText text={workout.description} zones={zones} /></p>
        {completion?.source === "strava" && (
          <StravaCompletionDetails completion={completion} onDeleteTime={onDeleteTime} />
        )}
        <div className="mt-auto pt-8">
          <div className="h-px bg-border" />
          <div className="mt-5 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock3 className="size-4 text-primary" />
              {workout.duration}
            </span>
            <span className="rounded-full bg-muted px-3 py-1.5 text-xs font-black text-primary">
              ALVO {workout.zone}
            </span>
          </div>
          {stravaConnected && (
            <Button
              onClick={onImport}
              variant="outline"
              className="mt-4 h-10 w-full rounded-xl border-strava-border bg-strava-muted text-strava hover:bg-strava/15 hover:text-strava"
            >
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
