import { eq } from "drizzle-orm";
import { getDb } from "@/backend/db";
import { planosIa, treinosRealizados } from "@/backend/db/schema";

export async function getPlanGeneratedAt(idAluno: string): Promise<string | null> {
  const [plan] = await getDb().select({ generatedAt: planosIa.geradoEm })
    .from(planosIa)
    .where(eq(planosIa.idAluno, idAluno))
    .limit(1);
  return plan?.generatedAt ?? null;
}

export function serializeTrainingCompletion(row: typeof treinosRealizados.$inferSelect) {
  return {
    id: row.id,
    week: row.semana,
    session: row.sessao,
    source: row.origem,
    stravaActivityId: row.stravaActivityId,
    activityName: row.nomeAtividade,
    sportType: row.sportType,
    startDate: row.inicioEm,
    movingTime: row.movingTime,
    elapsedTime: row.elapsedTime,
    distanceMeters: row.distanciaMetros,
    averageSpeed: row.velocidadeMedia,
    paceAverage: row.paceMedio,
    completedAt: row.concluidoEm,
    stravaUrl: row.stravaActivityId ? `https://www.strava.com/activities/${row.stravaActivityId}` : null,
  };
}
