import React from "react";
import { Activity, BadgeCheck, Headphones, LoaderCircle, LogOut, RotateCcw, Unplug } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import type { Goal, VdotRow } from "@/frontend/lib/fitness-data";
import type { AuthUser } from "@/frontend/types/dashboard.types";
import type { StravaConnectionStatus } from "@/frontend/types";
import { initials } from "./dashboard-nav-items";
import { StravaConnectButton } from "./strava-connect-button";

interface ProfileViewProps {
  user: AuthUser;
  goal: Goal;
  result: VdotRow;
  onGoal: (goal: Goal) => void;
  onRetest: () => void;
  onLogout: () => void | Promise<void>;
  stravaStatus: StravaConnectionStatus;
  stravaBusy: boolean;
  onConnectStrava: () => void;
  onDisconnectStrava: () => void | Promise<void>;
  onOpenSupport?: () => void;
  onOpenAdmin?: () => void;
}

export function ProfileView({
  user,
  goal,
  result,
  onGoal,
  onRetest,
  onLogout,
  stravaStatus,
  stravaBusy,
  onConnectStrava,
  onDisconnectStrava,
  onOpenSupport,
  onOpenAdmin,
}: ProfileViewProps): React.JSX.Element {
  return (
    <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
      <Card className="border-white/8 bg-[#1a1a1a] py-0 shadow-none">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <span className="grid size-16 place-items-center rounded-2xl bg-[#FFD700] text-xl font-black text-black">
              {initials(user.nome)}
            </span>
            <div>
              <h2 className="text-xl font-black">{user.nome}</h2>
              <p className="mt-1 text-sm text-white/45">{user.email}</p>
            </div>
          </div>
          <div className="my-7 h-px bg-white/8" />
          <div className="space-y-4">
            <ProfileRow label="ID do aluno" value={user.idAluno.slice(0, 8).toUpperCase()} />
            <ProfileRow label="Status" value={user.statusPagamento} accent />
            <ProfileRow label="VDOT atual" value={String(result.vdot)} />
            <ProfileRow label="Último teste" value="02 set 2026" />
          </div>
        </CardContent>
      </Card>
      <div className="space-y-5">
        <Card className="border-white/8 bg-[#1a1a1a] py-0 shadow-none">
          <CardHeader className="p-6 pb-0">
            <CardTitle className="text-lg font-black">Preferências de treino</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="font-bold">Distância alvo</p>
                <p className="mt-1 text-sm text-white/40">Adapta o volume e o longão do ciclo.</p>
              </div>
              <Select value={goal} onValueChange={(value) => onGoal(value as Goal)}>
                <SelectTrigger className="h-11 w-full rounded-xl border-white/10 bg-black/25 sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5k">5 km</SelectItem>
                  <SelectItem value="10k">10 km</SelectItem>
                  <SelectItem value="21k">21 km</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="h-px bg-white/8" />
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="font-bold">Teste de 3 km</p>
                <p className="mt-1 text-sm text-white/40">Atualize suas zonas sempre que evoluir.</p>
              </div>
              <Button
                onClick={onRetest}
                variant="outline"
                className="h-11 rounded-xl border-white/10 bg-transparent text-white hover:bg-white/5 hover:text-white"
              >
                <RotateCcw /> Atualizar teste
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="border-strava-border bg-strava-muted py-0 shadow-none">
          <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-strava text-strava-foreground shadow-sm shadow-strava/30">
                <Activity className="size-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-black text-foreground">{stravaStatus.connected ? "Strava conectado" : "Conecte seu Strava"}</p>
                  {stravaStatus.connected && (
                    <span className="rounded-full bg-strava/20 px-2 py-0.5 text-[10px] font-bold text-strava">
                      Ativo
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stravaStatus.connected
                    ? `${stravaStatus.athlete?.name || "Atleta"} · corridas sincronizadas com seus treinos.`
                    : "Associe tempo, distância e pace real das suas atividades."}
                </p>
              </div>
            </div>
            {stravaStatus.connected ? (
              <Button
                onClick={() => void onDisconnectStrava()}
                disabled={stravaBusy}
                variant="ghost"
                className="justify-start text-muted-foreground hover:bg-white/5 hover:text-foreground"
              >
                {stravaBusy ? <LoaderCircle className="animate-spin" /> : <Unplug />} Desconectar
              </Button>
            ) : (
              <StravaConnectButton onClick={onConnectStrava} />
            )}
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5 py-0 shadow-none">
          <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
                <BadgeCheck className="size-5" />
              </span>
              <div>
                <p className="font-black text-foreground">Assinatura FLEX ativa</p>
                <p className="mt-1 text-sm text-muted-foreground">Próxima renovação em 02 out 2026</p>
              </div>
            </div>
            <Button
              onClick={onOpenSupport}
              variant="ghost"
              className="justify-start text-primary hover:bg-primary/10 hover:text-primary"
            >
              <Headphones /> Falar com treinador / suporte
            </Button>
          </CardContent>
        </Card>
        {onOpenAdmin && user.role === "professor" && (
          <Button
            onClick={onOpenAdmin}
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/10"
          >
            Acessar Painel do Treinador (Admin)
          </Button>
        )}
        <Button onClick={() => void onLogout()} variant="ghost" className="text-white/45 hover:bg-white/5 hover:text-white">
          <LogOut /> Sair da conta
        </Button>
      </div>
    </div>
  );
}

function ProfileRow({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-white/40">{label}</span>
      <span className={`text-sm font-bold ${accent ? "rounded-full bg-[#FFD700]/10 px-3 py-1 text-[#FFD700]" : ""}`}>
        {value}
      </span>
    </div>
  );
}
