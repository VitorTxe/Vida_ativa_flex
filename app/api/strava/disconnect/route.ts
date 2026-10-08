import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/backend/db";
import { stravaConexoes, treinosRealizados } from "@/backend/db/schema";
import { getCurrentUser } from "@/backend/services/auth.service";
import { getValidStravaAccessToken, revokeStravaAccess } from "@/backend/services/strava.service";

export const dynamic = "force-dynamic";

export async function POST() {
  const identity = await getCurrentUser();
  if (!identity) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });

  const db = getDb();
  let revokedRemotely = false;
  try {
    const accessToken = await getValidStravaAccessToken(identity.idAluno);
    await revokeStravaAccess(accessToken);
    revokedRemotely = true;
  } catch (error: unknown) {
    console.warn("Não foi possível confirmar a revogação remota do Strava; removendo dados locais.", error);
  }

  // Mantemos os treinosRealizados intactos para preservar o histórico e os tempos concluídos pelo aluno
  await db.delete(stravaConexoes).where(eq(stravaConexoes.idAluno, identity.idAluno));

  return NextResponse.json({ disconnected: true, revokedRemotely });
}
