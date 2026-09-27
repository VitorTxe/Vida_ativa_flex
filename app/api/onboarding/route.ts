import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/backend/db";
import { perfisCorrida, planosIa, usuarios } from "@/backend/db/schema";
import { getCurrentUser } from "@/backend/services/auth.service";
import { AiConfigurationError, generateTrainingPlan } from "@/backend/services/training-plan.service";
import type { GeneratedTrainingPlan, RunningProfile } from "@/backend/types";
import { estimate3kSecondsFromRace, findVdot } from "@/frontend/lib/fitness-data";

export const dynamic = "force-dynamic";

const onboardingSchema = z.object({
  idade: z.number().int().min(16).max(95).default(30),
  pesoKg: z.number().min(35).max(300).default(70),
  alturaCm: z.number().int().min(130).max(230).default(170),
  nivelExperiencia: z.enum(["iniciante", "intermediario", "avancado"]).default("iniciante"),
  focoPrincipal: z.enum(["primeira_prova", "recorde_pessoal", "condicionamento"]).default("condicionamento"),
  distanciaAlvo: z.enum(["5k", "10k", "21k", "42k"]).nullable().optional(),
  treinosPorSemana: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
  diasPreferenciais: z.array(z.enum(["seg", "ter", "qua", "qui", "sex", "sab", "dom"])).min(1).default(["ter", "qui", "sab"]),
  terrenoPrincipal: z.enum(["rua", "esteira", "misto"]).default("rua"),
  tipoTeste: z.enum(["teste_3k", "prova_recente", "sem_teste"]).default("sem_teste"),
  minutosTeste: z.number().int().min(9).max(35).nullable().optional(),
  segundosTeste: z.number().int().min(0).max(59).nullable().optional(),
  distanciaProva: z.enum(["5k", "10k"]).nullable().optional(),
  minutosProva: z.number().int().min(15).max(90).nullable().optional(),
  segundosProva: z.number().int().min(0).max(59).nullable().optional(),
}).strict().superRefine((data, ctx) => {
  if (data.tipoTeste === "teste_3k") {
    if (typeof data.minutosTeste !== "number" || typeof data.segundosTeste !== "number") {
      ctx.addIssue({ code: "custom", path: ["minutosTeste"], message: "Informe os minutos e segundos do teste de 3 km." });
    }
  }
  if (data.tipoTeste === "prova_recente") {
    if (!data.distanciaProva || typeof data.minutosProva !== "number" || typeof data.segundosProva !== "number") {
      ctx.addIssue({ code: "custom", path: ["distanciaProva"], message: "Informe a distância e o tempo da sua prova recente." });
    }
  }
});

export async function GET() {
  const identity = await getCurrentUser();
  if (!identity) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });

  const db = getDb();
  const [profileRow] = await db.select().from(perfisCorrida).where(eq(perfisCorrida.idAluno, identity.idAluno)).limit(1);
  const [planRow] = await db.select().from(planosIa).where(eq(planosIa.idAluno, identity.idAluno)).limit(1);
  const profile = profileRow ? toRunningProfile(profileRow) : null;
  const plan = planRow ? safeParsePlan(planRow.planoJson) : null;

  return NextResponse.json({
    completed: Boolean(profileRow?.concluidoEm && plan),
    profile,
    plan,
  });
}

export async function POST(request: Request) {
  try {
    const identity = await getCurrentUser();
    if (!identity) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });

    const body = (await request.json().catch(() => null)) as unknown;
    const parsed = onboardingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Revise as respostas fornecidas." }, { status: 400 });
    }

    const data = parsed.data;
    let estimated3kSeconds: number | null = null;
    let calculatedVdot: number | null = null;

    if (data.tipoTeste === "teste_3k" && typeof data.minutosTeste === "number" && typeof data.segundosTeste === "number") {
      estimated3kSeconds = data.minutosTeste * 60 + data.segundosTeste;
      const match = findVdot(estimated3kSeconds);
      if (match) calculatedVdot = match.vdot;
    } else if (data.tipoTeste === "prova_recente" && data.distanciaProva && typeof data.minutosProva === "number" && typeof data.segundosProva === "number") {
      const raceTotalSeconds = data.minutosProva * 60 + data.segundosProva;
      estimated3kSeconds = estimate3kSecondsFromRace(data.distanciaProva, raceTotalSeconds);
      const match = findVdot(estimated3kSeconds);
      if (match) calculatedVdot = match.vdot;
    }

    const db = getDb();
    const nowIso = new Date().toISOString();

    // Sincroniza zonas no perfil do usuário caso haja tempo medido
    if (estimated3kSeconds) {
      await db.update(usuarios).set({
        minutosTeste: Math.floor(estimated3kSeconds / 60),
        segundosTeste: estimated3kSeconds % 60,
        totalSegundos: estimated3kSeconds,
        dataUltimoTeste: nowIso,
        objetivo: data.distanciaAlvo ?? "10k",
      }).where(eq(usuarios.idAluno, identity.idAluno));
    } else if (data.distanciaAlvo) {
      await db.update(usuarios).set({
        objetivo: data.distanciaAlvo,
      }).where(eq(usuarios.idAluno, identity.idAluno));
    }

    const profile: RunningProfile = {
      idade: data.idade,
      pesoKg: data.pesoKg,
      alturaCm: data.alturaCm,
      nivelExperiencia: data.nivelExperiencia,
      focoPrincipal: data.focoPrincipal,
      distanciaAlvo: data.distanciaAlvo ?? null,
      treinosPorSemana: data.treinosPorSemana,
      diasPreferenciais: data.diasPreferenciais,
      terrenoPrincipal: data.terrenoPrincipal,
      tipoTeste: data.tipoTeste,
      minutosTeste: data.minutosTeste ?? null,
      segundosTeste: data.segundosTeste ?? null,
      distanciaProva: data.distanciaProva ?? null,
      minutosProva: data.minutosProva ?? null,
      segundosProva: data.segundosProva ?? null,
      tempoSegundosEstimado: estimated3kSeconds,
      vdotCalculado: calculatedVdot,
    };

    await db.insert(perfisCorrida).values({
      idAluno: identity.idAluno,
      idade: data.idade,
      pesoKg: data.pesoKg,
      alturaCm: data.alturaCm,
      jaCorre: data.nivelExperiencia !== "iniciante",
      treinosPorSemana: data.treinosPorSemana,
      nivelExperiencia: data.nivelExperiencia,
      focoPrincipal: data.focoPrincipal,
      distanciaAlvo: data.distanciaAlvo ?? null,
      diasPreferenciais: JSON.stringify(data.diasPreferenciais),
      terrenoPrincipal: data.terrenoPrincipal,
      tipoTeste: data.tipoTeste,
      tempoSegundosInformado: estimated3kSeconds,
      concluidoEm: null,
      atualizadoEm: nowIso,
    }).onConflictDoUpdate({
      target: perfisCorrida.idAluno,
      set: {
        idade: data.idade,
        pesoKg: data.pesoKg,
        alturaCm: data.alturaCm,
        jaCorre: data.nivelExperiencia !== "iniciante",
        treinosPorSemana: data.treinosPorSemana,
        nivelExperiencia: data.nivelExperiencia,
        focoPrincipal: data.focoPrincipal,
        distanciaAlvo: data.distanciaAlvo ?? null,
        diasPreferenciais: JSON.stringify(data.diasPreferenciais),
        terrenoPrincipal: data.terrenoPrincipal,
        tipoTeste: data.tipoTeste,
        tempoSegundosInformado: estimated3kSeconds,
        concluidoEm: null,
        atualizadoEm: nowIso,
      },
    });

    const { plan, model } = await generateTrainingPlan(profile);
    const generatedAt = new Date().toISOString();
    await db.insert(planosIa).values({
      idAluno: identity.idAluno,
      modelo: model,
      planoJson: JSON.stringify(plan),
      geradoEm: generatedAt,
    }).onConflictDoUpdate({
      target: planosIa.idAluno,
      set: { modelo: model, planoJson: JSON.stringify(plan), geradoEm: generatedAt },
    });
    await db.update(perfisCorrida).set({ concluidoEm: generatedAt, atualizadoEm: generatedAt })
      .where(eq(perfisCorrida.idAluno, identity.idAluno));
    return NextResponse.json({ completed: true, profile, plan }, { status: 201 });
  } catch (error: unknown) {
    console.error("ERRO_ONBOARDING_API:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      error: `Falha ao processar cadastro de treino: ${msg}`,
    }, { status: 500 });
  }
}

function toRunningProfile(row: typeof perfisCorrida.$inferSelect): RunningProfile {
  let dias: RunningProfile["diasPreferenciais"] = ["ter", "qui", "sab"];
  if (row.diasPreferenciais) {
    try {
      dias = JSON.parse(row.diasPreferenciais) as RunningProfile["diasPreferenciais"];
    } catch {
      // fallback
    }
  }
  return {
    idade: row.idade,
    pesoKg: row.pesoKg,
    alturaCm: row.alturaCm,
    nivelExperiencia: (row.nivelExperiencia ?? "iniciante") as RunningProfile["nivelExperiencia"],
    focoPrincipal: (row.focoPrincipal ?? "condicionamento") as RunningProfile["focoPrincipal"],
    distanciaAlvo: row.distanciaAlvo as RunningProfile["distanciaAlvo"],
    treinosPorSemana: (row.treinosPorSemana ?? 3) as 2 | 3 | 4,
    diasPreferenciais: dias,
    terrenoPrincipal: (row.terrenoPrincipal ?? "rua") as RunningProfile["terrenoPrincipal"],
    tipoTeste: (row.tipoTeste ?? "sem_teste") as RunningProfile["tipoTeste"],
    tempoSegundosEstimado: row.tempoSegundosInformado,
  };
}

function safeParsePlan(value: string): GeneratedTrainingPlan | null {
  try {
    return JSON.parse(value) as GeneratedTrainingPlan;
  } catch {
    return null;
  }
}
