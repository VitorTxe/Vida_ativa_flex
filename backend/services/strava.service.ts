import { eq } from "drizzle-orm";
import { getDb } from "@/backend/db";
import { stravaConexoes } from "@/backend/db/schema";

const STRAVA_API_BASE_URL = "https://www.strava.com/api/v3";
const STRAVA_OAUTH_BASE_URL = "https://www.strava.com/oauth";
const TOKEN_REFRESH_MARGIN_SECONDS = 5 * 60;

export class StravaConfigurationError extends Error {}
export class StravaNotConnectedError extends Error {}
export class StravaApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

export interface StravaTokenResponse {
  token_type: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  scope?: string;
  athlete?: {
    id: number | string;
    firstname?: string;
    lastname?: string;
    username?: string;
  };
}

export interface StravaActivityPayload {
  id: number | string;
  name: string;
  sport_type?: string;
  type?: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  average_speed?: number;
  start_date: string;
  start_date_local: string;
  trainer?: boolean;
}

export function getStravaClientId(): string {
  return requireEnv("STRAVA_CLIENT_ID");
}

export function getStravaClientSecret(): string {
  return requireEnv("STRAVA_CLIENT_SECRET");
}

export function getStravaRedirectUri(requestUrl: string): string {
  const configured = process.env.STRAVA_REDIRECT_URI?.trim();
  return configured || new URL("/api/strava/callback", requestUrl).toString();
}

export async function exchangeAuthorizationCode(code: string, redirectUri: string): Promise<StravaTokenResponse> {
  return requestToken({
    client_id: getStravaClientId(),
    client_secret: getStravaClientSecret(),
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });
}

export async function saveStravaConnection(
  idAluno: string,
  token: StravaTokenResponse,
  fallbackScope: string
): Promise<void> {
  if (!token.athlete?.id) throw new StravaApiError("O Strava não retornou o atleta autenticado.", 502);

  const scopes = token.scope || fallbackScope;
  if (!hasActivityReadScope(scopes)) {
    throw new StravaApiError("Autorize a leitura de atividades para continuar.", 403);
  }

  const athleteName = [token.athlete.firstname, token.athlete.lastname].filter(Boolean).join(" ").trim()
    || token.athlete.username
    || null;
  const now = new Date().toISOString();
  const values = {
    idAluno,
    athleteId: String(token.athlete.id),
    athleteName,
    accessTokenEncrypted: await encryptToken(token.access_token),
    refreshTokenEncrypted: await encryptToken(token.refresh_token),
    expiresAt: token.expires_at,
    scopes,
    conectadoEm: now,
    atualizadoEm: now,
  };

  await getDb().insert(stravaConexoes).values(values).onConflictDoUpdate({
    target: stravaConexoes.idAluno,
    set: {
      athleteId: values.athleteId,
      athleteName: values.athleteName,
      accessTokenEncrypted: values.accessTokenEncrypted,
      refreshTokenEncrypted: values.refreshTokenEncrypted,
      expiresAt: values.expiresAt,
      scopes: values.scopes,
      atualizadoEm: values.atualizadoEm,
    },
  });
}

export async function getValidStravaAccessToken(idAluno: string): Promise<string> {
  const db = getDb();
  const [connection] = await db
    .select()
    .from(stravaConexoes)
    .where(eq(stravaConexoes.idAluno, idAluno))
    .limit(1);

  if (!connection) throw new StravaNotConnectedError("Conecte sua conta Strava para continuar.");

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (connection.expiresAt > nowSeconds + TOKEN_REFRESH_MARGIN_SECONDS) {
    return decryptToken(connection.accessTokenEncrypted);
  }

  const refreshToken = await decryptToken(connection.refreshTokenEncrypted);
  const refreshed = await requestToken({
    client_id: getStravaClientId(),
    client_secret: getStravaClientSecret(),
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const updatedAt = new Date().toISOString();
  await db.update(stravaConexoes).set({
    accessTokenEncrypted: await encryptToken(refreshed.access_token),
    refreshTokenEncrypted: await encryptToken(refreshed.refresh_token),
    expiresAt: refreshed.expires_at,
    scopes: refreshed.scope || connection.scopes,
    atualizadoEm: updatedAt,
  }).where(eq(stravaConexoes.idAluno, idAluno));

  return refreshed.access_token;
}

export async function listStravaActivities(
  idAluno: string,
  options: { after?: number; before?: number; page?: number; perPage?: number } = {}
): Promise<StravaActivityPayload[]> {
  const accessToken = await getValidStravaAccessToken(idAluno);
  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    per_page: String(Math.min(options.perPage ?? 30, 50)),
  });
  if (options.after) params.set("after", String(options.after));
  if (options.before) params.set("before", String(options.before));

  return stravaFetch<StravaActivityPayload[]>(`/athlete/activities?${params.toString()}`, accessToken);
}

export async function getStravaActivity(idAluno: string, activityId: string): Promise<StravaActivityPayload> {
  const accessToken = await getValidStravaAccessToken(idAluno);
  return stravaFetch<StravaActivityPayload>(`/activities/${encodeURIComponent(activityId)}`, accessToken);
}

export async function revokeStravaAccess(accessToken: string): Promise<void> {
  const credentials = `${getStravaClientId()}:${getStravaClientSecret()}`;
  const response = await fetch(`${STRAVA_OAUTH_BASE_URL}/revoke`, {
    method: "POST",
    headers: {
      authorization: `Basic ${encodeBase64(credentials)}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ token: accessToken, token_type_hint: "access_token" }),
  });
  if (!response.ok) {
    throw new StravaApiError("Não foi possível revogar o acesso no Strava.", response.status);
  }
}

export function hasActivityReadScope(scopes: string): boolean {
  const scopeSet = new Set(scopes.split(/[\s,]+/).filter(Boolean));
  return scopeSet.has("activity:read") || scopeSet.has("activity:read_all");
}

export function calculatePace(movingTime: number, distanceMeters: number): string | null {
  if (movingTime <= 0 || distanceMeters <= 0) return null;
  const secondsPerKm = movingTime / (distanceMeters / 1000);
  let minutes = Math.floor(secondsPerKm / 60);
  let seconds = Math.round(secondsPerKm % 60);
  if (seconds === 60) {
    minutes += 1;
    seconds = 0;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}/km`;
}

async function stravaFetch<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${STRAVA_API_BASE_URL}${path}`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) {
    const message = response.status === 401
      ? "A autorização do Strava expirou. Reconecte sua conta."
      : response.status === 429
        ? "O limite temporário do Strava foi atingido. Tente novamente em alguns minutos."
        : "O Strava não conseguiu atender à solicitação.";
    throw new StravaApiError(message, response.status);
  }
  return response.json() as Promise<T>;
}

async function requestToken(params: Record<string, string>): Promise<StravaTokenResponse> {
  const response = await fetch(`${STRAVA_OAUTH_BASE_URL}/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new StravaApiError("Não foi possível concluir a autorização com o Strava.", response.status);
  }
  return response.json() as Promise<StravaTokenResponse>;
}

async function encryptToken(value: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(value)
  );
  return `v1.${bytesToBase64Url(iv)}.${bytesToBase64Url(new Uint8Array(encrypted))}`;
}

async function decryptToken(payload: string): Promise<string> {
  const [version, ivEncoded, cipherEncoded] = payload.split(".");
  if (version !== "v1" || !ivEncoded || !cipherEncoded) {
    throw new StravaConfigurationError("Token do Strava armazenado em formato inválido.");
  }
  const key = await getEncryptionKey();
  const iv = base64UrlToBytes(ivEncoded);
  const cipher = base64UrlToBytes(cipherEncoded);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    cipher.buffer as ArrayBuffer
  );
  return new TextDecoder().decode(decrypted);
}

async function getEncryptionKey(): Promise<CryptoKey> {
  const secret = requireEnv("STRAVA_TOKEN_ENCRYPTION_KEY");
  const rawKey = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", rawKey, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new StravaConfigurationError(`Configure a variável ${name}.`);
  return value;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
