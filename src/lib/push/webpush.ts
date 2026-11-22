/**
 * Standards-based Web Push (RFC 8030) with VAPID (RFC 8292) and message
 * encryption (RFC 8291, aes128gcm). Uses only node:crypto and fetch — no
 * third-party service or package. Works with Apple (iPhone/iPad Home Screen
 * apps, Safari), Google (Chrome/Android), Mozilla and Microsoft push services.
 */
import { createCipheriv, createECDH, createHmac, createPrivateKey, randomBytes, sign } from "node:crypto";

export type PushTarget = { endpoint: string; p256dh: string; auth: string };
export type VapidKeys = { publicKey: string; privateKey: string; subject: string };
export type PushResult = { ok: true; status: number } | { ok: false; status: number; gone: boolean; retry: boolean };

export const b64u = (b: Buffer | Uint8Array) => Buffer.from(b).toString("base64url");
export const fromB64u = (s: string) => Buffer.from(s, "base64url");

/** Only real push services may be contacted (prevents abuse of the server as a request relay). */
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^android\.googleapis\.com$/, /(^|\.)push\.apple\.com$/, /^updates\.push\.services\.mozilla\.com$/, /(^|\.)notify\.windows\.com$/, /(^|\.)push\.services\.mozilla\.com$/];

export function isAllowedEndpoint(endpoint: string): boolean {
  try {
    const u = new URL(endpoint);
    return u.protocol === "https:" && !u.port && PUSH_HOSTS.some((r) => r.test(u.hostname)) && endpoint.length <= 1000;
  } catch {
    return false;
  }
}

function hkdf(salt: Buffer, ikm: Buffer, info: Buffer, len: number): Buffer {
  const prk = createHmac("sha256", salt).update(ikm).digest();
  return createHmac("sha256", prk).update(Buffer.concat([info, Buffer.from([1])])).digest().subarray(0, len);
}

/** RFC 8291 encryption of one payload for one subscription (single record). */
export function encryptPayload(payload: Buffer, uaPublicB64: string, authB64: string, opts: { salt?: Buffer; serverKey?: ReturnType<typeof createECDH> } = {}): Buffer {
  const uaPublic = fromB64u(uaPublicB64);
  const authSecret = fromB64u(authB64);
  if (uaPublic.length !== 65 || authSecret.length !== 16) throw new Error("invalid subscription keys");
  const ecdh = opts.serverKey ?? createECDH("prime256v1");
  if (!opts.serverKey) ecdh.generateKeys();
  const asPublic = ecdh.getPublicKey();
  const shared = ecdh.computeSecret(uaPublic);
  const salt = opts.salt ?? randomBytes(16);
  const keyInfo = Buffer.concat([Buffer.from("WebPush: info\0"), uaPublic, asPublic]);
  const ikm = hkdf(authSecret, shared, keyInfo, 32);
  const cek = hkdf(salt, ikm, Buffer.from("Content-Encoding: aes128gcm\0"), 16);
  const nonce = hkdf(salt, ikm, Buffer.from("Content-Encoding: nonce\0"), 12);
  const cipher = createCipheriv("aes-128-gcm", cek, nonce);
  const body = Buffer.concat([cipher.update(Buffer.concat([payload, Buffer.from([2])])), cipher.final(), cipher.getAuthTag()]);
  const rs = Buffer.alloc(4);
  rs.writeUInt32BE(4096);
  return Buffer.concat([salt, rs, Buffer.from([asPublic.length]), asPublic, body]);
}

/** VAPID JWT (ES256) for the push service origin. */
export function vapidAuthorization(endpoint: string, keys: VapidKeys, now = Date.now()): string {
  const pub = fromB64u(keys.publicKey);
  if (pub.length !== 65) throw new Error("invalid VAPID public key");
  const key = createPrivateKey({
    key: { kty: "EC", crv: "P-256", d: keys.privateKey, x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)) },
    format: "jwk",
  });
  const header = b64u(Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = b64u(Buffer.from(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(now / 1000) + 12 * 3600, sub: keys.subject })));
  const sig = sign("sha256", Buffer.from(`${header}.${claims}`), { key, dsaEncoding: "ieee-p1363" });
  return `vapid t=${header}.${claims}.${b64u(sig)}, k=${keys.publicKey}`;
}

/** Sends one encrypted message. Never throws for HTTP errors; reports whether to retry or drop the subscription. */
export async function sendPush(target: PushTarget, payload: object, keys: VapidKeys, opts: { ttl?: number; urgency?: "normal" | "high"; topic?: string } = {}): Promise<PushResult> {
  if (!isAllowedEndpoint(target.endpoint)) return { ok: false, status: 0, gone: true, retry: false };
  const body = encryptPayload(Buffer.from(JSON.stringify(payload)), target.p256dh, target.auth);
  const headers: Record<string, string> = {
    "Content-Encoding": "aes128gcm",
    "Content-Type": "application/octet-stream",
    TTL: String(opts.ttl ?? 24 * 3600),
    Urgency: opts.urgency ?? "high",
    Authorization: vapidAuthorization(target.endpoint, keys),
  };
  if (opts.topic) headers.Topic = opts.topic.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 32);
  try {
    const res = await fetch(target.endpoint, { method: "POST", headers, body: new Uint8Array(body), signal: AbortSignal.timeout(10_000) });
    if (res.status >= 200 && res.status < 300) return { ok: true, status: res.status };
    return { ok: false, status: res.status, gone: res.status === 404 || res.status === 410, retry: res.status === 429 || res.status >= 500 };
  } catch {
    return { ok: false, status: 0, gone: false, retry: true };
  }
}

/** New VAPID key pair (run once: `node scripts/vapid-keys.mjs`). */
export function generateVapidKeys(): { publicKey: string; privateKey: string } {
  const ecdh = createECDH("prime256v1");
  ecdh.generateKeys();
  return { publicKey: b64u(ecdh.getPublicKey()), privateKey: b64u(ecdh.getPrivateKey()) };
}
