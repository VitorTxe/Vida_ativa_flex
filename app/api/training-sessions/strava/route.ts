import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/backend/db";
import { treinosRealizados } from "@/backend/db/schema";
import { getCurrentUser } from "@/backend/services/auth.service";
import {
  calculatePace,
  getStravaActivity,
  StravaApiError,
  StravaConfigurationError,
  StravaNotConnectedError,
} from "@/backend/services/strava.service";
import { getPlanGeneratedAt, serializeTrainingCompletion } from "@/backend/services/training-completion.service";

export const dynamic = "force-dynamic";

const linkSchema = z.object({
  week: z.number().int().min(1).max(52),
  session: z.number().int().min(1).max(20),
  activityId: z.string().regex(/^\d+$/, "Atividade do Strava inválida."),
}).strict();

const RUNNING_SPORTS = new Set(["Run", "TrailRun", "VirtualRun"]);

export async function POST(request: Request) {
  const identity = await getCurrentUser();
  if (!identity) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });

  const parsed = linkSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  try {
    const db = getDb();
    const planGeneratedAt = await getPlanGeneratedAt(identity.idAluno);
    if (!planGeneratedAt) return NextResponse.json({ error: "Nenhum plano ativo encontrado." }, { status: 409 });

    const [alreadyLinked] = await db.select({
      planGeneratedAt: treinosRealizados.planoGeradoEm,
      week: treinosRealizados.semana,
      session: treinosRealizados.sessao,
    }).from(treinosRealizados).where(and(
      eq(treinosRealizados.idAluno, identity.idAluno),
      eq(treinosRealizados.stravaActivityId, parsed.data.activityId)
    )).limit(1);
    if (alreadyLinked && (
      alreadyLinked.planGeneratedAt !== planGeneratedAt
      || alreadyLinked.week !== parsed.data.week
      || alreadyLinked.session !== parsed.data.session
    )) {
      return NextResponse.json({ error: "Essa atividade já está vinculada a outro treino." }, { status: 409 });
    }

    const activity = await getStravaActivity(identity.idAluno, parsed.data.activityId);
    const sportType = activity.sport_type || activity.type || "";
    if (!RUNNING_SPORTS.has(sportType)) {
      return NextResponse.json({ error: "Escolha uma atividade de corrida do Strava." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const values = {
      id: crypto.randomUUID(),
      idAluno: identity.idAluno,
      planoGeradoEm: planGeneratedAt,
      semana: parsed.data.week,
      sessao: parsed.data.session,
      origem: "strava" as const,
      stravaActivityId: String(activity.id),
      nomeAtividade: activity.name,
      sportType,
      inicioEm: activity.start_date,
      movingTime: activity.moving_time,
      elapsedTime: activity.elapsed_time,
      distanciaMetros: activity.distance,
      velocidadeMedia: activity.average_speed ?? null,
      paceMedio: calculatePace(activity.moving_time, activity.distance),
      concluidoEm: now,
      criadoEm: now,
    };
    await db.insert(treinosRealizados).values(values).onConflictDoUpdate({
      target: [
        treinosRealizados.idAluno,
        treinosRealizados.planoGeradoEm,
        treinosRealizados.semana,
        treinosRealizados.sessao,
      ],
      set: {
        origem: values.origem,
        stravaActivityId: values.stravaActivityId,
        nomeAtividade: values.nomeAtividade,
        sportType: values.sportType,
        inicioEm: values.inicioEm,
        movingTime: values.movingTime,
        elapsedTime: values.elapsedTime,
        distanciaMetros: values.distanciaMetros,
        velocidadeMedia: values.velocidadeMedia,
        paceMedio: values.paceMedio,
        concluidoEm: values.concluidoEm,
      },
    });

    const [completion] = await db.select().from(treinosRealizados).where(and(
      eq(treinosRealizados.idAluno, identity.idAluno),
      eq(treinosRealizados.planoGeradoEm, planGeneratedAt),
      eq(treinosRealizados.semana, parsed.data.week),
      eq(treinosRealizados.sessao, parsed.data.session)
    )).limit(1);
    return NextResponse.json({ completion: serializeTrainingCompletion(completion) }, { status: 201 });
  } catch (error: unknown) {
    console.error("Erro ao vincular atividade do Strava:", error);
    if (error instanceof StravaNotConnectedError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof StravaApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof StravaConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Falha ao vincular a atividade ao treino." }, { status: 500 });
  }
}
