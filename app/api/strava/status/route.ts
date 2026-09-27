import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/backend/db";
import { stravaConexoes } from "@/backend/db/schema";
import { getCurrentUser } from "@/backend/services/auth.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const identity = await getCurrentUser();
  if (!identity) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });

  const [connection] = await getDb().select({
    athleteId: stravaConexoes.athleteId,
    athleteName: stravaConexoes.athleteName,
    scopes: stravaConexoes.scopes,
    conectadoEm: stravaConexoes.conectadoEm,
  }).from(stravaConexoes).where(eq(stravaConexoes.idAluno, identity.idAluno)).limit(1);

  return NextResponse.json({
    connected: Boolean(connection),
    athlete: connection ? {
      id: connection.athleteId,
      name: connection.athleteName,
    } : null,
    scopes: connection?.scopes.split(/[\s,]+/).filter(Boolean) ?? [],
    connectedAt: connection?.conectadoEm ?? null,
  });
}
