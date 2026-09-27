import { and, eq, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/backend/db";
import { matrizVdot, treinosBlocos, usuarios } from "@/backend/db/schema";
import { getCurrentUser } from "@/backend/services/auth.service";
import { getWorkouts, VDOT_ROWS, type Goal } from "@/lib/fitness-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const identity = await getCurrentUser();
  if (!identity) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });

  const db = getDb();
  await ensureReferenceData(db);
  const [profile] = await db.select({
    idAluno: usuarios.idAluno,
    nome: usuarios.nome,
    email: usuarios.email,
    statusPagamento: usuarios.statusPagamento,
    objetivo: usuarios.objetivo,
    minutosTeste: usuarios.minutosTeste,
    segundosTeste: usuarios.segundosTeste,
    totalSegundos: usuarios.totalSegundos,
    dataUltimoTeste: usuarios.dataUltimoTeste,
  }).from(usuarios).where(eq(usuarios.idAluno, identity.idAluno)).limit(1);
  if (!profile) return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });

  const zones = profile.totalSegundos
    ? (await db.select().from(matrizVdot).where(and(
        lte(matrizVdot.segundosMin, profile.totalSegundos),
        gte(matrizVdot.segundosMax, profile.totalSegundos),
      )).limit(1))[0] ?? null
    : null;

  return NextResponse.json({ profile, zones });
}

export async function POST(request: Request) {
  const identity = await getCurrentUser();
  if (!identity) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });

  const body = await request.json() as { objetivo?: Goal; minutosTeste?: number; segundosTeste?: number };
  const update: {
    objetivo?: Goal;
    minutosTeste?: number;
    segundosTeste?: number;
    totalSegundos?: number;
    dataUltimoTeste?: string;
  } = {};

  if (body.objetivo && ["5k", "10k", "21k"].includes(body.objetivo)) {
    update.objetivo = body.objetivo;
  }

  if (Number.isInteger(body.minutosTeste) && Number.isInteger(body.segundosTeste)) {
    const total = Number(body.minutosTeste) * 60 + Number(body.segundosTeste);
    if (total < 570 || total > 1110) {
      return NextResponse.json({ error: "Tempo fora da faixa disponível." }, { status: 400 });
    }
    update.minutosTeste = Number(body.minutosTeste);
    update.segundosTeste = Number(body.segundosTeste);
    update.totalSegundos = total;
    update.dataUltimoTeste = new Date().toISOString();
  }

  const db = getDb();
  await ensureReferenceData(db);
  if (Object.keys(update).length) {
    await db.update(usuarios).set(update).where(eq(usuarios.idAluno, identity.idAluno));
  }

  return GET();
}

async function ensureReferenceData(db: ReturnType<typeof getDb>) {
  const [matrixExists] = await db.select({ key: matrizVdot.tempo3kTexto }).from(matrizVdot).limit(1);
  if (!matrixExists) {
    await db.insert(matrizVdot).values(VDOT_ROWS.map((row) => ({
      tempo3kTexto: row.label,
      segundosMin: row.secondsMin,
      segundosMax: row.secondsMax,
      vdot: row.vdot,
      z1Pace: row.zones.Z1,
      z2Pace: row.zones.Z2,
      z3Pace: row.zones.Z3,
      z4Pace: row.zones.Z4,
      z5Pace: row.zones.Z5,
      z6Pace: row.zones.Z6,
      z7Pace: row.zones.Z7,
    }))).onConflictDoNothing();
  }

  const [trainingExists] = await db.select({ id: treinosBlocos.id }).from(treinosBlocos).limit(1);
  if (!trainingExists) {
    const goals: Goal[] = ["5k", "10k", "21k"];
    const rows = goals.flatMap((goal) => [1, 2, 3, 4].flatMap((week) =>
      getWorkouts(goal, week).map((workout) => ({
        distanciaAlvo: goal,
        semana: week,
        sessao: `Sessão ${workout.session} ${workout.icon}`,
        nomeSessao: workout.name,
        descricaoTreino: workout.description,
        zonaAlvo: workout.zone,
      })),
    ));
    for (let index = 0; index < rows.length; index += 10) {
      await db.insert(treinosBlocos).values(rows.slice(index, index + 10)).onConflictDoNothing();
    }
  }
}
