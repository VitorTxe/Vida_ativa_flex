import { useCallback, useEffect, useMemo, useState } from "react";
import { findVdot, getWorkouts, VDOT_ROWS, type Goal, type VdotRow, type Workout } from "@/frontend/lib/fitness-data";
import type { GeneratedTrainingPlan, RunningProfile } from "@/backend/types";
import type { AuthStatus, AuthUser, ModelContext, OnboardingStatus, View } from "@/frontend/types/dashboard.types";
import type { StravaConnectionStatus, TrainingCompletion } from "@/frontend/types";

const EMPTY_STRAVA_STATUS: StravaConnectionStatus = {
  connected: false,
  athlete: null,
  scopes: [],
  connectedAt: null,
};

export function useDashboardState() {
  const [view, setView] = useState<View>("home");
  const [goal, setGoal] = useState<Goal>("10k");
  const [minutes, setMinutes] = useState(14);
  const [seconds, setSeconds] = useState(28);
  const [result, setResult] = useState<VdotRow>(VDOT_ROWS[4]);
  const [week, setWeek] = useState(2);
  const [completions, setCompletions] = useState<TrainingCompletion[]>([]);
  const [stravaStatus, setStravaStatus] = useState<StravaConnectionStatus>(EMPTY_STRAVA_STATUS);
  const [stravaBusy, setStravaBusy] = useState(false);
  const [stravaNotice, setStravaNotice] = useState("");
  const [message, setMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>("idle");
  const [initialRunningProfile, setInitialRunningProfile] = useState<RunningProfile | null>(null);
  const [trainingPlan, setTrainingPlan] = useState<GeneratedTrainingPlan | null>(null);
  const [onboardingRefresh, setOnboardingRefresh] = useState(0);

  const workouts = useMemo<Workout[]>(() => getWorkouts(goal, week), [goal, week]);
  const completed = useMemo(
    () => completions.filter((item) => item.week === week).map((item) => item.session),
    [completions, week]
  );

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then(async (response) => (response.ok ? ((await response.json()) as { user?: AuthUser }) : null))
      .then((data) => {
        if (!active) return;
        if (!data?.user) {
          setAuthStatus("anonymous");
          return;
        }
        setCurrentUser(data.user);
        setAuthStatus("authenticated");
      })
      .catch((error: unknown) => {
        console.error("Falha ao obter sessão do usuário:", error);
        if (active) setAuthStatus("anonymous");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      return;
    }
    let active = true;
    fetch("/api/onboarding")
      .then(async (response) => {
        if (!response.ok) throw new Error("onboarding_unavailable");
        return (await response.json()) as {
          completed?: boolean;
          profile?: RunningProfile | null;
          plan?: GeneratedTrainingPlan | null;
        };
      })
      .then((data) => {
        if (!active) return;
        setInitialRunningProfile(data.profile ?? null);
        if (data.completed && data.plan) {
          setTrainingPlan(data.plan);
          setOnboardingStatus("complete");
        } else {
          setTrainingPlan(null);
          setOnboardingStatus("required");
        }
      })
      .catch((error: unknown) => {
        console.error("Falha ao carregar status do onboarding:", error);
        if (active) setOnboardingStatus("error");
      });
    return () => {
      active = false;
    };
  }, [authStatus, onboardingRefresh]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let active = true;
    fetch("/api/profile")
      .then(async (response) =>
        response.ok
          ? ((await response.json()) as {
              profile?: { objetivo?: Goal; minutosTeste?: number; segundosTeste?: number; totalSegundos?: number };
            })
          : null
      )
      .then((data) => {
        if (!active || !data?.profile) return;
        const profile = data.profile;
        if (profile.objetivo && ["5k", "10k", "21k"].includes(profile.objetivo)) setGoal(profile.objetivo);
        if (typeof profile.minutosTeste === "number") setMinutes(profile.minutosTeste);
        if (typeof profile.segundosTeste === "number") setSeconds(profile.segundosTeste);
        if (typeof profile.totalSegundos === "number") {
          const saved = findVdot(profile.totalSegundos);
          if (saved) setResult(saved);
        }
      })
      .catch((error: unknown) => {
        console.error("Falha ao recuperar perfil:", error);
      });
    return () => {
      active = false;
    };
  }, [authStatus]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let active = true;
    const currentUrl = new URL(window.location.href);
    const oauthStatus = currentUrl.searchParams.get("strava");
    if (oauthStatus) {
      const notices: Record<string, string> = {
        connected: "Conta Strava conectada com sucesso.",
        denied: "A autorização do Strava foi cancelada.",
        invalid_state: "A sessão de autorização expirou. Tente conectar novamente.",
        error: "Não foi possível concluir a conexão com o Strava.",
        login: "Entre na sua conta antes de conectar o Strava.",
      };
      const notice = notices[oauthStatus] ?? "Não foi possível concluir a conexão com o Strava.";
      queueMicrotask(() => {
        if (active) setStravaNotice(notice);
      });
      currentUrl.searchParams.delete("strava");
      window.history.replaceState({}, "", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
    }

    void Promise.all([
      fetch("/api/training-sessions", { cache: "no-store" }).then(async (response) => {
        if (!response.ok) throw new Error("training_sessions_unavailable");
        return (await response.json()) as { completions?: TrainingCompletion[] };
      }),
      fetch("/api/strava/status", { cache: "no-store" }).then(async (response) => {
        if (!response.ok) throw new Error("strava_status_unavailable");
        return (await response.json()) as StravaConnectionStatus;
      }),
    ]).then(([sessionsData, statusData]) => {
      if (!active) return;
      setCompletions(sessionsData.completions ?? []);
      setStravaStatus(statusData);
    }).catch((error: unknown) => {
      console.error("Falha ao carregar integrações do treino:", error);
    });

    return () => {
      active = false;
    };
  }, [authStatus]);

  async function persistProfile(payload: { objetivo?: Goal; minutosTeste?: number; segundosTeste?: number }) {
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error: unknown) {
      console.error("Falha ao persistir alterações no perfil:", error);
    }
  }

  const calculate = useCallback(
    (nextMinutes = minutes, nextSeconds = seconds): VdotRow | null => {
      const normalizedSeconds = Math.max(0, Math.min(59, nextSeconds));
      const match = findVdot(nextMinutes * 60 + normalizedSeconds);
      setSeconds(normalizedSeconds);
      if (!match) {
        setMessage("Use um tempo entre 9:30 e 18:30 para calcular as zonas.");
        return null;
      }
      setResult(match);
      setMessage(`Zonas atualizadas: VDOT ${match.vdot}.`);
      void persistProfile({ minutosTeste: nextMinutes, segundosTeste: normalizedSeconds });
      return match;
    },
    [minutes, seconds]
  );

  function updateGoal(nextGoal: Goal) {
    setGoal(nextGoal);
    void persistProfile({ objetivo: nextGoal });
  }

  async function toggleCompleted(weekNumber: number, session: number) {
    const existing = completions.find((item) => item.week === weekNumber && item.session === session);
    if (existing) {
      setCompletions((current) => current.filter((item) => item.id !== existing.id));
      try {
        const response = await fetch(`/api/training-sessions?week=${weekNumber}&session=${session}`, { method: "DELETE" });
        if (!response.ok) throw new Error("completion_delete_failed");
      } catch (error: unknown) {
        console.error("Falha ao desmarcar treino:", error);
        setCompletions((current) => [...current.filter((item) => item.id !== existing.id), existing]);
      }
      return;
    }

    const optimistic: TrainingCompletion = {
      id: `optimistic-${weekNumber}-${session}`,
      week: weekNumber,
      session,
      source: "manual",
      stravaActivityId: null,
      activityName: null,
      sportType: null,
      startDate: null,
      movingTime: null,
      elapsedTime: null,
      distanceMeters: null,
      averageSpeed: null,
      paceAverage: null,
      completedAt: new Date().toISOString(),
      stravaUrl: null,
    };
    setCompletions((current) => [...current, optimistic]);
    try {
      const response = await fetch("/api/training-sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ week: weekNumber, session }),
      });
      const data = (await response.json().catch(() => null)) as { completion?: TrainingCompletion } | null;
      if (!response.ok || !data?.completion) throw new Error("completion_save_failed");
      setCompletions((current) => current.map((item) => item.id === optimistic.id ? data.completion! : item));
    } catch (error: unknown) {
      console.error("Falha ao concluir treino:", error);
      setCompletions((current) => current.filter((item) => item.id !== optimistic.id));
    }
  }

  function handleStravaLinked(completion: TrainingCompletion) {
    setCompletions((current) => [
      ...current.filter((item) => !(item.week === completion.week && item.session === completion.session)),
      completion,
    ]);
  }

  function connectStrava() {
    window.location.assign(new URL("/api/strava/connect", window.location.origin).toString());
  }

  async function disconnectStrava() {
    setStravaBusy(true);
    try {
      const response = await fetch("/api/strava/disconnect", { method: "POST" });
      if (!response.ok) throw new Error("strava_disconnect_failed");
      setStravaStatus(EMPTY_STRAVA_STATUS);
      setCompletions((current) => current.filter((item) => item.source !== "strava"));
    } catch (error: unknown) {
      console.error("Falha ao desconectar Strava:", error);
    } finally {
      setStravaBusy(false);
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error: unknown) {
      console.error("Erro ao efetuar logout:", error);
    }
    setCurrentUser(null);
    setTrainingPlan(null);
    setInitialRunningProfile(null);
    setCompletions([]);
    setStravaStatus(EMPTY_STRAVA_STATUS);
    setOnboardingStatus("idle");
    setAuthStatus("anonymous");
    setView("home");
  }

  function handleAuthenticated(user: AuthUser) {
    setCurrentUser(user);
    if (["5k", "10k", "21k"].includes(user.objetivo)) setGoal(user.objetivo as Goal);
    setOnboardingStatus("loading");
    setAuthStatus("authenticated");
  }

  function handleOnboardingComplete(plan: GeneratedTrainingPlan) {
    setTrainingPlan(plan);
    setWeek(1);
    setCompletions([]);
    setView("plan");
    setOnboardingStatus("complete");
  }

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const controller = new AbortController();
    const modelContext = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (modelContext?.registerTool) {
      void Promise.resolve(
        modelContext.registerTool(
          {
            name: "calculate_training_zones",
            title: "Calcular zonas de treino",
            description: "Calcula as sete zonas de ritmo a partir do tempo de 3 km e atualiza o painel visível.",
            inputSchema: {
              type: "object",
              properties: {
                minutes: { type: "integer", minimum: 9, maximum: 18 },
                seconds: { type: "integer", minimum: 0, maximum: 59 },
              },
              required: ["minutes", "seconds"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            execute: (input: unknown) => {
              const data = input as { minutes?: number; seconds?: number };
              if (!Number.isInteger(data.minutes) || !Number.isInteger(data.seconds)) throw new Error("Tempo inválido.");
              setMinutes(data.minutes!);
              setSeconds(data.seconds!);
              const match = calculate(data.minutes!, data.seconds!);
              if (!match) throw new Error("Tempo fora da faixa disponível.");
              return { vdot: match.vdot, zones: match.zones };
            },
          },
          { signal: controller.signal }
        )
      ).catch(() => undefined);
    }
    return () => controller.abort();
  }, [calculate]);

  return {
    view,
    setView,
    goal,
    setGoal: updateGoal,
    minutes,
    setMinutes,
    seconds,
    setSeconds,
    result,
    week,
    setWeek,
    completed,
    completions,
    getCompletedSessions: (weekNumber: number) => completions.filter((item) => item.week === weekNumber).map((item) => item.session),
    toggleCompleted,
    message,
    calculate,
    menuOpen,
    setMenuOpen,
    authStatus,
    currentUser,
    onboardingStatus,
    initialRunningProfile,
    trainingPlan,
    workouts,
    stravaStatus,
    stravaBusy,
    stravaNotice,
    clearStravaNotice: () => setStravaNotice(""),
    connectStrava,
    disconnectStrava,
    handleStravaLinked,
    logout,
    handleAuthenticated,
    handleOnboardingComplete,
    retryOnboarding: () => {
      setOnboardingStatus("loading");
      setOnboardingRefresh((value) => value + 1);
    },
  };
}
