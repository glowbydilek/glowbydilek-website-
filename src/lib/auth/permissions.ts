/**
 * Roles and permissions (pure module: no database, used by tests and UI).
 *
 * Least privilege: every private page and action names the permission it
 * needs and the server checks it (requireCan / assertCan in session.ts).
 * Anything not mapped to a permission stays OWNER-ONLY (fail closed):
 * website settings, SEO, analytics, security, users, backups, legal texts,
 * invoice settings and payment configuration.
 *
 * - owner:   everything.
 * - manager: agenda + customers by default; more only when the owner
 *            delegates it (per person). Sensitive delegations (health data,
 *            finance, exports) also require two-step verification.
 * - staff:   the calendar and appointments, and the contact details needed
 *            for them. No website management, finance or health data unless
 *            the owner delegates intake access.
 * - editor:  draft website texts only (never publish, prices or settings).
 */
export const ROLES = ["owner", "manager", "staff", "editor"] as const;
export type Role = (typeof ROLES)[number];

export const PERMS = [
  "agenda.view",
  "agenda.manage",
  "hours.manage",
  "customers.view",
  "customers.manage",
  "customers.export",
  "health.view",
  "finance",
  "cms.edit",
  "cms.publish",
] as const;
export type Perm = (typeof PERMS)[number];

export const ROLE_LABEL: Record<Role, string> = { owner: "Eigenaar", manager: "Manager", staff: "Medewerker", editor: "Tekstschrijver" };

export const PERM_LABEL: Record<Perm, string> = {
  "agenda.view": "Agenda bekijken",
  "agenda.manage": "Afspraken maken, bevestigen, verzetten en annuleren",
  "hours.manage": "Werktijden en vrije dagen aanpassen",
  "customers.view": "Klantgegevens bekijken (naam, contact, afspraken)",
  "customers.manage": "Klantgegevens bewerken en samenvoegen",
  "customers.export": "Klantgegevens exporteren of verwijderen (AVG)",
  "health.view": "Intakeformulieren en gezondheidsinformatie",
  finance: "Financiën, facturen en uitgaven",
  "cms.edit": "Websiteteksten als concept bewerken",
  "cms.publish": "Behandelingen, prijzen en teksten publiceren",
};

const BASE: Record<Exclude<Role, "owner">, Perm[]> = {
  manager: ["agenda.view", "agenda.manage", "customers.view", "customers.manage"],
  staff: ["agenda.view", "agenda.manage", "customers.view"],
  editor: ["cms.edit"],
};

/** What the owner may additionally switch on per person. */
export const DELEGABLE: Record<Exclude<Role, "owner">, Perm[]> = {
  manager: ["hours.manage", "customers.export", "health.view", "finance", "cms.edit", "cms.publish"],
  staff: ["hours.manage", "health.view"],
  editor: [],
};

/** Delegations that only work with two-step verification switched on and passed. */
export const NEEDS_MFA: readonly Perm[] = ["health.view", "finance", "customers.export", "cms.publish"];

export function asRole(v: unknown): Role {
  return (ROLES as readonly string[]).includes(String(v)) ? (v as Role) : "staff";
}

/** Only delegations that are allowed for the role survive (input from the database or a form). */
export function cleanDelegations(role: Role, input: unknown): Perm[] {
  if (role === "owner") return [];
  const allowed = DELEGABLE[role];
  return Array.isArray(input) ? [...new Set(input.filter((p): p is Perm => allowed.includes(p as Perm)))] : [];
}

export type Principal = { role: string; mfa: boolean; delegations?: unknown };

/** Effective permissions of a signed-in person. Unknown roles get nothing. */
export function permissionsOf(p: Principal): Set<Perm> {
  if (p.role === "owner") return new Set(PERMS);
  if (!(ROLES as readonly string[]).includes(p.role)) return new Set();
  const role = p.role as Exclude<Role, "owner">;
  const extra = cleanDelegations(role, p.delegations).filter((x) => p.mfa || !NEEDS_MFA.includes(x));
  return new Set([...BASE[role], ...extra]);
}

export function can(p: Principal, perm: Perm): boolean {
  return permissionsOf(p).has(perm);
}

/** Agenda / admin pages and the permission each one needs (used for menus; pages also check themselves). */
export const AGENDA_PAGE_PERM: Record<string, Perm | "owner"> = {
  "/agenda": "agenda.view",
  "/agenda/kalender": "agenda.view",
  "/agenda/aanvragen": "agenda.view",
  "/agenda/afspraak/nieuw": "agenda.manage",
  "/agenda/klanten": "customers.view",
  "/agenda/intake": "health.view",
  "/agenda/financien": "finance",
  "/agenda/facturen": "finance",
  "/agenda/uitgaven": "finance",
  "/agenda/berichten": "agenda.manage",
  "/agenda/historie": "finance",
  "/agenda/werktijden": "hours.manage",
  "/agenda/instellingen": "owner",
  "/admin/beveiliging": "agenda.view",
};
