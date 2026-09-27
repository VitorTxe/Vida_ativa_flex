CREATE TABLE `perfis_corrida` (
	`id_aluno` text PRIMARY KEY NOT NULL,
	`idade` integer NOT NULL,
	`peso_kg` real NOT NULL,
	`altura_cm` integer NOT NULL,
	`ja_corre` integer NOT NULL,
	`tempo_corrida_meses` integer,
	`treinos_por_semana` integer NOT NULL,
	`concluido_em` text,
	`atualizado_em` text NOT NULL,
	FOREIGN KEY (`id_aluno`) REFERENCES `usuarios`(`id_aluno`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `planos_ia` (
	`id_aluno` text PRIMARY KEY NOT NULL,
	`modelo` text NOT NULL,
	`plano_json` text NOT NULL,
	`gerado_em` text NOT NULL,
	FOREIGN KEY (`id_aluno`) REFERENCES `usuarios`(`id_aluno`) ON UPDATE no action ON DELETE cascade
);
