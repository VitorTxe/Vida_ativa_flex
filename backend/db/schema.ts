import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const usuarios = sqliteTable("usuarios", {
  idAluno: text("id_aluno").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  senhaHash: text("senha_hash"),
  statusPagamento: text("status_pagamento", { enum: ["Ativo", "Inativo"] }).notNull().default("Ativo"),
  role: text("role", { enum: ["aluno", "professor"] }).notNull().default("aluno"),
  objetivo: text("objetivo", { enum: ["5k", "10k", "21k", "42k"] }).notNull().default("10k"),
  minutosTeste: integer("minutos_teste"),
  segundosTeste: integer("segundos_teste"),
  totalSegundos: integer("total_segundos"),
  dataUltimoTeste: text("data_ultimo_teste"),
}, (table) => [
  uniqueIndex("idx_usuarios_email").on(table.email),
]);

export const sessoes = sqliteTable("sessoes", {
  tokenHash: text("token_hash").primaryKey(),
  idAluno: text("id_aluno").notNull().references(() => usuarios.idAluno, { onDelete: "cascade" }),
  criadoEm: integer("criado_em").notNull(),
  expiraEm: integer("expira_em").notNull(),
}, (table) => [
  index("idx_sessoes_aluno").on(table.idAluno),
  index("idx_sessoes_expiracao").on(table.expiraEm),
]);

export const perfisCorrida = sqliteTable("perfis_corrida", {
  idAluno: text("id_aluno").primaryKey().references(() => usuarios.idAluno, { onDelete: "cascade" }),
  idade: integer("idade").notNull().default(30),
  pesoKg: real("peso_kg").notNull().default(70),
  alturaCm: integer("altura_cm").notNull().default(170),
  jaCorre: integer("ja_corre", { mode: "boolean" }),
  tempoCorridaMeses: integer("tempo_corrida_meses"),
  treinosPorSemana: integer("treinos_por_semana").notNull().default(3),
  nivelExperiencia: text("nivel_experiencia", { enum: ["iniciante", "intermediario", "avancado"] }),
  focoPrincipal: text("foco_principal", { enum: ["primeira_prova", "recorde_pessoal", "condicionamento"] }),
  distanciaAlvo: text("distancia_alvo", { enum: ["5k", "10k", "21k", "42k"] }),
  diasPreferenciais: text("dias_preferenciais"),
  terrenoPrincipal: text("terreno_principal", { enum: ["rua", "esteira", "misto"] }),
  tipoTeste: text("tipo_teste", { enum: ["teste_3k", "prova_recente", "sem_teste"] }),
  tempoSegundosInformado: integer("tempo_segundos_informado"),
  concluidoEm: text("concluido_em"),
  atualizadoEm: text("atualizado_em").notNull(),
});

export const planosIa = sqliteTable("planos_ia", {
  idAluno: text("id_aluno").primaryKey().references(() => usuarios.idAluno, { onDelete: "cascade" }),
  modelo: text("modelo").notNull(),
  planoJson: text("plano_json").notNull(),
  geradoEm: text("gerado_em").notNull(),
});

export const matrizVdot = sqliteTable("matriz_vdot", {
  tempo3kTexto: text("tempo_3k_texto").primaryKey(),
  segundosMin: integer("segundos_min").notNull(),
  segundosMax: integer("segundos_max").notNull(),
  vdot: real("vdot").notNull(),
  z1Pace: text("z1_pace").notNull(),
  z2Pace: text("z2_pace").notNull(),
  z3Pace: text("z3_pace").notNull(),
  z4Pace: text("z4_pace").notNull(),
  z5Pace: text("z5_pace").notNull(),
  z6Pace: text("z6_pace").notNull(),
  z7Pace: text("z7_pace").notNull(),
}, (table) => [
  index("idx_matriz_vdot_segundos").on(table.segundosMin, table.segundosMax),
]);

export const treinosBlocos = sqliteTable("treinos_blocos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  distanciaAlvo: text("distancia_alvo", { enum: ["5k", "10k", "21k"] }).notNull(),
  semana: integer("semana").notNull(),
  sessao: text("sessao").notNull(),
  nomeSessao: text("nome_sessao").notNull(),
  descricaoTreino: text("descricao_treino").notNull(),
  zonaAlvo: text("zona_alvo").notNull(),
}, (table) => [
  uniqueIndex("idx_treinos_objetivo_semana_sessao").on(table.distanciaAlvo, table.semana, table.sessao),
]);

export const provas = sqliteTable("provas", {
  id: text("id").primaryKey(),
  idAluno: text("id_aluno").notNull().references(() => usuarios.idAluno, { onDelete: "cascade" }),
  nomeProva: text("nome_prova").notNull(),
  dataProva: text("data_prova").notNull(),
  distanciaKm: real("distancia_km").notNull(),
  tempoTotalSegundos: integer("tempo_total_segundos").notNull(),
  paceMedio: text("pace_medio").notNull(),
  sensacaoEsforco: integer("sensacao_esforco"),
  comentarios: text("comentarios"),
  criadoEm: text("criado_em").notNull(),
}, (table) => [
  index("idx_provas_aluno").on(table.idAluno),
  index("idx_provas_data").on(table.dataProva),
]);

export const stravaConexoes = sqliteTable("strava_conexoes", {
  idAluno: text("id_aluno").primaryKey().references(() => usuarios.idAluno, { onDelete: "cascade" }),
  athleteId: text("athlete_id").notNull(),
  athleteName: text("athlete_name"),
  accessTokenEncrypted: text("access_token_encrypted").notNull(),
  refreshTokenEncrypted: text("refresh_token_encrypted").notNull(),
  expiresAt: integer("expires_at").notNull(),
  scopes: text("scopes").notNull(),
  conectadoEm: text("conectado_em").notNull(),
  atualizadoEm: text("atualizado_em").notNull(),
}, (table) => [
  uniqueIndex("idx_strava_conexoes_athlete").on(table.athleteId),
]);

export const treinosRealizados = sqliteTable("treinos_realizados", {
  id: text("id").primaryKey(),
  idAluno: text("id_aluno").notNull().references(() => usuarios.idAluno, { onDelete: "cascade" }),
  planoGeradoEm: text("plano_gerado_em").notNull(),
  semana: integer("semana").notNull(),
  sessao: integer("sessao").notNull(),
  origem: text("origem", { enum: ["manual", "strava"] }).notNull().default("manual"),
  stravaActivityId: text("strava_activity_id"),
  nomeAtividade: text("nome_atividade"),
  sportType: text("sport_type"),
  inicioEm: text("inicio_em"),
  movingTime: integer("moving_time"),
  elapsedTime: integer("elapsed_time"),
  distanciaMetros: real("distancia_metros"),
  velocidadeMedia: real("velocidade_media"),
  paceMedio: text("pace_medio"),
  concluidoEm: text("concluido_em").notNull(),
  criadoEm: text("criado_em").notNull(),
}, (table) => [
  uniqueIndex("idx_treinos_realizados_sessao").on(
    table.idAluno,
    table.planoGeradoEm,
    table.semana,
    table.sessao
  ),
  uniqueIndex("idx_treinos_realizados_strava").on(table.idAluno, table.stravaActivityId),
  index("idx_treinos_realizados_aluno_plano").on(table.idAluno, table.planoGeradoEm),
]);

export const mensagens = sqliteTable("mensagens", {
  id: text("id").primaryKey(),
  idAluno: text("id_aluno").notNull().references(() => usuarios.idAluno, { onDelete: "cascade" }),
  remetente: text("remetente", { enum: ["aluno", "professor"] }).notNull(),
  tipo: text("tipo", { enum: ["duvida", "avaliacao", "geral"] }).notNull().default("geral"),
  conteudo: text("conteudo").notNull(),
  lida: integer("lida", { mode: "boolean" }).notNull().default(false),
  criadoEm: text("criado_em").notNull(),
}, (table) => [
  index("idx_mensagens_aluno").on(table.idAluno),
  index("idx_mensagens_criado_em").on(table.criadoEm),
]);

export const assinaturasKiwify = sqliteTable("assinaturas_kiwify", {
  id: text("id").primaryKey(),
  idAluno: text("id_aluno").notNull().references(() => usuarios.idAluno, { onDelete: "cascade" }),
  kiwifyOrderId: text("kiwify_order_id"),
  kiwifySubscriptionId: text("kiwify_subscription_id"),
  kiwifyProductId: text("kiwify_product_id"),
  kiwifyPlanId: text("kiwify_plan_id"),
  planoNome: text("plano_nome").notNull().default("Assinatura FLEX"),
  status: text("status", {
    enum: ["active", "canceled", "overdue", "late", "refunded", "chargedback", "trialing", "unknown"],
  }).notNull().default("active"),
  precoCentavos: integer("preco_centavos"),
  dataInicio: text("data_inicio"),
  proximaCobranca: text("proxima_cobranca"),
  atualizadoEm: text("atualizado_em").notNull(),
}, (table) => [
  index("idx_assinaturas_aluno").on(table.idAluno),
  uniqueIndex("idx_assinaturas_kiwify_sub_id").on(table.kiwifySubscriptionId),
]);

export const kiwifyWebhookEvents = sqliteTable("kiwify_webhook_events", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  orderId: text("order_id"),
  subscriptionId: text("subscription_id"),
  processadoEm: text("processado_em").notNull(),
  sucesso: integer("sucesso", { mode: "boolean" }).notNull().default(true),
  mensagemErro: text("mensagem_erro"),
}, (table) => [
  index("idx_webhook_events_order").on(table.orderId),
  index("idx_webhook_events_sub").on(table.subscriptionId),
]);

export const tokensRecuperacaoSenha = sqliteTable("tokens_recuperacao_senha", {
  tokenHash: text("token_hash").primaryKey(),
  idAluno: text("id_aluno").notNull().references(() => usuarios.idAluno, { onDelete: "cascade" }),
  expiraEm: integer("expira_em").notNull(),
  usado: integer("usado", { mode: "boolean" }).notNull().default(false),
  criadoEm: integer("criado_em").notNull(),
}, (table) => [
  index("idx_recuperacao_aluno").on(table.idAluno),
  index("idx_recuperacao_expira").on(table.expiraEm),
]);

export type AssinaturaKiwifyRecord = typeof assinaturasKiwify.$inferSelect;
export type NovaAssinaturaKiwify = typeof assinaturasKiwify.$inferInsert;
export type KiwifyWebhookEventRecord = typeof kiwifyWebhookEvents.$inferSelect;
export type NovoKiwifyWebhookEvent = typeof kiwifyWebhookEvents.$inferInsert;
export type TokenRecuperacaoRecord = typeof tokensRecuperacaoSenha.$inferSelect;
export type NovoTokenRecuperacao = typeof tokensRecuperacaoSenha.$inferInsert;
