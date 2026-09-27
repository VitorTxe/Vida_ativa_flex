CREATE TABLE `strava_conexoes` (
	`id_aluno` text PRIMARY KEY NOT NULL,
	`athlete_id` text NOT NULL,
	`athlete_name` text,
	`access_token_encrypted` text NOT NULL,
	`refresh_token_encrypted` text NOT NULL,
	`expires_at` integer NOT NULL,
	`scopes` text NOT NULL,
	`conectado_em` text NOT NULL,
	`atualizado_em` text NOT NULL,
	FOREIGN KEY (`id_aluno`) REFERENCES `usuarios`(`id_aluno`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_strava_conexoes_athlete` ON `strava_conexoes` (`athlete_id`);--> statement-breakpoint
CREATE TABLE `treinos_realizados` (
	`id` text PRIMARY KEY NOT NULL,
	`id_aluno` text NOT NULL,
	`plano_gerado_em` text NOT NULL,
	`semana` integer NOT NULL,
	`sessao` integer NOT NULL,
	`origem` text DEFAULT 'manual' NOT NULL,
	`strava_activity_id` text,
	`nome_atividade` text,
	`sport_type` text,
	`inicio_em` text,
	`moving_time` integer,
	`elapsed_time` integer,
	`distancia_metros` real,
	`velocidade_media` real,
	`pace_medio` text,
	`concluido_em` text NOT NULL,
	`criado_em` text NOT NULL,
	FOREIGN KEY (`id_aluno`) REFERENCES `usuarios`(`id_aluno`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_treinos_realizados_sessao` ON `treinos_realizados` (`id_aluno`,`plano_gerado_em`,`semana`,`sessao`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_treinos_realizados_strava` ON `treinos_realizados` (`id_aluno`,`strava_activity_id`);--> statement-breakpoint
CREATE INDEX `idx_treinos_realizados_aluno_plano` ON `treinos_realizados` (`id_aluno`,`plano_gerado_em`);
