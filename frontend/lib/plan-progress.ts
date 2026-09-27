import type { GeneratedTrainingPlan } from "@/backend/types";
import type { Workout } from "@/frontend/lib/fitness-data";
import type { TrainingCompletion } from "@/frontend/types";

export interface WeekProgress {
  week: number;
  totalSessions: number;
  completedSessions: number;
  isCompleted: boolean;
}

export interface PlanCycleProgress {
  totalWeeks: number;
  weeksStatus: WeekProgress[];
  completedWeeksCount: number;
  isCycleCompleted: boolean;
  totalCompletedSessions: number;
  totalSessions: number;
  percent: number;
}

/**
 * Calcula o progresso do ciclo de treinos de 4 semanas.
 * Considera uma semana concluída apenas se todas as sessões daquela semana foram completadas.
 */
export function getPlanCycleProgress(
  trainingPlan: GeneratedTrainingPlan | null,
  workouts: Workout[],
  completions: TrainingCompletion[]
): PlanCycleProgress {
  const totalWeeks = 4;
  const weeksStatus: WeekProgress[] = [];

  for (let w = 1; w <= totalWeeks; w++) {
    let weekSessions: number[] = [];

    if (trainingPlan?.semanas) {
      const foundWeek = trainingPlan.semanas.find((item) => item.semana === w);
      if (foundWeek && foundWeek.sessoes.length > 0) {
        weekSessions = foundWeek.sessoes.map((s) => s.sessao);
      } else {
        weekSessions = [1, 2, 3];
      }
    } else {
      const weekWorkouts = workouts.filter((item) => item.week === w);
      if (weekWorkouts.length > 0) {
        weekSessions = weekWorkouts.map((item) => item.session);
      } else {
        weekSessions = [1, 2, 3];
      }
    }

    const totalSessions = weekSessions.length;
    const completedSessions = weekSessions.filter((sessaoNum) =>
      completions.some((c) => c.week === w && c.session === sessaoNum)
    ).length;

    const isCompleted = totalSessions > 0 && completedSessions === totalSessions;

    weeksStatus.push({
      week: w,
      totalSessions,
      completedSessions,
      isCompleted,
    });
  }

  const completedWeeksCount = weeksStatus.filter((w) => w.isCompleted).length;
  const isCycleCompleted = completedWeeksCount >= totalWeeks;
  const totalCompletedSessions = weeksStatus.reduce((acc, curr) => acc + curr.completedSessions, 0);
  const totalSessions = weeksStatus.reduce((acc, curr) => acc + curr.totalSessions, 0);
  const percent = totalSessions > 0 ? Math.round((totalCompletedSessions / totalSessions) * 100) : 0;

  return {
    totalWeeks,
    weeksStatus,
    completedWeeksCount,
    isCycleCompleted,
    totalCompletedSessions,
    totalSessions,
    percent,
  };
}
