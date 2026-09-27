import { env } from "cloudflare:workers";
import { z } from "zod";
import type { GeneratedTrainingPlan, RunningProfile, TrainingSession, TrainingWeek } from "@/backend/types";

const trainingSessionSchema = z.object({
  sessao: z.number().int().min(1).max(6),
  titulo: z.string().min(3).max(80),
  tipo: z.string().min(3).max(50),
  duracaoMinutos: z.number().int().min(15).max(180),
  intensidade: z.string().min(2).max(80),
  descricao: z.string().min(10).max(600),
  terrenoSugerido: z.string().optional(),
  diaSugerido: z.string().optional(),
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
                terrenoSugerido: { type: "string", maxLength: 60 },
                diaSugerido: { type: "string", maxLength: 40 },
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

interface GeminiPart {
  text?: string;
}

interface GeminiCandidate {
  content?: {
    parts?: GeminiPart[];
    role?: string;
  };
  finishReason?: string;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

interface OpenAIResponseContent {
  type?: string;
  text?: string;
}

interface OpenAIResponseOutputItem {
  content?: OpenAIResponseContent[];
}

interface OpenAIResponse {
  output_text?: string;
  output?: OpenAIResponseOutputItem[];
  error?: {
    message?: string;
    code?: string;
  };
}

export class AiConfigurationError extends Error {}

function buildPromptInstructions(profile: RunningProfile): string {
  return [
    "Você é um treinador de corrida de alta performance da assessoria VIDA ATIVA - FLEX, responsável, focado em método e conservador com segurança.",
    "Crie um plano de quatro semanas personalizado em português do Brasil.",
    `Use rigorosamente ${profile.treinosPorSemana} sessões por semana, numeradas a partir de 1.`,
    profile.treinosPorSemana === 2 ? "Como são 2 treinos semanais, priorize o formato ultra-enxuto: Sessão 1 de Qualidade/Estímulo e Sessão 2 de Longão/Volume." : "",
    profile.treinosPorSemana === 3 ? "Como são 3 treinos semanais, utilize o formato clássico VIDA ATIVA - FLEX: Sessão 1 (Estímulo/Tiros ⚡), Sessão 2 (Rodagem Base Z2 🔄) e Sessão 3 (Longão/Ritmo 🎯)." : "",
    profile.treinosPorSemana === 4 ? "Como são 4 treinos semanais, distribua: 1 treino de velocidade/qualidade, 2 rodagens de base aeróbia em Z2 e 1 longão sustentado." : "",
    profile.nivelExperiencia === "iniciante" ? "O atleta é iniciante: intercale caminhada e trote leve, enfatizando adaptação osteoarticular e cadência antes de intensidade." : "",
    profile.nivelExperiencia === "intermediario" ? "O atleta é intermediário: trabalhe blocos de limiar anaeróbio (Z4/Z5) e evolução progressiva de volume no longão." : "",
    profile.nivelExperiencia === "avancado" ? "O atleta é avançado: inclua variações de VO2máx e treinos específicos no ritmo pretendido da prova alvo." : "",
    profile.terrenoPrincipal === "esteira" ? "O terreno principal é Esteira: adicione orientações de inclinação de 1% para compensar a esteira e foco no controle de cadência." : "",
    profile.terrenoPrincipal === "rua" ? "O terreno principal é Rua/Asfalto: instrua sobre leitura de terreno, vento e gestão de esforço em subidas." : "",
    profile.tipoTeste === "sem_teste"
      ? "REGRA OBRIGATÓRIA: O atleta ainda não realizou o teste de zonas. Portanto, a Sessão 1 da Semana 1 DEVE SER o 'Protocolo do Teste de 3 km': 10 min de trote leve de aquecimento (Z1), 3 km contínuos no ritmo mais forte sustentável (marcando o tempo exato) e 5 min de caminhada solta para desaquecer. Explique que esse resultado calibrará suas zonas metabólicas no app."
      : "O atleta já possui tempo de referência aferido: utilize referências de zonas metabólicas (Z1 a Z7) e ritmo adequado nas orientações.",
    "Responda estritamente em formato JSON estruturado conforme o schema solicitado.",
  ].filter(Boolean).join(" ");
}

async function callGeminiApi(
  apiKey: string,
  model: string,
  profile: RunningProfile
): Promise<GeneratedTrainingPlan | null> {
  const instructions = buildPromptInstructions(profile);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`;

  const promptContent = JSON.stringify({
    idade: profile.idade,
    pesoKg: profile.pesoKg,
    alturaCm: profile.alturaCm,
    nivelExperiencia: profile.nivelExperiencia,
    focoPrincipal: profile.focoPrincipal,
    distanciaAlvo: profile.distanciaAlvo,
    treinosPorSemana: profile.treinosPorSemana,
    diasPreferenciais: profile.diasPreferenciais,
    terrenoPrincipal: profile.terrenoPrincipal,
    tipoTeste: profile.tipoTeste,
    tempoSegundosEstimado: profile.tempoSegundosEstimado,
    vdotCalculado: profile.vdotCalculado,
  });

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `Gere o plano de treino em formato JSON para o seguinte perfil:\n${promptContent}` }],
        },
      ],
      systemInstruction: {
        parts: [{ text: instructions }],
      },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          required: ["titulo", "resumo", "semanas", "orientacoes"],
          properties: {
            titulo: { type: "STRING" },
            resumo: { type: "STRING" },
            semanas: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                required: ["semana", "foco", "sessoes"],
                properties: {
                  semana: { type: "INTEGER" },
                  foco: { type: "STRING" },
                  sessoes: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      required: ["sessao", "titulo", "tipo", "duracaoMinutos", "intensidade", "descricao"],
                      properties: {
                        sessao: { type: "INTEGER" },
                        titulo: { type: "STRING" },
                        tipo: { type: "STRING" },
                        duracaoMinutos: { type: "INTEGER" },
                        intensidade: { type: "STRING" },
                        descricao: { type: "STRING" },
                        terrenoSugerido: { type: "STRING" },
                        diaSugerido: { type: "STRING" },
                      },
                    },
                  },
                },
              },
            },
            orientacoes: {
              type: "ARRAY",
              items: { type: "STRING" },
            },
          },
        },
      },
    }),
  });

  const payload = (await response.json().catch(() => null)) as GeminiResponse | null;

  if (!response.ok || payload?.error) {
    console.warn("Aviso: Falha na API do Gemini:", payload?.error?.message ?? response.status);
    return null;
  }

  const rawText = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    console.warn("Aviso: Gemini retornou resposta sem conteúdo de texto.");
    return null;
  }

  const parsed = trainingPlanSchema.safeParse(JSON.parse(rawText));
  if (!parsed.success) {
    console.warn("Aviso: Formato do Gemini não atendeu ao schema de validação:", parsed.error.issues);
    return null;
  }

  return parsed.data;
}

async function callOpenAiApi(
  apiKey: string,
  model: string,
  profile: RunningProfile
): Promise<GeneratedTrainingPlan | null> {
  const instructions = buildPromptInstructions(profile);

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
      instructions,
      input: JSON.stringify({
        idade: profile.idade,
        pesoKg: profile.pesoKg,
        alturaCm: profile.alturaCm,
        nivelExperiencia: profile.nivelExperiencia,
        focoPrincipal: profile.focoPrincipal,
        distanciaAlvo: profile.distanciaAlvo,
        treinosPorSemana: profile.treinosPorSemana,
        diasPreferenciais: profile.diasPreferenciais,
        terrenoPrincipal: profile.terrenoPrincipal,
        tipoTeste: profile.tipoTeste,
        tempoSegundosEstimado: profile.tempoSegundosEstimado,
        vdotCalculado: profile.vdotCalculado,
      }),
      text: {
        format: {
          type: "json_schema",
          name: "plano_corrida_personalizado",
          strict: true,
          schema: outputSchema,
        },
      },
    }),
  });

  const payload = (await response.json().catch(() => null)) as OpenAIResponse | null;

  if (!response.ok || payload?.error) {
    console.warn("Aviso: Falha na OpenAI:", payload?.error?.message ?? response.status);
    return null;
  }

  const outputText = payload?.output_text ?? payload?.output
    ?.flatMap((item) => item.content ?? [])
    .find((content) => content.type === "output_text")?.text;

  if (!outputText) {
    return null;
  }

  const parsed = trainingPlanSchema.safeParse(JSON.parse(outputText));
  return parsed.success ? parsed.data : null;
}

export async function generateTrainingPlan(
  profile: RunningProfile
): Promise<{ plan: GeneratedTrainingPlan; model: string }> {
  const runtime = env as unknown as Record<string, unknown>;

  // 1. Prioridade: Google Gemini
  const rawGeminiKey = (typeof runtime?.GEMINI_API_KEY === "string" ? runtime.GEMINI_API_KEY : "") ||
                       (typeof process?.env?.GEMINI_API_KEY === "string" ? process.env.GEMINI_API_KEY : "");
  const geminiApiKey = rawGeminiKey.trim();

  const rawGeminiModel = (typeof runtime?.GEMINI_MODEL === "string" ? runtime.GEMINI_MODEL : "") ||
                         (typeof process?.env?.GEMINI_MODEL === "string" ? process.env.GEMINI_MODEL : "");
  const preferredModel = rawGeminiModel.trim() || "gemini-3.5-flash-lite";

  if (geminiApiKey) {
    // Modelos candidatos para evitar quebras caso a Google descontinue versões antigas
    const candidateModels = Array.from(new Set([
      preferredModel,
      "gemini-3.5-flash-lite",
      "gemini-3.6-flash",
      "gemini-flash-latest",
    ]));

    for (const candidate of candidateModels) {
      try {
        console.info(`Solicitando geração de treino via Google Gemini (${candidate})...`);
        const plan = await callGeminiApi(geminiApiKey, candidate, profile);
        if (plan) {
          return { plan, model: candidate };
        }
      } catch (err: unknown) {
        console.warn(`Erro com modelo ${candidate}:`, err);
      }
    }
    console.warn("Aviso: Nenhum modelo do Gemini respondeu com sucesso. Verificando alternativas...");
  }

  // 2. Alternativa: OpenAI
  const rawOpenAiKey = (typeof runtime?.OPENAI_API_KEY === "string" ? runtime.OPENAI_API_KEY : "") ||
                       (typeof process?.env?.OPENAI_API_KEY === "string" ? process.env.OPENAI_API_KEY : "");
  const openAiApiKey = rawOpenAiKey.trim();

  const rawOpenAiModel = (typeof runtime?.OPENAI_MODEL === "string" ? runtime.OPENAI_MODEL : "") ||
                         (typeof process?.env?.OPENAI_MODEL === "string" ? process.env.OPENAI_MODEL : "");
  const openAiModel = rawOpenAiModel.trim() || "gpt-4o-mini";

  if (openAiApiKey) {
    try {
      console.info(`Tentando geração via OpenAI (${openAiModel})...`);
      const plan = await callOpenAiApi(openAiApiKey, openAiModel, profile);
      if (plan) {
        return { plan, model: openAiModel };
      }
    } catch (err: unknown) {
      console.warn("Erro ao comunicar com a OpenAI:", err);
    }
  }

  // 3. Fallback Resiliente: Motor Metodológico Nativo VIDA ATIVA - FLEX
  console.info("Acionando o Motor Metodológico Nativo VIDA ATIVA - FLEX.");
  return {
    plan: generateFallbackTrainingPlan(profile),
    model: "metodologia-flex-nativa",
  };
}

/**
 * Gerador Metodológico Nativo do VIDA ATIVA - FLEX
 * Constrói um plano de 4 semanas personalizado e conservador caso a IA externa não esteja disponível.
 */
export function generateFallbackTrainingPlan(profile: RunningProfile): GeneratedTrainingPlan {
  const isBeginner = profile.nivelExperiencia === "iniciante";
  const isAdvanced = profile.nivelExperiencia === "avancado";
  const terrainNote = profile.terrenoPrincipal === "esteira"
    ? " (Na esteira, use 1% de inclinação)"
    : profile.terrenoPrincipal === "rua"
      ? " (Ao ar livre, controle o ritmo nas subidas)"
      : "";

  const semanas: TrainingWeek[] = [1, 2, 3, 4].map((sem) => {
    const sessoes: TrainingSession[] = [];
    const dias = profile.diasPreferenciais;
    const getDia = (idx: number) => (dias[idx % dias.length] ? `Sugestão: ${dias[idx % dias.length].toUpperCase()}` : "Dia livre");

    // Semana 1, Sessão 1: Se não tem teste, inclui obrigatoriamente o protocolo de 3 km!
    if (sem === 1 && profile.tipoTeste === "sem_teste") {
      sessoes.push({
        sessao: 1,
        titulo: "Protocolo do Teste de 3 km",
        tipo: "Avaliação Metabólica",
        duracaoMinutos: 40,
        intensidade: "Máxima Sustentável nos 3k",
        descricao: `Aqueça 10 min em trote leve (Z1). Em seguida, corra 3 km contínuos no ritmo mais forte que conseguir sustentar com constância (anote seu tempo exato!). Finalize com 5 a 10 min de caminhada solta para desaquecer.${terrainNote}`,
        diaSugerido: getDia(0),
        terrenoSugerido: profile.terrenoPrincipal,
      });
    } else {
      // Sessão 1 regular: Estímulo / Variação de Ritmo
      const dur = isBeginner ? 35 + sem * 2 : isAdvanced ? 55 + sem * 3 : 45 + sem * 2;
      sessoes.push({
        sessao: 1,
        titulo: isBeginner ? "Fartlek Leve com Caminhada" : "Estímulo de Ritmo e Limiar ⚡",
        tipo: isBeginner ? "Adaptação e Variação" : "Tiros e Limiar",
        duracaoMinutos: dur,
        intensidade: isBeginner ? "Z1 alternado com Z2/Z3" : "Blocos em Z4/Z5",
        descricao: isBeginner
          ? `10 min trote leve, seguido de 6 blocos de (2 min corrida moderada + 2 min caminhada). Feche com 5 min de desaquecimento.${terrainNote}`
          : `12 min em Z1 para aquecer, depois ${3 + sem} blocos de 3 min em Z5 com 2 min em Z2. Feche com 8 min soltos.${terrainNote}`,
        diaSugerido: getDia(0),
        terrenoSugerido: profile.terrenoPrincipal,
      });
    }

    // Se treina 3 ou 4 vezes: Sessão 2 é Rodagem de Base Z2
    if (profile.treinosPorSemana >= 3) {
      const durBase = isBeginner ? 30 + sem * 2 : 40 + sem * 3;
      sessoes.push({
        sessao: sessoes.length + 1,
        titulo: "Rodagem de Base Aeróbia 🔄",
        tipo: "Construção Aeróbia",
        duracaoMinutos: durBase,
        intensidade: "Z2 (Ritmo de conversa)",
        descricao: `Corrida contínua confortável em Z2. Mantenha a respiração nasal ou controlada, terminando com a sensação de que conseguiria correr mais.${terrainNote}`,
        diaSugerido: getDia(1),
        terrenoSugerido: profile.terrenoPrincipal,
      });
    }

    // Se treina 4 vezes: Rodagem extra de recuperação Z1/Z2
    if (profile.treinosPorSemana === 4) {
      sessoes.push({
        sessao: sessoes.length + 1,
        titulo: "Soltura e Cadência 🏃",
        tipo: "Regenerativo Ativo",
        duracaoMinutos: 35,
        intensidade: "Z1 / Início de Z2",
        descricao: `Trote bem leve e relaxado. Concentre-se em passadas curtas, postura ereta e braços soltos.${terrainNote}`,
        diaSugerido: getDia(2),
        terrenoSugerido: profile.terrenoPrincipal,
      });
    }

    // Última Sessão: Longão Progressivo 🎯
    const durLongao = isBeginner ? 40 + sem * 5 : isAdvanced ? 70 + sem * 10 : 55 + sem * 5;
    sessoes.push({
      sessao: sessoes.length + 1,
      titulo: sem === 4 ? "Simulado de Ritmo e Chegada 🎯" : "Longão Estruturado 🎯",
      tipo: "Resistência Específica",
      duracaoMinutos: durLongao,
      intensidade: isBeginner ? "Z2 Constante" : "Z2 com final progressivo em Z3",
      descricao: isBeginner
        ? `Percurso contínuo confortável em Z2 com pausas de hidratação a cada 15-20 min. Priorize tempo total em movimento.${terrainNote}`
        : `Comece os primeiros 70% do tempo em Z2 estável e acelere os últimos 15 min próximos da sua zona de ritmo pretendida.${terrainNote}`,
      diaSugerido: getDia(profile.treinosPorSemana - 1),
      terrenoSugerido: profile.terrenoPrincipal,
    });

    const focosSemanais = [
      "Adaptação neuromuscular, cadência e calibração de zonas",
      "Consolidação de base aeróbia e controle de esforço",
      "Sustentação de volume e estímulo de limiar",
      "Pico do ciclo de 4 semanas e consolidação do ritmo",
    ];

    return {
      semana: sem,
      foco: focosSemanais[sem - 1] ?? "Evolução contínua e técnica",
      sessoes,
    };
  });

  const orientacoes = [
    "Respeite os dias leves: nunca faça dois treinos intensos em dias consecutivos.",
    profile.tipoTeste === "sem_teste"
      ? "Assim que concluir o teste de 3 km na 1ª sessão, registre seu tempo na aba 'Teste' para calcular as 7 zonas metabólicas automáticas."
      : "Monitore suas zonas: as rodagens devem ser feitas estritamente em Z2 para poupar suas articulações.",
    "Hidrate-se antes, durante e após os treinos mais longos, especialmente em dias quentes.",
    "Segurança em primeiro lugar: interrompa o treino imediatamente em caso de dor atípica, tontura ou mal-estar.",
  ];

  return {
    titulo: `Ciclo de 4 Semanas - ${profile.focoPrincipal.replace("_", " ").toUpperCase()}`,
    resumo: `Plano personalizado para ${profile.treinosPorSemana} sessões semanais focado em ${profile.focoPrincipal.replace("_", " ")}, adaptado ao nível ${profile.nivelExperiencia} e terreno ${profile.terrenoPrincipal}.`,
    semanas,
    orientacoes,
  };
}
