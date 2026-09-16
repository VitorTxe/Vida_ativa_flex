CREATE TABLE `sessoes` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`id_aluno` text NOT NULL,
	`criado_em` integer NOT NULL,
	`expira_em` integer NOT NULL,
	FOREIGN KEY (`id_aluno`) REFERENCES `usuarios`(`id_aluno`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_sessoes_aluno` ON `sessoes` (`id_aluno`);--> statement-breakpoint
CREATE INDEX `idx_sessoes_expiracao` ON `sessoes` (`expira_em`);--> statement-breakpoint
ALTER TABLE `usuarios` ADD `senha_hash` text;
--> statement-breakpoint
PRAGMA optimize;
