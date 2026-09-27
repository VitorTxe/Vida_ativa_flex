import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/backend/db";
import { mensagens, usuarios } from "@/backend/db/schema";

export type MessageSender = "aluno" | "professor";
export type MessageType = "duvida" | "avaliacao" | "geral";

export interface MessageItem {
  id: string;
  idAluno: string;
  remetente: MessageSender;
  tipo: MessageType;
  conteudo: string;
  lida: boolean;
  criadoEm: string;
}

export async function ensureMessagesInfrastructure(): Promise<void> {
  const db = getDb();
  try {
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS mensagens (
        id TEXT PRIMARY KEY NOT NULL,
        id_aluno TEXT NOT NULL REFERENCES usuarios(id_aluno) ON DELETE CASCADE,
        remetente TEXT NOT NULL,
        tipo TEXT NOT NULL DEFAULT 'geral',
        conteudo TEXT NOT NULL,
        lida INTEGER NOT NULL DEFAULT 0,
        criado_em TEXT NOT NULL
      )
    `);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_mensagens_aluno ON mensagens(id_aluno)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_mensagens_criado_em ON mensagens(criado_em)`);
  } catch (error: unknown) {
    console.error("Falha ao inicializar infraestrutura de mensagens:", error);
  }
}

export async function listStudentMessages(idAluno: string): Promise<MessageItem[]> {
  await ensureMessagesInfrastructure();
  const db = getDb();
  const rows = await db
    .select()
    .from(mensagens)
    .where(eq(mensagens.idAluno, idAluno))
    .orderBy(mensagens.criadoEm);

  return rows.map((row) => ({
    id: row.id,
    idAluno: row.idAluno,
    remetente: row.remetente as MessageSender,
    tipo: row.tipo as MessageType,
    conteudo: row.conteudo,
    lida: Boolean(row.lida),
    criadoEm: row.criadoEm,
  }));
}

export async function createNewMessage(params: {
  idAluno: string;
  remetente: MessageSender;
  tipo?: MessageType;
  conteudo: string;
}): Promise<MessageItem> {
  await ensureMessagesInfrastructure();
  const db = getDb();
  const id = crypto.randomUUID();
  const criadoEm = new Date().toISOString();
  const tipo = params.tipo ?? "geral";

  await db.insert(mensagens).values({
    id,
    idAluno: params.idAluno,
    remetente: params.remetente,
    tipo,
    conteudo: params.conteudo.trim(),
    lida: false,
    criadoEm,
  });

  return {
    id,
    idAluno: params.idAluno,
    remetente: params.remetente,
    tipo,
    conteudo: params.conteudo.trim(),
    lida: false,
    criadoEm,
  };
}

export async function markStudentMessagesAsRead(
  idAluno: string,
  forRecipient: MessageSender
): Promise<void> {
  await ensureMessagesInfrastructure();
  const db = getDb();
  // Se o leitor é o aluno, marca mensagens do professor. Se o leitor é o professor, marca mensagens do aluno.
  const targetSender = forRecipient === "aluno" ? "professor" : "aluno";
  await db
    .update(mensagens)
    .set({ lida: true })
    .where(and(eq(mensagens.idAluno, idAluno), eq(mensagens.remetente, targetSender)));
}

export async function getUnreadMessagesCount(
  idAluno: string,
  forRecipient: MessageSender
): Promise<number> {
  await ensureMessagesInfrastructure();
  const db = getDb();
  const targetSender = forRecipient === "aluno" ? "professor" : "aluno";
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(mensagens)
    .where(
      and(
        eq(mensagens.idAluno, idAluno),
        eq(mensagens.remetente, targetSender),
        eq(mensagens.lida, false)
      )
    );

  return Number(result?.count) || 0;
}

export async function getTotalUnreadForTeacher(): Promise<number> {
  await ensureMessagesInfrastructure();
  const db = getDb();
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(mensagens)
    .where(
      and(
        eq(mensagens.remetente, "aluno"),
        eq(mensagens.lida, false)
      )
    );

  return Number(result?.count) || 0;
}

