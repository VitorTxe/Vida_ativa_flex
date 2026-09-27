import { and, eq, gt, lt, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/backend/db";
import { sessoes, usuarios } from "@/backend/db/schema";
import type { AppUser, CookieOptions, SessionTokenPayload } from "@/backend/types";

export const SESSION_COOKIE = "flex_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

let roleColumnEnsured = false;
export async function ensureUsersRoleInfrastructure(): Promise<void> {
  if (roleColumnEnsured) return;
  const db = getDb();
  try {
    await db.run(sql`ALTER TABLE usuarios ADD COLUMN role TEXT NOT NULL DEFAULT 'aluno'`);
  } catch {
    // Coluna já existe ou já foi adicionada
  }
  roleColumnEnsured = true;
}

export async function createSession(idAluno: string): Promise<SessionTokenPayload> {
  await ensureUsersRoleInfrastructure();
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = toBase64Url(tokenBytes);
  const tokenHash = await digestToken(token);
  const now = Date.now();
  const expires = new Date(now + SESSION_DURATION_MS);
  const db = getDb();
  await db.delete(sessoes).where(lt(sessoes.expiraEm, now));
  await db.insert(sessoes).values({
    tokenHash,
    idAluno,
    criadoEm: now,
    expiraEm: expires.getTime(),
  });
  return { token, expires };
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  await ensureUsersRoleInfrastructure();
  const tokenHash = await digestToken(token);
  const now = Date.now();
  const db = getDb();
  try {
    const [row] = await db
      .select({
        idAluno: usuarios.idAluno,
        nome: usuarios.nome,
        email: usuarios.email,
        role: usuarios.role,
        statusPagamento: usuarios.statusPagamento,
        objetivo: usuarios.objetivo,
      })
      .from(sessoes)
      .innerJoin(usuarios, eq(sessoes.idAluno, usuarios.idAluno))
      .where(and(eq(sessoes.tokenHash, tokenHash), gt(sessoes.expiraEm, now)))
      .limit(1);

    if (!row || row.statusPagamento !== "Ativo") return null;

    // Bootstrap resiliente: se não houver nenhum professor ou email coincidir com ADMIN_EMAIL
    const configuredAdmin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const matchesConfigured = configuredAdmin && row.email.toLowerCase() === configuredAdmin;

    if (row.role !== "professor") {
      const [hasAnyProfessor] = await db
        .select({ id: usuarios.idAluno })
        .from(usuarios)
        .where(eq(usuarios.role, "professor"))
        .limit(1);

      if (!hasAnyProfessor || matchesConfigured) {
        await db.update(usuarios).set({ role: "professor" }).where(eq(usuarios.idAluno, row.idAluno));
        row.role = "professor";
      }
    }

    return row as AppUser;
  } catch (err: unknown) {
    console.error("[Auth Service Error] Falha na consulta de sessão ou esquema de usuário:", err);
    return null;
  }
}

export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return;
  const tokenHash = await digestToken(token);
  await getDb().delete(sessoes).where(eq(sessoes.tokenHash, tokenHash));
}

export function sessionCookieOptions(expires: Date): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  };
}

async function digestToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
