import { useState } from "react";
import type {
  CycleFocus,
  GeneratedTrainingPlan,
  RunningLevel,
  RunningProfile,
  TargetDistance,
  TerrainPreference,
  TestInputType,
  Weekday,
} from "@/backend/types";

export interface OnboardingFormState {
  step: number;
  idade: number;
  pesoKg: number;
  alturaCm: number;
  nivelExperiencia: RunningLevel;
  focoPrincipal: CycleFocus;
  distanciaAlvo: TargetDistance;
  treinosPorSemana: 2 | 3 | 4;
  diasPreferenciais: Weekday[];
  terrenoPrincipal: TerrainPreference;
  tipoTeste: TestInputType;
  minutosTeste: number;
  segundosTeste: number;
  distanciaProva: "5k" | "10k";
  minutosProva: number;
  segundosProva: number;
  submitting: boolean;
  error: string;
}

export function useOnboardingForm(
  initialProfile: RunningProfile | null,
  onComplete: (plan: GeneratedTrainingPlan) => void
) {
  const [step, setStep] = useState(1);
  const [idade, setIdade] = useState(initialProfile?.idade ?? 30);
  const [pesoKg, setPesoKg] = useState(initialProfile?.pesoKg ?? 70);
  const [alturaCm, setAlturaCm] = useState(initialProfile?.alturaCm ?? 170);
  const [nivelExperiencia, setNivelExperiencia] = useState<RunningLevel>(
    initialProfile?.nivelExperiencia ?? "iniciante"
  );
  const [focoPrincipal, setFocoPrincipal] = useState<CycleFocus>(
    initialProfile?.focoPrincipal ?? "condicionamento"
  );
  const [distanciaAlvo, setDistanciaAlvo] = useState<TargetDistance>(
    initialProfile?.distanciaAlvo ?? "10k"
  );
  const [treinosPorSemana, setTreinosPorSemana] = useState<2 | 3 | 4>(
    initialProfile?.treinosPorSemana ?? 3
  );
  const [diasPreferenciais, setDiasPreferenciais] = useState<Weekday[]>(
    initialProfile?.diasPreferenciais ?? ["ter", "qui", "sab"]
  );
  const [terrenoPrincipal, setTerrenoPrincipal] = useState<TerrainPreference>(
    initialProfile?.terrenoPrincipal ?? "rua"
  );
  const [tipoTeste, setTipoTeste] = useState<TestInputType>(
    initialProfile?.tipoTeste ?? "sem_teste"
  );
  const [minutosTeste, setMinutosTeste] = useState(14);
  const [segundosTeste, setSegundosTeste] = useState(30);
  const [distanciaProva, setDistanciaProva] = useState<"5k" | "10k">("5k");
  const [minutosProva, setMinutosProva] = useState(27);
  const [segundosProva, setSegundosProva] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function toggleDay(day: Weekday) {
    setDiasPreferenciais((prev) => {
      if (prev.includes(day)) {
        if (prev.length <= 1) return prev;
        return prev.filter((d) => d !== day);
      }
      return [...prev, day];
    });
  }

  function nextStep() {
    setError("");
    if (step < 6) {
      setStep((prev) => prev + 1);
    }
  }

  function prevStep() {
    setError("");
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        idade,
        pesoKg,
        alturaCm,
        nivelExperiencia,
        focoPrincipal,
        distanciaAlvo: focoPrincipal === "condicionamento" ? null : distanciaAlvo,
        treinosPorSemana,
        diasPreferenciais,
        terrenoPrincipal,
        tipoTeste,
        minutosTeste: tipoTeste === "teste_3k" ? minutosTeste : null,
        segundosTeste: tipoTeste === "teste_3k" ? segundosTeste : null,
        distanciaProva: tipoTeste === "prova_recente" ? distanciaProva : null,
        minutosProva: tipoTeste === "prova_recente" ? minutosProva : null,
        segundosProva: tipoTeste === "prova_recente" ? segundosProva : null,
      };

      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as {
        plan?: GeneratedTrainingPlan;
        error?: string;
      } | null;

      if (!response.ok || !data?.plan) {
        setError(data?.error ?? "Não foi possível gerar seu treino. Tente novamente.");
        return;
      }

      onComplete(data.plan);
    } catch (err: unknown) {
      console.error("Erro no onboarding:", err);
      setError("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return {
    step,
    setStep,
    nextStep,
    prevStep,
    idade,
    setIdade,
    pesoKg,
    setPesoKg,
    alturaCm,
    setAlturaCm,
    nivelExperiencia,
    setNivelExperiencia,
    focoPrincipal,
    setFocoPrincipal,
    distanciaAlvo,
    setDistanciaAlvo,
    treinosPorSemana,
    setTreinosPorSemana,
    diasPreferenciais,
    toggleDay,
    terrenoPrincipal,
    setTerrenoPrincipal,
    tipoTeste,
    setTipoTeste,
    minutosTeste,
    setMinutosTeste,
    segundosTeste,
    setSegundosTeste,
    distanciaProva,
    setDistanciaProva,
    minutosProva,
    setMinutosProva,
    segundosProva,
    setSegundosProva,
    submitting,
    error,
    submit,
  };
}
