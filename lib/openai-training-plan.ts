import { env } from "cloudflare:workers";
import { z } from "zod";
import type { GeneratedTrainingPlan, RunningProfile } from "@/lib/training-plan-types";

const trainingSessionSchema = z.object({
  sessao: z.number().int().min(1).max(6),
  titulo: z.string().min(3).max(80),
  tipo: z.string().min(3).max(50),
  duracaoMinutos: z.number().int().min(15).max(180),
  intensidade: z.string().min(2).max(80),
  descricao: z.string().min(10).max(600),
}).strict();

const trainingPlanSchema = z.object({
  titulo: z.string().min(3).max(100),
  resumo: z.string().min(20).max(800),
  semanas: z.array(z.object({
    semana: z.number().int().min(1).max(4),
    foco: z.string().min(3).max(120),
    sessoes: z.array(trainingSessionSchema).min(2).max(6),
  }).strict()).length(4),
  orientacoes: z.array(z.string().min(5).max(250)).min(3).max(6),
}).strict();

const outputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["titulo", "resumo", "semanas", "orientacoes"],
  properties: {
    titulo: { type: "string", minLength: 3, maxLength: 100 },
    resumo: { type: "string", minLength: 20, maxLength: 800 },
    semanas: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["semana", "foco", "sessoes"],
        properties: {
          semana: { type: "integer", minimum: 1, maximum: 4 },
          foco: { type: "string", minLength: 3, maxLength: 120 },
          sessoes: {
            type: "array",
            minItems: 2,
            maxItems: 6,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["sessao", "titulo", "tipo", "duracaoMinutos", "intensidade", "descricao"],
              properties: {
                sessao: { type: "integer", minimum: 1, maximum: 6 },
                titulo: { type: "string", minLength: 3, maxLength: 80 },
                tipo: { type: "string", minLength: 3, maxLength: 50 },
                duracaoMinutos: { type: "integer", minimum: 15, maximum: 180 },
                intensidade: { type: "string", minLength: 2, maxLength: 80 },
                descricao: { type: "string", minLength: 10, maxLength: 600 },
              },
            },
          },
        },
      },
    },
    orientacoes: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: { type: "string", minLength: 5, maxLength: 250 },
    },
  },
} as const;

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
};

export class AiConfigurationError extends Error {}

export async function generateTrainingPlan(profile: RunningProfile): Promise<{ plan: GeneratedTrainingPlan; model: string }> {
  const runtime = env as unknown as Record<string, unknown>;
  const apiKey = typeof runtime.OPENAI_API_KEY === "string" ? runtime.OPENAI_API_KEY.trim() : "";
  const model = typeof runtime.OPENAI_MODEL === "string" && runtime.OPENAI_MODEL.trim()
    ? runtime.OPENAI_MODEL.trim()
    : "gpt-5-mini";

  if (!apiKey) {
    throw new AiConfigurationError("A geração por IA ainda não foi configurada.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      store: false,
      max_output_tokens: 4000,
      instructions: [
        "Você é um treinador de corrida responsável e conservador.",
        "Crie um plano inicial de quatro semanas em português do Brasil.",
        "Use exatamente a quantidade de sessões semanais solicitada, numeradas a partir de 1.",
        "Para iniciantes, combine caminhada e corrida e aumente a carga gradualmente.",
      ].join(" "),
      input: JSON.stringify({
        idade: profile.idade,
        pesoKg: profile.pesoKg,
        alturaCm: profile.alturaCm,
        jaCorre: profile.jaCorre,
        tempoCorridaMeses: profile.tempoCorridaMeses,
        treinosPorSemana: profile.treinosPorSemana,
      }),
      text: {
        format: {
          type: "json_schema",
          name: "plano_corrida_inicial",
          strict: true,
          schema: outputSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    console.error("OpenAI training plan request failed", { status: response.status });
    throw new Error("Não foi possível gerar o treino agora.");
  }

  const payload = await response.json() as OpenAIResponse;
  const outputText = payload.output_text ?? payload.output
    ?.flatMap((item) => item.content ?? [])
    .find((content) => content.type === "output_text")?.text;
  if (!outputText) throw new Error("A IA não retornou um plano válido.");

  const parsed = trainingPlanSchema.safeParse(JSON.parse(outputText));
  if (!parsed.success) {
    console.error("OpenAI training plan validation failed", { issues: parsed.error.issues.length });
    throw new Error("A IA retornou um plano incompleto.");
  }

  const hasExpectedSessions = parsed.data.semanas.every((week) => week.sessoes.length === profile.treinosPorSemana);
  if (!hasExpectedSessions) throw new Error("A IA retornou uma frequência diferente da solicitada.");

  return { plan: parsed.data, model };
}
