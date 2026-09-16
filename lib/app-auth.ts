import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { sessoes, usuarios } from "@/db/schema";

export const SESSION_COOKIE = "flex_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export type AppUser = {
  idAluno: string;
  nome: string;
  email: string;
  statusPagamento: "Ativo" | "Inativo";
  objetivo: "5k" | "10k" | "21k" | "42k";
};

export async function createSession(idAluno: string): Promise<{ token: string; expires: Date }> {
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
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = await digestToken(token);
  const now = Date.now();
  const db = getDb();
  const [row] = await db
    .select({
      idAluno: usuarios.idAluno,
      nome: usuarios.nome,
      email: usuarios.email,
      statusPagamento: usuarios.statusPagamento,
      objetivo: usuarios.objetivo,
    })
    .from(sessoes)
    .innerJoin(usuarios, eq(sessoes.idAluno, usuarios.idAluno))
    .where(and(eq(sessoes.tokenHash, tokenHash), gt(sessoes.expiraEm, now)))
    .limit(1);

  if (!row || row.statusPagamento !== "Ativo") return null;
  return row;
}

export async function destroyCurrentSession(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return;
  const tokenHash = await digestToken(token);
  await getDb().delete(sessoes).where(eq(sessoes.tokenHash, tokenHash));
}

export function sessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
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
