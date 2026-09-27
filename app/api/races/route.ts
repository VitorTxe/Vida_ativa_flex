import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/backend/db";
import { provas } from "@/backend/db/schema";
import { getCurrentUser } from "@/backend/services/auth.service";
import type { RacePersonalRecord, RaceRecord } from "@/frontend/types/races.types";

export const dynamic = "force-dynamic";

const newRaceSchema = z.object({
  nomeProva: z.string().min(2, "Informe o nome da prova.").max(120),
  dataProva: z.string().min(8, "Informe a data da prova."),
  distanciaKm: z.number().positive("A distância deve ser maior que zero.").max(200),
  minutos: z.number().int().min(0).max(600),
  segundos: z.number().int().min(0).max(59),
  sensacaoEsforco: z.number().int().min(1).max(10).nullable().optional(),
  comentarios: z.string().max(1000).nullable().optional(),
}).strict().refine((d) => d.minutos * 60 + d.segundos > 0, {
  message: "O tempo de prova deve ser maior que zero.",
  path: ["minutos"],
});

function calculatePace(totalSeconds: number, distanceKm: number): string {
  if (distanceKm <= 0 || totalSeconds <= 0) return "--:--/km";
  const secondsPerKm = totalSeconds / distanceKm;
  const paceMin = Math.floor(secondsPerKm / 60);
  const paceSec = Math.round(secondsPerKm % 60);
  if (paceSec === 60) {
    return `${paceMin + 1}:00/km`;
  }
  return `${paceMin}:${paceSec.toString().padStart(2, "0")}/km`;
}

function calculatePersonalRecords(raceList: RaceRecord[]): RacePersonalRecord[] {
  const distanceThresholds = [
    { label: "5 km", match: (km: number) => Math.abs(km - 5) <= 0.3, distance: 5 },
    { label: "10 km", match: (km: number) => Math.abs(km - 10) <= 0.5, distance: 10 },
    { label: "21 km (Meia)", match: (km: number) => Math.abs(km - 21.1) <= 0.8 || Math.abs(km - 21) <= 0.8, distance: 21.1 },
    { label: "42 km (Maratona)", match: (km: number) => Math.abs(km - 42.2) <= 1.0 || Math.abs(km - 42) <= 1.0, distance: 42.2 },
  ];

  const personalRecords: RacePersonalRecord[] = [];

  for (const group of distanceThresholds) {
    const matching = raceList.filter((r) => group.match(r.distanciaKm));
    if (matching.length > 0) {
      const best = matching.reduce((prev, curr) =>
        curr.tempoTotalSegundos < prev.tempoTotalSegundos ? curr : prev
      );
      personalRecords.push({
        distanciaRotulo: group.label,
        distanciaKm: best.distanciaKm,
        tempoTotalSegundos: best.tempoTotalSegundos,
        paceMedio: best.paceMedio,
        nomeProva: best.nomeProva,
        dataProva: best.dataProva,
      });
    }
  }

  return personalRecords;
}

export async function GET() {
  try {
    const identity = await getCurrentUser();
    if (!identity) {
      return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
    }

    const db = getDb();
    const rows = await db
      .select()
      .from(provas)
      .where(eq(provas.idAluno, identity.idAluno))
      .orderBy(desc(provas.dataProva));

    const raceList: RaceRecord[] = rows.map((r) => ({
      id: r.id,
      idAluno: r.idAluno,
      nomeProva: r.nomeProva,
      dataProva: r.dataProva,
      distanciaKm: r.distanciaKm,
      tempoTotalSegundos: r.tempoTotalSegundos,
      paceMedio: r.paceMedio,
      sensacaoEsforco: r.sensacaoEsforco,
      comentarios: r.comentarios,
      criadoEm: r.criadoEm,
    }));

    const totalProvas = raceList.length;
    const kmTotal = Math.round(raceList.reduce((acc, r) => acc + r.distanciaKm, 0) * 10) / 10;
    const recordesPessoais = calculatePersonalRecords(raceList);

    return NextResponse.json({
      races: raceList,
      stats: {
        totalProvas,
        kmTotal,
        recordesPessoais,
      },
    });
  } catch (error: unknown) {
    console.error("Erro ao listar provas:", error);
    return NextResponse.json({ error: "Falha ao carregar suas provas." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const identity = await getCurrentUser();
    if (!identity) {
      return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as unknown;
    const parsed = newRaceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados da prova inválidos." },
        { status: 400 }
      );
    }

    const { nomeProva, dataProva, distanciaKm, minutos, segundos, sensacaoEsforco, comentarios } = parsed.data;
    const tempoTotalSegundos = minutos * 60 + segundos;
    const paceMedio = calculatePace(tempoTotalSegundos, distanciaKm);

    const db = getDb();
    const newRace: RaceRecord = {
      id: crypto.randomUUID(),
      idAluno: identity.idAluno,
      nomeProva: nomeProva.trim(),
      dataProva,
      distanciaKm,
      tempoTotalSegundos,
      paceMedio,
      sensacaoEsforco: sensacaoEsforco ?? null,
      comentarios: comentarios ? comentarios.trim() : null,
      criadoEm: new Date().toISOString(),
    };

    await db.insert(provas).values({
      id: newRace.id,
      idAluno: newRace.idAluno,
      nomeProva: newRace.nomeProva,
      dataProva: newRace.dataProva,
      distanciaKm: newRace.distanciaKm,
      tempoTotalSegundos: newRace.tempoTotalSegundos,
      paceMedio: newRace.paceMedio,
      sensacaoEsforco: newRace.sensacaoEsforco,
      comentarios: newRace.comentarios,
      criadoEm: newRace.criadoEm,
    });

    return NextResponse.json({ race: newRace }, { status: 201 });
  } catch (error: unknown) {
    console.error("Erro ao registrar prova:", error);
    return NextResponse.json({ error: "Falha ao salvar o resultado da prova." }, { status: 500 });
  }
}
