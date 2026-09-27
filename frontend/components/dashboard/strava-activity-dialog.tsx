"use client";

import React, { useEffect, useState } from "react";
import { Activity, ExternalLink, LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
import type { StravaActivity, TrainingCompletion } from "@/frontend/types";

interface StravaActivityDialogProps {
  open: boolean;
  week: number;
  session: number;
  onOpenChange: (open: boolean) => void;
  onLinked: (completion: TrainingCompletion) => void;
}

export function StravaActivityDialog({
  open,
  week,
  session,
  onOpenChange,
  onLinked,
}: StravaActivityDialogProps): React.JSX.Element {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadActivities() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/strava/activities", { cache: "no-store" });
      const data = (await response.json().catch(() => null)) as { activities?: StravaActivity[]; error?: string } | null;
      if (!response.ok) throw new Error(data?.error ?? "Não foi possível carregar as atividades.");
      setActivities(data?.activities ?? []);
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar as atividades.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    let active = true;
    void requestActivities()
      .then((nextActivities) => {
        if (active) setActivities(nextActivities);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar as atividades.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open]);

  async function linkActivity(activityId: string) {
    setLinkingId(activityId);
    setError("");
    try {
      const response = await fetch("/api/training-sessions/strava", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ week, session, activityId }),
      });
      const data = (await response.json().catch(() => null)) as { completion?: TrainingCompletion; error?: string } | null;
      if (!response.ok || !data?.completion) throw new Error(data?.error ?? "Não foi possível vincular a atividade.");
      onLinked(data.completion);
      onOpenChange(false);
    } catch (linkError: unknown) {
      setError(linkError instanceof Error ? linkError.message : "Não foi possível vincular a atividade.");
    } finally {
      setLinkingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-hidden border-white/10 bg-[#151515] p-0 text-white sm:max-w-2xl">
        <DialogHeader className="border-b border-white/8 p-6 pr-12">
          <DialogTitle className="flex items-center gap-3 text-xl font-black">
            <span className="grid size-10 place-items-center rounded-xl bg-[#FC5200] text-white">
              <Activity className="size-5" />
            </span>
            Escolha uma corrida
          </DialogTitle>
          <DialogDescription className="text-white/45">
            Vincule uma atividade recente do Strava à sessão {session} da semana {week}.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto p-4 sm:p-6">
          {loading && (
            <div className="grid min-h-52 place-items-center text-sm text-white/45">
              <span className="flex items-center gap-2"><LoaderCircle className="size-4 animate-spin" /> Buscando corridas...</span>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
              <p>{error}</p>
              <Button onClick={() => void loadActivities()} variant="ghost" className="mt-3 px-0 text-white hover:bg-transparent">
                <RefreshCw /> Tentar novamente
              </Button>
            </div>
          )}

          {!loading && !error && activities.length === 0 && (
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-6 text-center">
              <p className="font-bold">Nenhuma corrida recente encontrada</p>
              <p className="mt-2 text-sm text-white/40">Foram consultados os últimos 90 dias no Strava.</p>
            </div>
          )}

          {!loading && !error && activities.length > 0 && (
            <div className="space-y-3">
              {activities.map((activity) => (
                <article key={activity.id} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-[#FC5200]/45">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-black">{activity.name}</p>
                      <p className="mt-1 text-xs text-white/40">{formatActivityDate(activity.startDate)}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                        <span className="rounded-full bg-white/6 px-3 py-1.5">{formatDistance(activity.distanceMeters)}</span>
                        <span className="rounded-full bg-white/6 px-3 py-1.5">{formatDuration(activity.movingTime)}</span>
                        <span className="rounded-full bg-white/6 px-3 py-1.5">{activity.paceAverage ?? "pace indisponível"}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <a
                        href={activity.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold text-[#FC5200] hover:bg-[#FC5200]/10"
                      >
                        View on Strava <ExternalLink className="size-3.5" />
                      </a>
                      <Button
                        onClick={() => void linkActivity(activity.id)}
                        disabled={Boolean(linkingId)}
                        className="h-10 rounded-xl bg-[#FC5200] font-black text-white hover:bg-[#e54a00]"
                      >
                        {linkingId === activity.id ? <LoaderCircle className="animate-spin" /> : "Vincular"}
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

async function requestActivities(): Promise<StravaActivity[]> {
  const response = await fetch("/api/strava/activities", { cache: "no-store" });
  const data = (await response.json().catch(() => null)) as { activities?: StravaActivity[]; error?: string } | null;
  if (!response.ok) throw new Error(data?.error ?? "Não foi possível carregar as atividades.");
  return data?.activities ?? [];
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatDistance(meters: number): string {
  return `${(meters / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km`;
}

function formatActivityDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
