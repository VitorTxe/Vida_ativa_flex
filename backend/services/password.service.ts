const ALGORITHM = "PBKDF2";
const HASH = "SHA-256";
// Cloudflare Workers caps a single PBKDF2 operation at 100,000 iterations.
const ITERATIONS = 100_000;
const SALT_BYTES = 16;
const KEY_BYTES = 32;
const PREFIX = "pbkdf2-sha256";
const encoder = new TextEncoder();

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const derived = await derive(password, salt, ITERATIONS);
  return `${PREFIX}$${ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(derived)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [prefix, iterationsText, saltText, hashText] = stored.split("$");
  const iterations = Number(iterationsText);
  if (prefix !== PREFIX || !Number.isInteger(iterations) || iterations < 100_000 || !saltText || !hashText) {
    return false;
  }

  try {
    const salt = fromBase64Url(saltText);
    const expected = fromBase64Url(hashText);
    const actual = await derive(password, salt, iterations);
    return constantTimeEqual(actual, expected);
  } catch {
    return false;
  }
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), ALGORITHM, false, ["deriveBits"]);
  const saltBuffer = salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer;
  const bits = await crypto.subtle.deriveBits(
    { name: ALGORITHM, hash: HASH, salt: saltBuffer, iterations },
    key,
    KEY_BYTES * 8,
  );
  return new Uint8Array(bits);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) mismatch |= a[index] ^ b[index];
  return mismatch === 0;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
