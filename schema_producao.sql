-- ============================================================
-- SCHEMA DE PRODUÇÃO DO VIDA ATIVA - FLEX (Cloudflare D1)
-- ============================================================

CREATE TABLE IF NOT EXISTS usuarios (
  id_aluno TEXT PRIMARY KEY NOT NULL,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  senha_hash TEXT,
  status_pagamento TEXT NOT NULL DEFAULT 'Ativo',
  role TEXT NOT NULL DEFAULT 'aluno',
  objetivo TEXT NOT NULL DEFAULT '10k',
  minutos_teste INTEGER,
  segundos_teste INTEGER,
  total_segundos INTEGER,
  data_ultimo_teste TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

CREATE TABLE IF NOT EXISTS sessoes (
  token_hash TEXT PRIMARY KEY NOT NULL,
  id_aluno TEXT NOT NULL REFERENCES usuarios(id_aluno) ON DELETE CASCADE,
  criado_em INTEGER NOT NULL,
  expira_em INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessoes_aluno ON sessoes(id_aluno);
CREATE INDEX IF NOT EXISTS idx_sessoes_expiracao ON sessoes(expira_em);

CREATE TABLE IF NOT EXISTS perfis_corrida (
  id_aluno TEXT PRIMARY KEY NOT NULL REFERENCES usuarios(id_aluno) ON DELETE CASCADE,
  idade INTEGER NOT NULL DEFAULT 30,
  peso_kg REAL NOT NULL DEFAULT 70,
  altura_cm INTEGER NOT NULL DEFAULT 170,
  ja_corre INTEGER,
  tempo_corrida_meses INTEGER,
  treinos_por_semana INTEGER NOT NULL DEFAULT 3,
  nivel_experiencia TEXT,
  foco_principal TEXT,
  distancia_alvo TEXT,
  dias_preferenciais TEXT,
  terreno_principal TEXT,
  tipo_teste TEXT,
  tempo_segundos_informado INTEGER,
  concluido_em TEXT,
  atualizado_em TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS planos_ia (
  id_aluno TEXT PRIMARY KEY NOT NULL REFERENCES usuarios(id_aluno) ON DELETE CASCADE,
  modelo TEXT NOT NULL,
  plano_json TEXT NOT NULL,
  gerado_em TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS matriz_vdot (
  tempo_3k_texto TEXT PRIMARY KEY NOT NULL,
  segundos_min INTEGER NOT NULL,
  segundos_max INTEGER NOT NULL,
  vdot REAL NOT NULL,
  z1_pace TEXT NOT NULL,
  z2_pace TEXT NOT NULL,
  z3_pace TEXT NOT NULL,
  z4_pace TEXT NOT NULL,
  z5_pace TEXT NOT NULL,
  z6_pace TEXT NOT NULL,
  z7_pace TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_matriz_vdot_segundos ON matriz_vdot(segundos_min, segundos_max);

CREATE TABLE IF NOT EXISTS treinos_blocos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  distancia_alvo TEXT NOT NULL,
  semana INTEGER NOT NULL,
  sessao TEXT NOT NULL,
  nome_sessao TEXT NOT NULL,
  descricao_treino TEXT NOT NULL,
  zona_alvo TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_treinos_objetivo_semana_sessao ON treinos_blocos(distancia_alvo, semana, sessao);

CREATE TABLE IF NOT EXISTS provas (
  id TEXT PRIMARY KEY NOT NULL,
  id_aluno TEXT NOT NULL REFERENCES usuarios(id_aluno) ON DELETE CASCADE,
  nome_prova TEXT NOT NULL,
  data_prova TEXT NOT NULL,
  distancia_km REAL NOT NULL,
  tempo_total_segundos INTEGER NOT NULL,
  pace_medio TEXT NOT NULL,
  sensacao_esforco INTEGER,
  comentarios TEXT,
  criado_em TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_provas_aluno ON provas(id_aluno);
CREATE INDEX IF NOT EXISTS idx_provas_data ON provas(data_prova);

CREATE TABLE IF NOT EXISTS strava_conexoes (
  id_aluno TEXT PRIMARY KEY NOT NULL REFERENCES usuarios(id_aluno) ON DELETE CASCADE,
  athlete_id TEXT NOT NULL,
  athlete_name TEXT,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  scopes TEXT NOT NULL,
  conectado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_strava_conexoes_athlete ON strava_conexoes(athlete_id);

CREATE TABLE IF NOT EXISTS treinos_realizados (
  id TEXT PRIMARY KEY NOT NULL,
  id_aluno TEXT NOT NULL REFERENCES usuarios(id_aluno) ON DELETE CASCADE,
  plano_gerado_em TEXT NOT NULL,
  semana INTEGER NOT NULL,
  sessao INTEGER NOT NULL,
  origem TEXT NOT NULL DEFAULT 'manual',
  strava_activity_id TEXT,
  nome_atividade TEXT,
  sport_type TEXT,
  inicio_em TEXT,
  moving_time INTEGER,
  elapsed_time INTEGER,
  distancia_metros REAL,
  velocidade_media REAL,
  pace_medio TEXT,
  concluido_em TEXT NOT NULL,
  criado_em TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_treinos_realizados_sessao
  ON treinos_realizados(id_aluno, plano_gerado_em, semana, sessao);
CREATE UNIQUE INDEX IF NOT EXISTS idx_treinos_realizados_strava
  ON treinos_realizados(id_aluno, strava_activity_id);
CREATE INDEX IF NOT EXISTS idx_treinos_realizados_aluno_plano
  ON treinos_realizados(id_aluno, plano_gerado_em);

CREATE TABLE IF NOT EXISTS mensagens (
  id TEXT PRIMARY KEY NOT NULL,
  id_aluno TEXT NOT NULL REFERENCES usuarios(id_aluno) ON DELETE CASCADE,
  remetente TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'geral',
  conteudo TEXT NOT NULL,
  lida INTEGER NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mensagens_aluno ON mensagens(id_aluno);
CREATE INDEX IF NOT EXISTS idx_mensagens_criado_em ON mensagens(criado_em);
