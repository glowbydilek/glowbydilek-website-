import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import type { DB } from "../db/client";
import { audit } from "../db/audit";
import { passwordResetTokens, users } from "../db/schema";
import { getSetting, setSetting } from "../db/settings";
import { cleanDelegations, ROLES, type Perm, type Role } from "./permissions";
import { randomToken, sha256 } from "./crypto";
import { revokeAllSessions } from "./service";
import { USER_PERMISSIONS_SETTING } from "./session";

/** Invitations stay valid for 48 hours (a normal reset link: 15 minutes). */
export const INVITE_TTL_MS = 48 * 3600_000;

export type StaffRow = {
  id: number;
  email: string;
  name: string;
  role: string;
  disabled: boolean;
  mfaEnabled: boolean;
  hasPassword: boolean;
  lastLoginAt: Date | null;
  delegations: Perm[];
};

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,180}\.[a-z]{2,}$/i;
type Assignable = Exclude<Role, "owner">;
const assignable = (r: unknown): r is Assignable => r !== "owner" && (ROLES as readonly string[]).includes(String(r));

async function delegationMap(db: DB): Promise<Record<string, unknown>> {
  return getSetting(db, USER_PERMISSIONS_SETTING, {} as Record<string, unknown>);
}

export async function listStaff(db: DB): Promise<StaffRow[]> {
  const [rows, map] = await Promise.all([db.select().from(users), delegationMap(db)]);
  return rows
    .map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      disabled: u.disabled,
      mfaEnabled: u.mfaEnabled,
      hasPassword: Boolean(u.passwordHash),
      lastLoginAt: u.lastLoginAt,
      delegations: u.role === "owner" ? [] : cleanDelegations(u.role as Assignable, map[String(u.id)]),
    }))
    .sort((a, b) => (a.role === "owner" ? -1 : b.role === "owner" ? 1 : a.name.localeCompare(b.name)));
}

async function setDelegations(db: DB, userId: number, role: Assignable, input: unknown, byId: number) {
  const map = await delegationMap(db);
  map[String(userId)] = cleanDelegations(role, input);
  await setSetting(db, USER_PERMISSIONS_SETTING, map, byId);
}

/** Only non-owner accounts can be changed here, and never your own. */
async function target(db: DB, id: number, byId: number) {
  const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!u) throw new StaffError("Dit account bestaat niet.");
  if (u.role === "owner" || u.id === byId) throw new StaffError("Het eigenaarsaccount kan hier niet worden gewijzigd.");
  return u;
}

export class StaffError extends Error {}

/** Creates an account without password and returns a one-time invitation token (48 h). */
export async function inviteStaff(db: DB, input: { email: string; name: string; role: unknown; delegations: unknown }, byId: number) {
  const email = input.email.trim().toLowerCase().slice(0, 190);
  const name = input.name.trim().slice(0, 120);
  if (!EMAIL.test(email)) throw new StaffError("Vul een geldig e-mailadres in.");
  if (!name) throw new StaffError("Vul een naam in.");
  if (!assignable(input.role)) throw new StaffError("Kies een rol.");
  const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (exists) throw new StaffError("Er bestaat al een account met dit e-mailadres.");
  await db.insert(users).values({ email, name, role: input.role });
  const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  await setDelegations(db, u.id, input.role, input.delegations, byId);
  const token = await issueInvite(db, u.id);
  await audit(db, { userId: byId, action: "staff.invited", entity: "user", entityId: u.id, details: { role: input.role } });
  return { user: u, token };
}

/** New invitation link (the previous one stops working). */
export async function issueInvite(db: DB, userId: number, now = new Date()) {
  await db.update(passwordResetTokens).set({ usedAt: now }).where(and(eq(passwordResetTokens.userId, userId), isNull(passwordResetTokens.usedAt)));
  const token = randomToken();
  await db.insert(passwordResetTokens).values({ userId, tokenHash: sha256(token), expiresAt: new Date(now.getTime() + INVITE_TTL_MS), createdAt: now });
  return token;
}

export async function reinviteStaff(db: DB, id: number, byId: number) {
  const u = await target(db, id, byId);
  if (u.disabled) throw new StaffError("Zet het account eerst weer aan.");
  const token = await issueInvite(db, u.id);
  await audit(db, { userId: byId, action: "staff.reinvited", entity: "user", entityId: u.id });
  return { user: u, token };
}

export async function updateStaff(db: DB, id: number, input: { name: string; role: unknown; delegations: unknown }, byId: number) {
  const u = await target(db, id, byId);
  if (!assignable(input.role)) throw new StaffError("Kies een rol.");
  const name = input.name.trim().slice(0, 120) || u.name;
  await db.update(users).set({ name, role: input.role }).where(eq(users.id, u.id));
  await setDelegations(db, u.id, input.role, input.delegations, byId);
  // Rights changed: sign the person out everywhere so the new rights apply immediately.
  if (u.role !== input.role) await revokeAllSessions(db, u.id);
  await audit(db, { userId: byId, action: "staff.updated", entity: "user", entityId: u.id, details: { role: input.role, delegations: cleanDelegations(input.role, input.delegations) } });
}

export async function setStaffDisabled(db: DB, id: number, disabled: boolean, byId: number) {
  const u = await target(db, id, byId);
  await db.update(users).set({ disabled }).where(eq(users.id, u.id));
  if (disabled) await revokeAllSessions(db, u.id);
  await audit(db, { userId: byId, action: disabled ? "staff.disabled" : "staff.enabled", entity: "user", entityId: u.id });
}

export async function revokeStaffSessions(db: DB, id: number, byId: number) {
  const u = await target(db, id, byId);
  await revokeAllSessions(db, u.id);
  await audit(db, { userId: byId, action: "staff.sessions_revoked", entity: "user", entityId: u.id });
}
