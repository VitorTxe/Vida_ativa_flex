import React from "react";
import { ArrowLeft, ArrowRight, BrainCircuit, LoaderCircle, LogOut } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent } from "@/frontend/components/ui/card";
import type { GeneratedTrainingPlan, RunningProfile } from "@/backend/types";
import { useOnboardingForm } from "@/frontend/hooks/use-onboarding-form";
import { Brand } from "@/frontend/components/ui/brand-logo";
import { StepExperience } from "./step-experience";
import { StepObjective } from "./step-objective";
import { StepFrequency } from "./step-frequency";
import { StepRoutineDays } from "./step-routine-days";
import { StepTerrain } from "./step-terrain";
import { StepTestEntry } from "./step-test-entry";

interface OnboardingContainerProps {
  nome: string;
  initialProfile: RunningProfile | null;
  onComplete: (plan: GeneratedTrainingPlan) => void;
  onLogout: () => void | Promise<void>;
}

export function OnboardingContainer({
  nome,
  initialProfile,
  onComplete,
  onLogout,
}: OnboardingContainerProps): React.JSX.Element {
  const form = useOnboardingForm(initialProfile, onComplete);

  const firstName = nome.trim().split(/\s+/)[0] || "atleta";
  const progressPercent = Math.round((form.step / 6) * 100);

  return (
    <main className="min-h-screen bg-[#101010] px-4 py-6 text-white sm:px-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between gap-4">
          <Brand />
          <Button
            type="button"
            onClick={() => void onLogout()}
            variant="ghost"
            className="text-white/45 hover:bg-white/5 hover:text-white text-xs"
          >
            <LogOut className="size-4" /> Sair
          </Button>
        </header>

        {/* Barra de Progresso */}
        <div className="mt-8">
          <div className="flex items-center justify-between text-xs font-bold text-white/40">
            <span>Olá, {firstName}! Personalizando seu método</span>
            <span className="text-[#FFD700]">{form.step} de 6 ({progressPercent}%)</span>
          </div>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#FFD700] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Card Central com a Etapa Atual */}
        <Card className="mt-6 border-white/8 bg-[#191919] py-0 shadow-2xl">
          <CardContent className="p-6 sm:p-8">
            {form.step === 1 && (
              <StepExperience
                value={form.nivelExperiencia}
                onChange={form.setNivelExperiencia}
                idade={form.idade}
                onIdade={form.setIdade}
                pesoKg={form.pesoKg}
                onPeso={form.setPesoKg}
                alturaCm={form.alturaCm}
                onAltura={form.setAlturaCm}
              />
            )}
            {form.step === 2 && (
              <StepObjective
                value={form.focoPrincipal}
                onChange={form.setFocoPrincipal}
                distancia={form.distanciaAlvo}
                onDistancia={form.setDistanciaAlvo}
              />
            )}
            {form.step === 3 && (
              <StepFrequency
                value={form.treinosPorSemana}
                onChange={form.setTreinosPorSemana}
              />
            )}
            {form.step === 4 && (
              <StepRoutineDays
                selectedDays={form.diasPreferenciais}
                onToggleDay={form.toggleDay}
              />
            )}
            {form.step === 5 && (
              <StepTerrain
                value={form.terrenoPrincipal}
                onChange={form.setTerrenoPrincipal}
              />
            )}
            {form.step === 6 && (
              <StepTestEntry
                tipoTeste={form.tipoTeste}
                onTipoTeste={form.setTipoTeste}
                minutosTeste={form.minutosTeste}
                onMinutosTeste={form.setMinutosTeste}
                segundosTeste={form.segundosTeste}
                onSegundosTeste={form.setSegundosTeste}
                distanciaProva={form.distanciaProva}
                onDistanciaProva={form.setDistanciaProva}
                minutosProva={form.minutosProva}
                onMinutosProva={form.setMinutosProva}
                segundosProva={form.segundosProva}
                onSegundosProva={form.setSegundosProva}
              />
            )}

            {form.error && (
              <p className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100" role="alert">
                {form.error}
              </p>
            )}

            {/* Ações de Navegação */}
            <div className="mt-8 flex items-center justify-between gap-3 border-t border-white/8 pt-6">
              {form.step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={form.prevStep}
                  disabled={form.submitting}
                  className="h-12 rounded-xl border-white/10 bg-transparent text-white hover:bg-white/5"
                >
                  <ArrowLeft /> Voltar
                </Button>
              ) : (
                <div />
              )}

              {form.step < 6 ? (
                <Button
                  type="button"
                  onClick={form.nextStep}
                  className="h-12 rounded-xl bg-[#FFD700] px-6 font-extrabold text-black hover:bg-[#ffe13d]"
                >
                  Avançar <ArrowRight />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => void form.submit()}
                  disabled={form.submitting}
                  className="h-12 rounded-xl bg-[#FFD700] px-6 font-extrabold text-black hover:bg-[#ffe13d]"
                >
                  {form.submitting ? (
                    <>
                      <LoaderCircle className="animate-spin" /> Montando seu plano...
                    </>
                  ) : (
                    <>
                      <BrainCircuit /> Criar meu treino
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
