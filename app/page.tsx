"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity, ArrowRight, BadgeCheck, CalendarDays, Check, ChevronRight,
  CircleHelp, Clock3, Gauge, Headphones, Home, LockKeyhole, LogOut,
  LoaderCircle, Medal, Menu, RotateCcw, ShieldCheck, Sparkles, TimerReset,
  UserPlus, UserRound, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  findVdot, getWorkouts, VDOT_ROWS, ZONE_META,
  type Goal, type VdotRow, type Workout, type ZoneKey,
} from "@/lib/fitness-data";

type View = "home" | "test" | "paces" | "plan" | "profile";
type AuthUser = {
  idAluno: string;
  nome: string;
  email: string;
  statusPagamento: "Ativo" | "Inativo";
  objetivo: Goal | "42k";
};
type ModelContext = {
  registerTool: (tool: {
    name: string;
    title: string;
    description: string;
    inputSchema: object;
    annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
    execute: (input: unknown) => unknown;
  }, options?: { signal?: AbortSignal }) => void | Promise<void>;
};

const navItems: { id: View; icon: LucideIcon; label: string; mobile: string }[] = [
  { id: "home", icon: Home, label: "Visão geral", mobile: "Início" },
  { id: "test", icon: TimerReset, label: "Teste de 3 km", mobile: "Teste" },
  { id: "paces", icon: Gauge, label: "Meus ritmos", mobile: "Ritmos" },
  { id: "plan", icon: CalendarDays, label: "Plano flexível", mobile: "Treinos" },
  { id: "profile", icon: UserRound, label: "Perfil", mobile: "Perfil" },
];

const pageTitles: Record<View, { eyebrow: string; title: string }> = {
  home: { eyebrow: "Visão geral", title: "Pronto para evoluir?" },
  test: { eyebrow: "Central do teste", title: "Atualize seus ritmos" },
  paces: { eyebrow: "Régua metabólica", title: "Suas 7 zonas de treino" },
  plan: { eyebrow: "Ciclo atual", title: "Treine quando puder" },
  profile: { eyebrow: "Conta e preferências", title: "Seu perfil FLEX" },
};

export default function VidaAtivaFlex() {
  const [view, setView] = useState<View>("home");
  const [goal, setGoal] = useState<Goal>("10k");
  const [minutes, setMinutes] = useState(14);
  const [seconds, setSeconds] = useState(28);
  const [result, setResult] = useState<VdotRow>(VDOT_ROWS[4]);
  const [week, setWeek] = useState(2);
  const [completed, setCompleted] = useState<number[]>([1]);
  const [message, setMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [authStatus, setAuthStatus] = useState<"loading" | "anonymous" | "authenticated">("loading");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const workouts = useMemo(() => getWorkouts(goal, week), [goal, week]);
  const title = pageTitles[view];

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!active) return;
        if (!data?.user) {
          setAuthStatus("anonymous");
          return;
        }
        setCurrentUser(data.user);
        setAuthStatus("authenticated");
      })
      .catch(() => {
        if (active) setAuthStatus("anonymous");
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    let active = true;
    fetch("/api/profile")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!active || !data?.profile) return;
        const profile = data.profile as { objetivo?: Goal; minutosTeste?: number; segundosTeste?: number; totalSegundos?: number };
        if (profile.objetivo && ["5k", "10k", "21k"].includes(profile.objetivo)) setGoal(profile.objetivo);
        if (typeof profile.minutosTeste === "number") setMinutes(profile.minutosTeste);
        if (typeof profile.segundosTeste === "number") setSeconds(profile.segundosTeste);
        if (typeof profile.totalSegundos === "number") {
          const saved = findVdot(profile.totalSegundos);
          if (saved) setResult(saved);
        }
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [authStatus]);

  function calculate(nextMinutes = minutes, nextSeconds = seconds) {
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
  }

  function updateGoal(nextGoal: Goal) {
    setGoal(nextGoal);
    void persistProfile({ objetivo: nextGoal });
  }

  async function persistProfile(payload: { objetivo?: Goal; minutosTeste?: number; segundosTeste?: number }) {
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // The interactive demo remains usable when the remote profile is unavailable.
    }
  }

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const controller = new AbortController();
    const modelContext = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (modelContext?.registerTool) {
      void Promise.resolve(modelContext.registerTool({
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
        execute: (input) => {
          const data = input as { minutes?: number; seconds?: number };
          if (!Number.isInteger(data.minutes) || !Number.isInteger(data.seconds)) throw new Error("Tempo inválido.");
          setMinutes(data.minutes!);
          setSeconds(data.seconds!);
          const match = calculate(data.minutes!, data.seconds!);
          if (!match) throw new Error("Tempo fora da faixa disponível.");
          return { vdot: match.vdot, zones: match.zones };
        },
      }, { signal: controller.signal })).catch(() => undefined);
    }
    return () => controller.abort();
  }, []);

  if (authStatus === "loading") {
    return <LoadingScreen />;
  }

  if (authStatus === "anonymous" || !currentUser) {
    return <AuthScreen onAuthenticated={(user) => {
      setCurrentUser(user);
      if (["5k", "10k", "21k"].includes(user.objetivo)) setGoal(user.objetivo as Goal);
      setAuthStatus("authenticated");
    }} />;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1540px]">
        <Sidebar view={view} goal={goal} onNavigate={setView} />
        <section className="min-w-0 flex-1 px-4 pb-28 pt-5 sm:px-7 lg:px-10 lg:pb-10">
          <header className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button onClick={() => setMenuOpen(true)} className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-[#1a1a1a] lg:hidden" aria-label="Abrir menu"><Menu className="size-5" /></button>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FFD700]">{title.eyebrow}</p>
                <h1 className="mt-1 truncate text-xl font-black tracking-[-0.035em] sm:text-2xl">{title.title}</h1>
              </div>
            </div>
            <button onClick={() => setView("profile")} className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#1E1E1E] text-sm font-bold text-[#FFD700]" aria-label="Abrir perfil">{initials(currentUser.nome)}</button>
          </header>

          <div className="mt-7">
            {view === "home" && <HomeView result={result} goal={goal} workouts={getWorkouts(goal, 2)} completed={completed} onNavigate={setView} onToggle={toggleCompleted} />}
            {view === "test" && <TestView minutes={minutes} seconds={seconds} result={result} message={message} onMinutes={setMinutes} onSeconds={setSeconds} onCalculate={() => calculate()} onSeePaces={() => setView("paces")} />}
            {view === "paces" && <PacesView result={result} onRetest={() => setView("test")} />}
            {view === "plan" && <PlanView goal={goal} result={result} week={week} workouts={workouts} completed={completed} onWeek={setWeek} onToggle={toggleCompleted} />}
            {view === "profile" && <ProfileView user={currentUser} goal={goal} result={result} onGoal={updateGoal} onRetest={() => setView("test")} onLogout={async () => {
              await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
              setCurrentUser(null);
              setAuthStatus("anonymous");
              setView("home");
            }} />}
          </div>
        </section>
      </div>

      <MobileNav view={view} onNavigate={setView} />
      {menuOpen && <MobileDrawer view={view} onNavigate={(next) => { setView(next); setMenuOpen(false); }} onClose={() => setMenuOpen(false)} />}
    </main>
  );

  function toggleCompleted(session: number) {
    setCompleted((current) => current.includes(session) ? current.filter((item) => item !== session) : [...current, session]);
  }
}

function HomeView({ result, goal, workouts, completed, onNavigate, onToggle }: {
  result: VdotRow; goal: Goal; workouts: Workout[]; completed: number[]; onNavigate: (view: View) => void; onToggle: (session: number) => void;
}) {
  const next = workouts.find((item) => !completed.includes(item.session)) ?? workouts[0];
  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.38fr)_minmax(320px,.72fr)]">
        <Card className="relative overflow-hidden border-white/8 bg-[#1A1A1A] py-0 shadow-none">
          <div className="absolute right-[-8%] top-[-28%] size-72 rounded-full bg-[#FFD700]/10 blur-3xl" />
          <CardContent className="relative grid min-h-[360px] gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_.9fr]">
            <div className="flex flex-col">
              <span className="grid size-11 place-items-center rounded-2xl bg-[#FFD700] text-black"><Sparkles className="size-5" /></span>
              <p className="mt-7 text-xs font-black uppercase tracking-[0.2em] text-[#FFD700]">Seu ciclo em movimento</p>
              <h2 className="mt-3 max-w-lg text-3xl font-black leading-[1.02] tracking-[-0.055em] sm:text-5xl">Três sessões.<br />Do seu jeito.</h2>
              <p className="mt-4 max-w-md text-base leading-7 text-white/55">Sem dias fixos. Complete os blocos no seu ritmo e preserve ao menos um dia leve entre as sessões intensas.</p>
              <Button onClick={() => onNavigate("plan")} className="mt-7 h-11 w-fit rounded-xl bg-[#FFD700] px-5 font-extrabold text-black hover:bg-[#ffe13d]">Abrir plano da semana <ArrowRight /></Button>
            </div>
            <div className="flex flex-col justify-end rounded-[1.6rem] border border-white/8 bg-black/30 p-5">
              <div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">Próximo bloco</p><span className="rounded-full bg-[#FFD700]/10 px-3 py-1 text-xs font-bold text-[#FFD700]">{goal}</span></div>
              <p className="mt-8 text-4xl">{next.icon}</p>
              <h3 className="mt-3 text-xl font-black">{next.name}</h3>
              <p className="mt-2 text-sm leading-6 text-white/50">{next.duration} · alvo {next.zone}</p>
              <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/8"><div className="h-full w-1/3 rounded-full bg-[#FFD700]" /></div>
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

function TestView({ minutes, seconds, result, message, onMinutes, onSeconds, onCalculate, onSeePaces }: {
  minutes: number; seconds: number; result: VdotRow; message: string; onMinutes: (value: number) => void; onSeconds: (value: number) => void; onCalculate: () => void; onSeePaces: () => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
      <Card className="overflow-hidden border-white/8 bg-[#1A1A1A] py-0 shadow-none">
        <CardContent className="grid min-h-[540px] gap-10 p-6 sm:p-8 lg:grid-cols-[1fr_.9fr]">
          <div className="flex flex-col">
            <span className="grid size-12 place-items-center rounded-2xl bg-[#FFD700] text-black"><TimerReset className="size-6" /></span>
            <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-[#FFD700]">Teste de 3 km</p>
            <h2 className="mt-3 max-w-md text-4xl font-black leading-[1.04] tracking-[-0.055em]">Um teste simples. Sete ritmos úteis.</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-white/55">Use um percurso plano ou tempo de prova recente. Corra forte, mas de forma sustentável do primeiro ao último quilômetro.</p>
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
            <Button onClick={onCalculate} className="mt-5 h-12 rounded-xl bg-[#FFD700] font-extrabold text-black hover:bg-[#ffe13d]">Calcular minhas zonas <ChevronRight /></Button>
            <p className="mt-4 min-h-5 text-sm text-[#FFD700]" role="status">{message}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-[#FFD700]/25 bg-[#FFD700] py-0 text-black shadow-none">
        <CardContent className="flex h-full min-h-[390px] flex-col p-7">
          <div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] opacity-55">Resultado atual</p><p className="mt-2 text-6xl font-black tracking-[-0.08em]">{result.vdot}</p><p className="font-bold opacity-60">VDOT estimado</p></div><Gauge className="size-8" /></div>
          <div className="my-8 h-px bg-black/15" />
          <p className="text-sm font-bold opacity-60">Sua rodagem de base</p>
          <p className="mt-2 text-4xl font-black tracking-[-0.05em]">{result.zones.Z2}</p>
          <p className="text-sm font-bold opacity-60">min/km · Z2</p>
          <Button onClick={onSeePaces} className="mt-auto h-12 rounded-xl bg-black font-bold text-white hover:bg-black/85">Ver todas as zonas <ArrowRight /></Button>
        </CardContent>
      </Card>
    </div>
  );
}

function PacesView({ result, onRetest }: { result: VdotRow; onRetest: () => void }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/8 bg-[#1a1a1a] p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4"><span className="grid size-12 place-items-center rounded-2xl bg-[#FFD700] font-black text-black">{result.vdot}</span><div><p className="font-bold">VDOT atual</p><p className="text-sm text-white/45">Baseado no teste de {result.label} · atualizado em 02 set 2026</p></div></div>
        <Button onClick={onRetest} variant="outline" className="h-10 rounded-xl border-white/10 bg-transparent text-white hover:bg-white/5 hover:text-white"><RotateCcw /> Refazer teste</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ZONE_META.map((zone, index) => (
          <Card key={zone.key} className={`group min-h-[230px] overflow-hidden border-white/8 py-0 shadow-none transition hover:-translate-y-1 ${zone.key === "Z4" ? "bg-[#FFD700] text-black" : "bg-[#1a1a1a]"}`}>
            <CardContent className="flex h-full flex-col p-6">
              <div className="flex items-start justify-between"><span className={`grid size-11 place-items-center rounded-xl text-sm font-black ${zone.key === "Z4" ? "bg-black text-[#FFD700]" : "bg-white/6"}`}>{zone.key}</span><span className="text-xs font-bold opacity-40">0{index + 1}</span></div>
              <p className="mt-8 text-sm font-bold opacity-55">{zone.name}</p>
              <p className="mt-2 text-3xl font-black tracking-[-0.04em]">{result.zones[zone.key]}</p>
              <p className="mt-auto pt-5 text-xs font-bold uppercase tracking-[0.14em] opacity-40">min/km · {zone.short}</p>
            </CardContent>
          </Card>
        ))}
        <Card className="min-h-[230px] border-dashed border-white/14 bg-transparent py-0 shadow-none">
          <CardContent className="flex h-full flex-col items-start justify-center p-6"><CircleHelp className="size-7 text-[#FFD700]" /><p className="mt-4 font-bold">Como usar as zonas?</p><p className="mt-2 text-sm leading-6 text-white/45">O treino já mostra o pace correto em cada bloco. Você só precisa acompanhar o esforço.</p></CardContent>
        </Card>
      </div>
    </div>
  );
}

function PlanView({ goal, result, week, workouts, completed, onWeek, onToggle }: {
  goal: Goal; result: VdotRow; week: number; workouts: Workout[]; completed: number[]; onWeek: (week: number) => void; onToggle: (session: number) => void;
}) {
  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-5 rounded-2xl border border-white/8 bg-[#1a1a1a] p-5 sm:flex-row sm:items-center sm:p-6">
        <div><div className="flex items-center gap-2"><span className="rounded-full bg-[#FFD700] px-3 py-1 text-xs font-black text-black">OBJETIVO {goal.toUpperCase()}</span><span className="text-xs text-white/35">Ciclo 01</span></div><p className="mt-3 max-w-lg text-sm leading-6 text-white/50">Complete as três sessões na ordem que funcionar para você. Evite fazer os blocos 1 e 3 em dias consecutivos.</p></div>
        <Tabs value={String(week)} onValueChange={(value) => onWeek(Number(value))}>
          <TabsList className="h-11 w-full bg-black/35 p-1 sm:w-auto">
            {[1, 2, 3, 4].map((item) => <TabsTrigger key={item} value={String(item)} className="px-3 sm:px-4">S{item}</TabsTrigger>)}
          </TabsList>
        </Tabs>
      </section>
      <section className="grid gap-5 xl:grid-cols-3">
        {workouts.map((workout) => (
          <WorkoutCard key={workout.session} workout={workout} zones={result.zones} done={completed.includes(workout.session)} onToggle={() => onToggle(workout.session)} />
        ))}
      </section>
      <div className="rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/[0.06] p-5 text-sm leading-6 text-white/60"><strong className="text-[#FFD700]">Regra FLEX:</strong> sentiu dor ou fadiga fora do normal? Pause, repita uma sessão leve e procure orientação profissional. O plano organiza o treino, mas não substitui avaliação médica.</div>
    </div>
  );
}

function ProfileView({ user, goal, result, onGoal, onRetest, onLogout }: {
  user: AuthUser; goal: Goal; result: VdotRow; onGoal: (goal: Goal) => void; onRetest: () => void; onLogout: () => void | Promise<void>;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
      <Card className="border-white/8 bg-[#1a1a1a] py-0 shadow-none">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center gap-4"><span className="grid size-16 place-items-center rounded-2xl bg-[#FFD700] text-xl font-black text-black">{initials(user.nome)}</span><div><h2 className="text-xl font-black">{user.nome}</h2><p className="mt-1 text-sm text-white/45">{user.email}</p></div></div>
          <div className="my-7 h-px bg-white/8" />
          <div className="space-y-4"><ProfileRow label="ID do aluno" value={user.idAluno.slice(0, 8).toUpperCase()} /><ProfileRow label="Status" value={user.statusPagamento} accent /><ProfileRow label="VDOT atual" value={String(result.vdot)} /><ProfileRow label="Último teste" value="02 set 2026" /></div>
        </CardContent>
      </Card>
      <div className="space-y-5">
        <Card className="border-white/8 bg-[#1a1a1a] py-0 shadow-none">
          <CardHeader className="p-6 pb-0"><CardTitle className="text-lg font-black">Preferências de treino</CardTitle></CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="font-bold">Distância alvo</p><p className="mt-1 text-sm text-white/40">Adapta o volume e o longão do ciclo.</p></div><Select value={goal} onValueChange={(value) => onGoal(value as Goal)}><SelectTrigger className="h-11 w-full rounded-xl border-white/10 bg-black/25 sm:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="5k">5 km</SelectItem><SelectItem value="10k">10 km</SelectItem><SelectItem value="21k">21 km</SelectItem></SelectContent></Select></div>
            <div className="h-px bg-white/8" />
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="font-bold">Teste de 3 km</p><p className="mt-1 text-sm text-white/40">Atualize suas zonas sempre que evoluir.</p></div><Button onClick={onRetest} variant="outline" className="h-11 rounded-xl border-white/10 bg-transparent text-white hover:bg-white/5 hover:text-white"><RotateCcw /> Atualizar teste</Button></div>
          </CardContent>
        </Card>
        <Card className="border-[#FFD700]/20 bg-[#FFD700]/[0.07] py-0 shadow-none">
          <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#FFD700] text-black"><BadgeCheck className="size-5" /></span><div><p className="font-black">Assinatura FLEX ativa</p><p className="mt-1 text-sm text-white/45">Próxima renovação em 02 out 2026</p></div></div><Button variant="ghost" className="justify-start text-[#FFD700] hover:bg-[#FFD700]/10 hover:text-[#FFD700]"><Headphones /> Falar com suporte</Button></CardContent>
        </Card>
        <Button onClick={() => void onLogout()} variant="ghost" className="text-white/45 hover:bg-white/5 hover:text-white"><LogOut /> Sair da conta</Button>
      </div>
    </div>
  );
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(mode === "login" ? { email, senha } : { nome, email, senha }),
      });
      const data = await response.json() as { user?: AuthUser; error?: string };
      if (!response.ok || !data.user) {
        setError(data.error ?? "Não foi possível continuar.");
        return;
      }
      onAuthenticated(data.user);
    } catch {
      setError("Não foi possível acessar o servidor. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  function changeMode(nextMode: "login" | "register") {
    setMode(nextMode);
    setError("");
    setSenha("");
  }

  return (
    <main className="grid min-h-screen bg-[#101010] text-white lg:grid-cols-[1fr_1fr]">
      <section className="relative hidden overflow-hidden border-r border-white/8 p-12 lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,215,0,.18),transparent_36%),linear-gradient(145deg,#181818,#0d0d0d)]" />
        <div className="relative"><Brand /></div>
        <div className="relative mt-auto max-w-xl"><p className="text-xs font-black uppercase tracking-[0.22em] text-[#FFD700]">Assessoria sem agenda engessada</p><h1 className="mt-5 text-6xl font-black leading-[.95] tracking-[-0.07em]">Corra no seu ritmo. Evolua com método.</h1><p className="mt-6 max-w-lg text-lg leading-8 text-white/50">Três sessões flexíveis por semana, zonas personalizadas e autonomia para encaixar o treino na vida real.</p></div>
      </section>
      <section className="flex items-center justify-center p-5 sm:p-10">
        <Card className="w-full max-w-md border-white/8 bg-[#191919] py-0 shadow-2xl">
          <CardContent className="p-6 sm:p-8">
            <div className="lg:hidden"><Brand /></div>
            <p className="mt-10 text-xs font-black uppercase tracking-[0.18em] text-[#FFD700] lg:mt-0">{mode === "login" ? "Bem-vindo de volta" : "Comece na FLEX"}</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em]">{mode === "login" ? "Entre para treinar" : "Crie sua conta"}</h2>
            <p className="mt-2 text-sm leading-6 text-white/45">{mode === "login" ? "Use seu e-mail e senha para continuar." : "Informe seus dados para acessar seu plano."}</p>
            <form onSubmit={submit} className="mt-8 space-y-5">
              {mode === "register" && <label className="block text-sm font-bold">Nome<Input type="text" autoComplete="name" required minLength={2} maxLength={80} value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Seu nome completo" className="mt-2 h-12 rounded-xl border-white/10 bg-black/25 px-4" /></label>}
              <label className="block text-sm font-bold">E-mail<Input type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@email.com" className="mt-2 h-12 rounded-xl border-white/10 bg-black/25 px-4" /></label>
              <label className="block text-sm font-bold">Senha<Input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} maxLength={128} value={senha} onChange={(event) => setSenha(event.target.value)} placeholder="Mínimo de 8 caracteres" className="mt-2 h-12 rounded-xl border-white/10 bg-black/25 px-4" /></label>
              {error && <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200" role="alert">{error}</p>}
              <Button type="submit" disabled={submitting} className="h-12 w-full rounded-xl bg-[#FFD700] font-extrabold text-black hover:bg-[#ffe13d]">{submitting ? <><LoaderCircle className="animate-spin" /> Aguarde</> : mode === "login" ? <>Entrar na FLEX <ArrowRight /></> : <>Criar minha conta <UserPlus /></>}</Button>
            </form>
            <button type="button" onClick={() => changeMode(mode === "login" ? "register" : "login")} className="mt-5 w-full text-center text-sm font-semibold text-white/55 transition hover:text-[#FFD700]">{mode === "login" ? "Ainda não tem conta? Cadastre-se" : "Já tem uma conta? Entrar"}</button>
            <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-white/35"><LockKeyhole className="size-3.5" /> Ambiente protegido e acesso individual</p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function LoadingScreen() {
  return <main className="grid min-h-screen place-items-center bg-[#101010] text-white"><div className="flex flex-col items-center"><Brand /><LoaderCircle className="mt-8 size-6 animate-spin text-[#FFD700]" /><p className="mt-3 text-sm text-white/40">Verificando sua sessão</p></div></main>;
}

function Sidebar({ view, goal, onNavigate }: { view: View; goal: Goal; onNavigate: (view: View) => void }) {
  return <aside className="hidden w-[250px] shrink-0 border-r border-white/8 px-5 py-7 lg:flex lg:flex-col"><Brand /><nav className="mt-12 space-y-2" aria-label="Navegação principal">{navItems.map((item) => <NavButton key={item.id} item={item} active={view === item.id} onClick={() => onNavigate(item.id)} />)}</nav><div className="mt-auto rounded-2xl border border-white/8 bg-white/[0.035] p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FFD700]">Plano ativo</p><div className="mt-3 flex items-center justify-between"><p className="text-sm font-bold">Objetivo {goal}</p><Medal className="size-4 text-[#FFD700]" /></div><p className="mt-1 text-xs leading-5 text-white/40">Ciclo de 4 semanas · 3 sessões livres</p></div></aside>;
}

function MobileNav({ view, onNavigate }: { view: View; onNavigate: (view: View) => void }) {
  return <nav className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-around rounded-2xl border border-white/10 bg-[#181818]/95 p-2 shadow-2xl backdrop-blur lg:hidden" aria-label="Navegação móvel">{navItems.slice(0, 4).map((item) => { const Icon = item.icon; const active = item.id === view; return <button key={item.id} onClick={() => onNavigate(item.id)} className={`flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-semibold ${active ? "bg-[#FFD700] text-black" : "text-white/45"}`}><Icon className="size-4" />{item.mobile}</button>; })}</nav>;
}

function MobileDrawer({ view, onNavigate, onClose }: { view: View; onNavigate: (view: View) => void; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden" role="dialog" aria-modal="true" aria-label="Menu"><aside className="flex h-full w-[min(84vw,340px)] flex-col bg-[#171717] p-5 shadow-2xl"><div className="flex items-center justify-between"><Brand /><button onClick={onClose} className="grid size-10 place-items-center rounded-xl border border-white/10" aria-label="Fechar menu"><X className="size-5" /></button></div><nav className="mt-10 space-y-2">{navItems.map((item) => <NavButton key={item.id} item={item} active={view === item.id} onClick={() => onNavigate(item.id)} />)}</nav></aside></div>;
}

function NavButton({ item, active, onClick }: { item: typeof navItems[number]; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${active ? "bg-[#FFD700] text-black" : "text-white/50 hover:bg-white/5 hover:text-white"}`}><Icon className="size-4" />{item.label}</button>;
}

function Brand() { return <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#FFD700] font-black italic text-black">V</span><div><p className="font-black leading-none tracking-[-0.03em]">VIDA ATIVA</p><p className="mt-1 text-[10px] font-black tracking-[0.32em] text-[#FFD700]">FLEX</p></div></div>; }

function PaceSpotlight({ result, onClick }: { result: VdotRow; onClick: () => void }) {
  return <Card className="border-[#FFD700]/30 bg-[#FFD700] py-0 text-black shadow-none"><CardContent className="flex h-full min-h-[330px] flex-col p-6 sm:p-8"><div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] opacity-55">Faixa atual</p><p className="mt-2 text-5xl font-black tracking-[-0.07em]">VDOT {result.vdot}</p></div><Gauge className="size-7" /></div><div className="my-7 h-px bg-black/15" /><p className="text-sm font-bold opacity-60">Rodagem / Base · Z2</p><p className="mt-2 text-4xl font-black tracking-[-0.05em]">{result.zones.Z2}</p><p className="mt-1 text-sm font-bold opacity-60">min/km</p><Button onClick={onClick} className="mt-auto h-11 rounded-xl bg-black font-bold text-white hover:bg-black/85">Abrir régua completa <ArrowRight /></Button></CardContent></Card>;
}

function CompactWorkout({ workout, done, onToggle }: { workout: Workout; done: boolean; onToggle: () => void }) {
  return <Card className={`border-white/8 py-0 shadow-none transition ${done ? "bg-[#FFD700]/[0.06]" : "bg-[#1a1a1a]"}`}><CardContent className="flex items-center gap-4 p-5"><button onClick={onToggle} className={`grid size-11 shrink-0 place-items-center rounded-xl border text-lg ${done ? "border-[#FFD700] bg-[#FFD700] text-black" : "border-white/10 bg-black/20"}`} aria-label={done ? "Marcar como pendente" : "Marcar como concluído"}>{done ? <Check className="size-5" /> : workout.icon}</button><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#FFD700]">Sessão {workout.session} · {workout.zone}</p><p className={`mt-1 truncate font-bold ${done ? "text-white/45 line-through" : ""}`}>{workout.name}</p><p className="mt-1 text-xs text-white/35">{workout.duration}</p></div></CardContent></Card>;
}

function WorkoutCard({ workout, zones, done, onToggle }: { workout: Workout; zones: Record<ZoneKey, string>; done: boolean; onToggle: () => void }) {
  return <Card className={`min-h-[460px] overflow-hidden border-white/8 py-0 shadow-none ${done ? "bg-[#171717] opacity-75" : "bg-[#1a1a1a]"}`}><CardContent className="flex h-full flex-col p-6"><div className="flex items-start justify-between"><span className="text-4xl">{workout.icon}</span><button onClick={onToggle} className={`grid size-10 place-items-center rounded-xl border transition ${done ? "border-[#FFD700] bg-[#FFD700] text-black" : "border-white/10 hover:border-[#FFD700]/60"}`} aria-label={done ? "Marcar treino como pendente" : "Marcar treino como concluído"}>{done ? <Check className="size-5" /> : <span className="size-3 rounded-full border border-white/35" />}</button></div><p className="mt-7 text-xs font-black uppercase tracking-[0.18em] text-[#FFD700]">Sessão {workout.session} · Semana {workout.week}</p><h2 className="mt-3 text-2xl font-black tracking-[-0.04em]">{workout.name}</h2><p className="mt-4 text-sm leading-7 text-white/55"><WorkoutText text={workout.description} zones={zones} /></p><div className="mt-auto pt-8"><div className="h-px bg-white/8" /><div className="mt-5 flex items-center justify-between"><span className="flex items-center gap-2 text-sm text-white/45"><Clock3 className="size-4 text-[#FFD700]" />{workout.duration}</span><span className="rounded-full bg-white/6 px-3 py-1.5 text-xs font-black text-[#FFD700]">ALVO {workout.zone}</span></div></div></CardContent></Card>;
}

function WorkoutText({ text, zones }: { text: string; zones: Record<ZoneKey, string> }) {
  const parts = text.split(/(\{Z[1-7]\})/g);
  return <>{parts.map((part, index) => { const match = part.match(/^\{(Z[1-7])\}$/); return match ? <Fragment key={index}><mark className="rounded bg-[#FFD700]/12 px-1.5 py-0.5 font-bold text-[#FFD700]">{match[1]} · {zones[match[1] as ZoneKey]} min/km</mark></Fragment> : <Fragment key={index}>{part}</Fragment>; })}</>;
}

function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return <label className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">{label}<Input type="number" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-2 h-16 rounded-xl border-white/10 bg-[#121212] px-4 text-center text-2xl font-black text-white" /></label>;
}

function InfoPill({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return <div className="rounded-2xl border border-white/8 bg-black/20 p-4"><Icon className="size-4 text-[#FFD700]" /><p className="mt-3 text-xs text-white/35">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>;
}

function ProfileRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className="flex items-center justify-between gap-4"><span className="text-sm text-white/40">{label}</span><span className={`text-sm font-bold ${accent ? "rounded-full bg-[#FFD700]/10 px-3 py-1 text-[#FFD700]" : ""}`}>{value}</span></div>;
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "VA";
}
