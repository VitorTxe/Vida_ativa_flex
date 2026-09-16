export type Goal = "5k" | "10k" | "21k";

export type VdotRow = {
  label: string;
  secondsMin: number;
  secondsMax: number;
  vdot: number;
  zones: Record<ZoneKey, string>;
};

export type ZoneKey = "Z1" | "Z2" | "Z3" | "Z4" | "Z5" | "Z6" | "Z7";

export const ZONE_META: { key: ZoneKey; name: string; short: string; color: string }[] = [
  { key: "Z1", name: "Regenerativo", short: "Recuperação", color: "#b7f5cf" },
  { key: "Z2", name: "Rodagem / Base", short: "Base aeróbia", color: "#a6e8ff" },
  { key: "Z3", name: "Aeróbio Moderado", short: "Resistência", color: "#d6dcff" },
  { key: "Z4", name: "Pace de Prova", short: "Ritmo alvo", color: "#FFD700" },
  { key: "Z5", name: "Limiar Anaeróbio", short: "Limiar", color: "#ffbc80" },
  { key: "Z6", name: "VO₂ Máx / Tiros", short: "Intensidade", color: "#ff8d86" },
  { key: "Z7", name: "Potência Máxima", short: "Velocidade", color: "#f5a7ff" },
];

export const VDOT_ROWS: VdotRow[] = [
  { label: "18:00", secondsMin: 1051, secondsMax: 1110, vdot: 29, zones: { Z1: "> 8:15", Z2: "7:25–8:10", Z3: "7:05–7:24", Z4: "6:45–7:04", Z5: "6:15–6:44", Z6: "5:45–6:14", Z7: "< 5:35" } },
  { label: "17:00", secondsMin: 991, secondsMax: 1050, vdot: 31.5, zones: { Z1: "> 7:45", Z2: "7:00–7:40", Z3: "6:40–6:59", Z4: "6:20–6:39", Z5: "5:50–6:19", Z6: "5:20–5:49", Z7: "< 5:10" } },
  { label: "16:00", secondsMin: 931, secondsMax: 990, vdot: 33.5, zones: { Z1: "> 7:20", Z2: "6:35–7:15", Z3: "6:15–6:34", Z4: "5:55–6:14", Z5: "5:30–5:54", Z6: "5:00–5:29", Z7: "< 4:50" } },
  { label: "15:00", secondsMin: 871, secondsMax: 930, vdot: 36.5, zones: { Z1: "> 6:55", Z2: "6:10–6:50", Z3: "5:50–6:09", Z4: "5:30–5:49", Z5: "5:05–5:29", Z6: "4:40–5:04", Z7: "< 4:30" } },
  { label: "14:00", secondsMin: 811, secondsMax: 870, vdot: 40, zones: { Z1: "> 6:30", Z2: "5:45–6:25", Z3: "5:25–5:44", Z4: "5:05–5:24", Z5: "4:45–5:04", Z6: "4:20–4:44", Z7: "< 4:10" } },
  { label: "13:00", secondsMin: 751, secondsMax: 810, vdot: 44, zones: { Z1: "> 6:05", Z2: "5:20–6:00", Z3: "5:00–5:19", Z4: "4:40–4:59", Z5: "4:20–4:39", Z6: "3:58–4:19", Z7: "< 3:50" } },
  { label: "12:00", secondsMin: 691, secondsMax: 750, vdot: 49, zones: { Z1: "> 5:40", Z2: "4:55–5:35", Z3: "4:38–4:54", Z4: "4:20–4:37", Z5: "4:00–4:19", Z6: "3:40–3:59", Z7: "< 3:32" } },
  { label: "11:00", secondsMin: 631, secondsMax: 690, vdot: 55, zones: { Z1: "> 5:15", Z2: "4:30–5:10", Z3: "4:15–4:29", Z4: "3:58–4:14", Z5: "3:40–3:57", Z6: "3:22–3:39", Z7: "< 3:15" } },
  { label: "10:00", secondsMin: 570, secondsMax: 630, vdot: 62, zones: { Z1: "> 4:50", Z2: "4:05–4:45", Z3: "3:50–4:04", Z4: "3:35–3:49", Z5: "3:20–3:34", Z6: "3:05–3:19", Z7: "< 2:58" } },
];

export type Workout = {
  week: number;
  session: 1 | 2 | 3;
  icon: string;
  name: string;
  description: string;
  zone: ZoneKey;
  duration: string;
};

const commonByWeek: Record<number, Omit<Workout, "week">[]> = {
  1: [
    { session: 1, icon: "⚡", name: "Fartlek de adaptação", description: "12 min em {Z1}, depois 6 × 2 min em {Z5} com 2 min leves em {Z1}. Finalize com 8 min soltos.", zone: "Z5", duration: "48 min" },
    { session: 2, icon: "🔄", name: "Rodagem de base", description: "Corrida contínua confortável em {Z2}. Mantenha a respiração controlada e termine com sensação de que faria mais.", zone: "Z2", duration: "40 min" },
    { session: 3, icon: "🎯", name: "Longão progressivo", description: "Comece em {Z2} e avance para {Z3} nos 15 min finais, sem ultrapassar o ritmo indicado.", zone: "Z3", duration: "60 min" },
  ],
  2: [
    { session: 1, icon: "⚡", name: "Intervalado controlado", description: "15 min em {Z1}, 5 × 800 m em {Z6} com 400 m trotando em {Z1}. Desaqueça por 10 min.", zone: "Z6", duration: "52 min" },
    { session: 2, icon: "🔄", name: "Base + acelerações", description: "35 min em {Z2}. Ao final, faça 5 × 20 s em {Z7}, recuperando 1 min caminhando.", zone: "Z2", duration: "45 min" },
    { session: 3, icon: "🎯", name: "Longão estável", description: "Percurso contínuo em {Z2}. Hidrate-se a cada 25 min e preserve a técnica nas subidas.", zone: "Z2", duration: "70 min" },
  ],
  3: [
    { session: 1, icon: "⚡", name: "Blocos de limiar", description: "12 min em {Z1}, depois 3 × 8 min em {Z5} com 3 min em {Z2} entre blocos. Feche leve.", zone: "Z5", duration: "56 min" },
    { session: 2, icon: "🔄", name: "Rodagem regenerativa", description: "Corrida leve entre {Z1} e o início de {Z2}. Priorize passadas curtas e relaxadas.", zone: "Z1", duration: "38 min" },
    { session: 3, icon: "🎯", name: "Longão com ritmo", description: "40 min em {Z2}, 20 min em {Z3} e 10 min próximos de {Z4}. Controle o esforço.", zone: "Z4", duration: "75 min" },
  ],
  4: [
    { session: 1, icon: "⚡", name: "Velocidade curta", description: "12 min em {Z1}, 10 × 300 m em {Z7} com 200 m de trote. Termine com 10 min leves.", zone: "Z7", duration: "44 min" },
    { session: 2, icon: "🔄", name: "Soltura consciente", description: "Rodagem bem leve em {Z1}. Use o treino para recuperar e revisar sua postura.", zone: "Z1", duration: "32 min" },
    { session: 3, icon: "🎯", name: "Simulado progressivo", description: "Aqueça em {Z1}, corra o bloco central em {Z4} e acelere o último quilômetro até {Z5}.", zone: "Z4", duration: "5 km" },
  ],
};

const goalAdjustments: Record<Goal, Record<number, string>> = {
  "5k": { 1: "Foco em velocidade e economia.", 2: "Técnica antes do volume.", 3: "Controle o limiar.", 4: "Chegue inteiro ao simulado." },
  "10k": { 1: "Construa a base com constância.", 2: "Sustente a intensidade.", 3: "Conecte resistência e ritmo.", 4: "Reduza o volume e mantenha a qualidade." },
  "21k": { 1: "Priorize o tempo em movimento.", 2: "Nutrição e hidratação importam.", 3: "Sustente o esforço prolongado.", 4: "Absorva o ciclo antes de avançar." },
};

export function getWorkouts(goal: Goal, week: number): Workout[] {
  return commonByWeek[week].map((workout) => ({
    ...workout,
    week,
    description: `${workout.description} ${goalAdjustments[goal][week]}`,
    duration: goal === "21k" && workout.session === 3
      ? (week === 4 ? "8 km" : `${70 + week * 10} min`)
      : goal === "5k" && workout.session === 3
        ? (week === 4 ? "5 km" : `${45 + week * 5} min`)
        : workout.duration,
  }));
}

export function findVdot(totalSeconds: number) {
  return VDOT_ROWS.find((row) => totalSeconds >= row.secondsMin && totalSeconds <= row.secondsMax) ?? null;
}
