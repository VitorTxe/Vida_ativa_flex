import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/backend/db";
import { stravaConexoes, treinosRealizados } from "@/backend/db/schema";

export const dynamic = "force-dynamic";

interface StravaWebhookEvent {
  object_type?: "activity" | "athlete";
  object_id?: number | string;
  aspect_type?: "create" | "update" | "delete";
  owner_id?: number | string;
  subscription_id?: number | string;
  updates?: Record<string, string>;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const challenge = url.searchParams.get("hub.challenge");
  const token = url.searchParams.get("hub.verify_token");
  const expectedToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && challenge && expectedToken && token === expectedToken) {
    return NextResponse.json({ "hub.challenge": challenge });
  }
  return NextResponse.json({ error: "Webhook não autorizado." }, { status: 403 });
}

export async function POST(request: Request) {
  const event = (await request.json().catch(() => null)) as StravaWebhookEvent | null;
  const expectedSubscription = process.env.STRAVA_WEBHOOK_SUBSCRIPTION_ID?.trim();

  if (!event) return NextResponse.json({ received: true });
  if (!expectedSubscription || String(event.subscription_id) !== expectedSubscription) {
    console.warn("Evento do Strava ignorado: subscription_id não configurado ou divergente.");
    return NextResponse.json({ received: true });
  }

  const db = getDb();
  const athleteId = String(event.owner_id ?? event.object_id ?? "");
  const [connection] = await db.select({ idAluno: stravaConexoes.idAluno })
    .from(stravaConexoes)
    .where(eq(stravaConexoes.athleteId, athleteId))
    .limit(1);
  if (!connection) return NextResponse.json({ received: true });

  const deauthorized = event.object_type === "athlete" && event.updates?.authorized === "false";
  if (deauthorized) {
    await db.delete(treinosRealizados).where(and(
      eq(treinosRealizados.idAluno, connection.idAluno),
      eq(treinosRealizados.origem, "strava")
    ));
    await db.delete(stravaConexoes).where(eq(stravaConexoes.idAluno, connection.idAluno));
  }

  const activityRemoved = event.object_type === "activity"
    && (event.aspect_type === "delete" || event.updates?.private === "true");
  if (activityRemoved && event.object_id) {
    await db.delete(treinosRealizados).where(and(
      eq(treinosRealizados.idAluno, connection.idAluno),
      eq(treinosRealizados.stravaActivityId, String(event.object_id))
    ));
  }

  return NextResponse.json({ received: true });
}
