/**
 * Generates the Web Push (VAPID) key pair for Agenda notifications. Run once:
 *
 *   node scripts/vapid-keys.mjs
 *
 * Put the three lines in the hosting environment variables (Hostinger →
 * Node.js app → Environment variables), never in the repository:
 *   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
 * Changing the keys later means every device must switch notifications on again.
 */
import { createECDH } from "node:crypto";

const ecdh = createECDH("prime256v1");
ecdh.generateKeys();
console.log(`VAPID_PUBLIC_KEY=${ecdh.getPublicKey().toString("base64url")}`);
console.log(`VAPID_PRIVATE_KEY=${ecdh.getPrivateKey().toString("base64url")}`);
console.log("VAPID_SUBJECT=mailto:hello@glowbydilek.nl");
