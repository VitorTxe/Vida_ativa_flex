import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/backend/db";
import { treinosRealizados } from "@/backend/db/schema";
import { getCurrentUser } from "@/backend/services/auth.service";
import { getPlanGeneratedAt, serializeTrainingCompletion } from "@/backend/services/training-completion.service";

export const dynamic = "force-dynamic";

const sessionSchema = z.object({
  week: z.number().int().min(1).max(52),
  session: z.number().int().min(1).max(20),
}).strict();

export async function GET() {
  const identity = await getCurrentUser();
  if (!identity) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });

  const db = getDb();
  const planGeneratedAt = await getPlanGeneratedAt(identity.idAluno);
  if (!planGeneratedAt) return NextResponse.json({ completions: [] });

  const rows = await db.select().from(treinosRealizados).where(and(
    eq(treinosRealizados.idAluno, identity.idAluno),
    eq(treinosRealizados.planoGeradoEm, planGeneratedAt)
  ));
  return NextResponse.json({ completions: rows.map(serializeTrainingCompletion) });
}

export async function POST(request: Request) {
  const identity = await getCurrentUser();
  if (!identity) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });

  const parsed = sessionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Sessão de treino inválida." }, { status: 400 });

  const db = getDb();
  const planGeneratedAt = await getPlanGeneratedAt(identity.idAluno);
  if (!planGeneratedAt) return NextResponse.json({ error: "Nenhum plano ativo encontrado." }, { status: 409 });

  const now = new Date().toISOString();
  const values = {
    id: crypto.randomUUID(),
    idAluno: identity.idAluno,
    planoGeradoEm: planGeneratedAt,
    semana: parsed.data.week,
    sessao: parsed.data.session,
    origem: "manual" as const,
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
      origem: "manual",
      stravaActivityId: null,
      nomeAtividade: null,
      sportType: null,
      inicioEm: null,
      movingTime: null,
      elapsedTime: null,
      distanciaMetros: null,
      velocidadeMedia: null,
      paceMedio: null,
      concluidoEm: now,
    },
  });

  const [completion] = await db.select().from(treinosRealizados).where(and(
    eq(treinosRealizados.idAluno, identity.idAluno),
    eq(treinosRealizados.planoGeradoEm, planGeneratedAt),
    eq(treinosRealizados.semana, parsed.data.week),
    eq(treinosRealizados.sessao, parsed.data.session)
  )).limit(1);
  return NextResponse.json({ completion: serializeTrainingCompletion(completion) }, { status: 201 });
}

export async function DELETE(request: Request) {
  const identity = await getCurrentUser();
  if (!identity) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });

  const url = new URL(request.url);
  const parsed = sessionSchema.safeParse({
    week: Number(url.searchParams.get("week")),
    session: Number(url.searchParams.get("session")),
  });
  if (!parsed.success) return NextResponse.json({ error: "Sessão de treino inválida." }, { status: 400 });

  const db = getDb();
  const planGeneratedAt = await getPlanGeneratedAt(identity.idAluno);
  if (planGeneratedAt) {
    await db.delete(treinosRealizados).where(and(
      eq(treinosRealizados.idAluno, identity.idAluno),
      eq(treinosRealizados.planoGeradoEm, planGeneratedAt),
      eq(treinosRealizados.semana, parsed.data.week),
      eq(treinosRealizados.sessao, parsed.data.session)
    ));
  }
  return NextResponse.json({ deleted: true });
}
