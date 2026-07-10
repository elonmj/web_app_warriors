const COOKIE_NAME = "admin_session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "admin";
}

function toBase64Url(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toBase64Url(signature);
}

/** Creates a signed session token encoding an expiry timestamp. */
export async function createSessionToken(): Promise<{ token: string; maxAgeSeconds: number }> {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = String(expiresAt);
  const signature = await sign(payload);
  return { token: `${payload}.${signature}`, maxAgeSeconds: SESSION_DURATION_MS / 1000 };
}

/** Verifies a session token's signature and expiry. */
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const expectedSignature = await sign(payload);
  return expectedSignature === signature;
}

export const ADMIN_SESSION_COOKIE = COOKIE_NAME;
