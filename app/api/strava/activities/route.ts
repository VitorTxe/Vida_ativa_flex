import { NextResponse } from "next/server";
import { getCurrentUser } from "@/backend/services/auth.service";
import {
  calculatePace,
  listStravaActivities,
  StravaApiError,
  StravaConfigurationError,
  StravaNotConnectedError,
} from "@/backend/services/strava.service";

export const dynamic = "force-dynamic";

const RUNNING_SPORTS = new Set(["Run", "TrailRun", "VirtualRun"]);

export async function GET(request: Request) {
  const identity = await getCurrentUser();
  if (!identity) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });

  try {
    const url = new URL(request.url);
    const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 90, 7), 365);
    const after = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);
    const activities = await listStravaActivities(identity.idAluno, { after, perPage: 50 });
    const runs = activities
      .filter((activity) => RUNNING_SPORTS.has(activity.sport_type || activity.type || ""))
      .map((activity) => ({
        id: String(activity.id),
        name: activity.name,
        sportType: activity.sport_type || activity.type || "Run",
        distanceMeters: activity.distance,
        movingTime: activity.moving_time,
        elapsedTime: activity.elapsed_time,
        averageSpeed: activity.average_speed ?? null,
        paceAverage: calculatePace(activity.moving_time, activity.distance),
        startDate: activity.start_date,
        startDateLocal: activity.start_date_local,
        trainer: Boolean(activity.trainer),
        url: `https://www.strava.com/activities/${String(activity.id)}`,
      }));
    return NextResponse.json({ activities: runs });
  } catch (error: unknown) {
    console.error("Erro ao listar atividades do Strava:", error);
    if (error instanceof StravaNotConnectedError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof StravaApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof StravaConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Falha ao consultar suas atividades no Strava." }, { status: 500 });
  }
}
