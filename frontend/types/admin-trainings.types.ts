import type { GeneratedTrainingPlan } from "@/backend/types";
import type { StudentTrainingDetail } from "./messages.types";

export interface AdminTrainingsData {
  trainings: StudentTrainingDetail[];
  plan: GeneratedTrainingPlan | null;
  planJson: string | null;
}

export interface SessionFormData {
  titulo: string;
  tipo: string;
  duracaoMinutos: number;
  intensidade: string;
  descricao: string;
  diaSugerido?: string;
  terrenoSugerido?: string;
}

export type AdminTrainingActionPayload =
  | {
      action: "update_session";
      week: number;
      session: number;
      sessionData: SessionFormData;
    }
  | {
      action: "add_session";
      week: number;
      sessionData: SessionFormData;
    }
  | {
      action: "update_week_focus";
      week: number;
      foco: string;
    }
  | {
      action: "initialize_plan";
    };
