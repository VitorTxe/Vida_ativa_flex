CREATE TABLE `matriz_vdot` (
	`tempo_3k_texto` text PRIMARY KEY NOT NULL,
	`segundos_min` integer NOT NULL,
	`segundos_max` integer NOT NULL,
	`vdot` real NOT NULL,
	`z1_pace` text NOT NULL,
	`z2_pace` text NOT NULL,
	`z3_pace` text NOT NULL,
	`z4_pace` text NOT NULL,
	`z5_pace` text NOT NULL,
	`z6_pace` text NOT NULL,
	`z7_pace` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_matriz_vdot_segundos` ON `matriz_vdot` (`segundos_min`,`segundos_max`);--> statement-breakpoint
CREATE TABLE `treinos_blocos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`distancia_alvo` text NOT NULL,
	`semana` integer NOT NULL,
	`sessao` text NOT NULL,
	`nome_sessao` text NOT NULL,
	`descricao_treino` text NOT NULL,
	`zona_alvo` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_treinos_objetivo_semana_sessao` ON `treinos_blocos` (`distancia_alvo`,`semana`,`sessao`);--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id_aluno` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`email` text NOT NULL,
	`status_pagamento` text DEFAULT 'Ativo' NOT NULL,
	`objetivo` text DEFAULT '10k' NOT NULL,
	`minutos_teste` integer,
	`segundos_teste` integer,
	`total_segundos` integer,
	`data_ultimo_teste` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_usuarios_email` ON `usuarios` (`email`);
--> statement-breakpoint
PRAGMA optimize;
