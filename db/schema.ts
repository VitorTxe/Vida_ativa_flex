import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const usuarios = sqliteTable("usuarios", {
  idAluno: text("id_aluno").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  senhaHash: text("senha_hash"),
  statusPagamento: text("status_pagamento", { enum: ["Ativo", "Inativo"] }).notNull().default("Ativo"),
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
