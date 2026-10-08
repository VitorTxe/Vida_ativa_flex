import { and, eq, gt, sql } from "drizzle-orm";
import { getDb } from "@/backend/db";
import { tokensRecuperacaoSenha } from "@/backend/db/schema";

const RESET_TOKEN_EXPIRATION_MS = 30 * 60 * 1000; // 30 minutos

let infrastructureEnsured = false;

export async function ensurePasswordResetInfrastructure(): Promise<void> {
  if (infrastructureEnsured) return;
  const db = getDb();
  try {
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS tokens_recuperacao_senha (
        token_hash TEXT PRIMARY KEY NOT NULL,
        id_aluno TEXT NOT NULL REFERENCES usuarios(id_aluno) ON DELETE CASCADE,
        expira_em INTEGER NOT NULL,
        usado INTEGER NOT NULL DEFAULT 0,
        criado_em INTEGER NOT NULL
      )
    `);
    await db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_recuperacao_aluno ON tokens_recuperacao_senha(id_aluno)
    `);
    await db.run(sql`
      CREATE INDEX IF NOT EXISTS idx_recuperacao_expira ON tokens_recuperacao_senha(expira_em)
    `);
  } catch (err: unknown) {
    console.warn("[Password Reset DDL Warning]:", err);
  }
  infrastructureEnsured = true;
}

export async function createPasswordResetToken(idAluno: string): Promise<string> {
  await ensurePasswordResetInfrastructure();
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const rawToken = Array.from(tokenBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  const tokenHash = await hashToken(rawToken);

  const now = Date.now();
  const expiraEm = now + RESET_TOKEN_EXPIRATION_MS;
  const db = getDb();

  await db.insert(tokensRecuperacaoSenha).values({
    tokenHash,
    idAluno,
    expiraEm,
    usado: false,
    criadoEm: now,
  });

  return rawToken;
}

export async function validateAndConsumeResetToken(rawToken: string): Promise<string | null> {
  if (!rawToken || typeof rawToken !== "string" || rawToken.length < 32) {
    return null;
  }

  await ensurePasswordResetInfrastructure();
  const tokenHash = await hashToken(rawToken);
  const now = Date.now();
  const db = getDb();

  const [record] = await db
    .select({
      tokenHash: tokensRecuperacaoSenha.tokenHash,
      idAluno: tokensRecuperacaoSenha.idAluno,
    })
    .from(tokensRecuperacaoSenha)
    .where(
      and(
        eq(tokensRecuperacaoSenha.tokenHash, tokenHash),
        eq(tokensRecuperacaoSenha.usado, false),
        gt(tokensRecuperacaoSenha.expiraEm, now)
      )
    )
    .limit(1);

  if (!record) {
    return null;
  }

  await db
    .update(tokensRecuperacaoSenha)
    .set({ usado: true })
    .where(eq(tokensRecuperacaoSenha.tokenHash, tokenHash));

  return record.idAluno;
}

async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
