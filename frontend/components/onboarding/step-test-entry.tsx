import React from "react";
import { Award, CheckCircle2, Compass, TimerReset } from "lucide-react";
import { Card, CardContent } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import type { TestInputType } from "@/backend/types";

interface StepTestEntryProps {
  tipoTeste: TestInputType;
  onTipoTeste: (tipo: TestInputType) => void;
  minutosTeste: number;
  onMinutosTeste: (v: number) => void;
  segundosTeste: number;
  onSegundosTeste: (v: number) => void;
  distanciaProva: "5k" | "10k";
  onDistanciaProva: (d: "5k" | "10k") => void;
  minutosProva: number;
  onMinutosProva: (v: number) => void;
  segundosProva: number;
  onSegundosProva: (v: number) => void;
}

export function StepTestEntry({
  tipoTeste,
  onTipoTeste,
  minutosTeste,
  onMinutosTeste,
  segundosTeste,
  onSegundosTeste,
  distanciaProva,
  onDistanciaProva,
  minutosProva,
  onMinutosProva,
  segundosProva,
  onSegundosProva,
}: StepTestEntryProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#FFD700]">Passo 6 de 6</p>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">Teste de Entrada (Motor de Zonas)</h2>
        <p className="mt-1 text-sm text-white/50">
          Para calcularmos suas 7 Zonas Metabólicas (Z1 a Z7), escolha a melhor opção:
        </p>
      </div>

      <div className="grid gap-3">
        {/* Opção A: Teste de 3k */}
        <Card
          onClick={() => onTipoTeste("teste_3k")}
          className={`cursor-pointer border-white/8 py-0 transition-all ${
            tipoTeste === "teste_3k"
              ? "border-[#FFD700] bg-[#FFD700]/[0.08]"
              : "bg-[#181818] hover:border-white/20"
          }`}
        >
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#FFD700]/10 text-[#FFD700]">
                <TimerReset className="size-5" />
              </span>
              <div className="flex-1">
                <p className="font-bold text-sm">Opção A: Tenho tempo recente de Teste de 3 km</p>
                <p className="text-xs text-white/45">Calibração direta de alta precisão nas 7 zonas.</p>
              </div>
            </div>
            {tipoTeste === "teste_3k" && (
              <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-white/8 bg-black/30 p-3">
                <label className="text-xs text-white/40 font-bold uppercase">
                  Minutos
                  <Input
                    type="number"
                    min={9}
                    max={35}
                    value={minutosTeste}
                    onChange={(e) => onMinutosTeste(Number(e.target.value))}
                    className="mt-1 h-12 rounded-xl border-white/10 bg-[#121212] text-center text-xl font-black"
                  />
                </label>
                <label className="text-xs text-white/40 font-bold uppercase">
                  Segundos
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={segundosTeste}
                    onChange={(e) => onSegundosTeste(Number(e.target.value))}
                    className="mt-1 h-12 rounded-xl border-white/10 bg-[#121212] text-center text-xl font-black"
                  />
                </label>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Opção B: Prova Recente */}
        <Card
          onClick={() => onTipoTeste("prova_recente")}
          className={`cursor-pointer border-white/8 py-0 transition-all ${
            tipoTeste === "prova_recente"
              ? "border-[#FFD700] bg-[#FFD700]/[0.08]"
              : "bg-[#181818] hover:border-white/20"
          }`}
        >
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#FFD700]/10 text-[#FFD700]">
                <Award className="size-5" />
              </span>
              <div className="flex-1">
                <p className="font-bold text-sm">Opção B: Tenho tempo de prova recente (5k ou 10k)</p>
                <p className="text-xs text-white/45">O app converte seu tempo para o VDOT equivalente.</p>
              </div>
            </div>
            {tipoTeste === "prova_recente" && (
              <div className="mt-4 space-y-3 rounded-xl border border-white/8 bg-black/30 p-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDistanciaProva("5k");
                    }}
                    className={`h-9 rounded-lg font-bold text-xs ${
                      distanciaProva === "5k" ? "bg-[#FFD700] text-black" : "bg-white/5 text-white/60"
                    }`}
                  >
                    Prova 5 km
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDistanciaProva("10k");
                    }}
                    className={`h-9 rounded-lg font-bold text-xs ${
                      distanciaProva === "10k" ? "bg-[#FFD700] text-black" : "bg-white/5 text-white/60"
                    }`}
                  >
                    Prova 10 km
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs text-white/40 font-bold uppercase">
                    Minutos
                    <Input
                      type="number"
                      min={14}
                      max={90}
                      value={minutosProva}
                      onChange={(e) => onMinutosProva(Number(e.target.value))}
                      className="mt-1 h-12 rounded-xl border-white/10 bg-[#121212] text-center text-xl font-black"
                    />
                  </label>
                  <label className="text-xs text-white/40 font-bold uppercase">
                    Segundos
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={segundosProva}
                      onChange={(e) => onSegundosProva(Number(e.target.value))}
                      className="mt-1 h-12 rounded-xl border-white/10 bg-[#121212] text-center text-xl font-black"
                    />
                  </label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Opção C: Sem teste */}
        <Card
          onClick={() => onTipoTeste("sem_teste")}
          className={`cursor-pointer border-white/8 py-0 transition-all ${
            tipoTeste === "sem_teste"
              ? "border-[#FFD700] bg-[#FFD700]/[0.08]"
              : "bg-[#181818] hover:border-white/20"
          }`}
        >
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#FFD700]/10 text-[#FFD700]">
                <Compass className="size-5" />
              </span>
              <div className="flex-1">
                <p className="font-bold text-sm">Opção C: Ainda não fiz o teste</p>
                <p className="mt-1 text-xs leading-5 text-white/45">
                  Sem problemas! A IA programará o <strong>Protocolo do Teste de 3 km</strong> logo na sua 1ª sessão de treino no app.
                </p>
              </div>
              {tipoTeste === "sem_teste" && <CheckCircle2 className="size-5 text-[#FFD700] shrink-0" />}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
