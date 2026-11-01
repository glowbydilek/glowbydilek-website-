"use server";

import { redirect } from "next/navigation";
import { getDb, databaseConfigured } from "../db/client";
import { sendResetEmail } from "../auth/mail";
import {
  changePassword,
  confirmMfaEnrolment,
  createPasswordReset,
  disableMfa,
  ensureOwner,
  login,
  resetPassword,
  revokeAllSessions,
  revokeSession,
  startMfaEnrolment,
  verifyMfa,
} from "../auth/service";
import {
  assertOwner,
  clearSessionCookie,
  currentSession,
  requestContext,
  safeNext,
  sessionToken,
  setSessionCookie,
  type Area,
} from "../auth/session";
import { createSession } from "../auth/service";
import { verifyTurnstile } from "../forms/turnstile";
import { audit } from "../db/audit";

export type FormState = { error?: string; ok?: boolean; message?: string; data?: Record<string, unknown> };

const area = (v: FormDataEntryValue | null): Area => (v === "ajanda" ? "ajanda" : "admin");

export async function loginAction(_: FormState, form: FormData): Promise<FormState> {
  const a = area(form.get("area"));
  if (!databaseConfigured()) return { error: "De database is nog niet gekoppeld. Zie docs/DEPLOYMENT.md." };
  const db = getDb();
  await ensureOwner(db);
  const ctx = await requestContext();
  const captcha = await verifyTurnstile({ token: form.get("turnstileToken"), action: "login", ip: ctx.ip, optional: true });
  if (!captcha.ok) return { error: captcha.reason === "unavailable" ? "De beveiligingscontrole is niet beschikbaar. Probeer het later opnieuw." : "Rond de beveiligingscontrole af en probeer het opnieuw." };
  const r = await login(db, String(form.get("email") ?? ""), String(form.get("password") ?? ""), ctx);
  if (!r.ok) {
    return { error: r.reason === "rateLimited" ? "Te veel pogingen. Wacht 15 minuten en probeer het opnieuw." : "Onjuist e-mailadres of wachtwoord." };
  }
  await setSessionCookie(r.token);
  const next = safeNext(String(form.get("next") ?? ""), a);
  redirect(r.mfaRequired ? `/${a}/login/verificatie?next=${encodeURIComponent(next)}` : next);
}

export async function mfaAction(_: FormState, form: FormData): Promise<FormState> {
  const a = area(form.get("area"));
  const s = await currentSession();
  if (!s) redirect(`/${a}/login`);
  const ctx = await requestContext();
  const r = await verifyMfa(getDb(), s, String(form.get("code") ?? ""), ctx);
  if (!r.ok) return { error: r.reason === "rateLimited" ? "Te veel pogingen. Wacht 15 minuten." : "Deze code klopt niet of is al gebruikt." };
  redirect(safeNext(String(form.get("next") ?? ""), a));
}

export async function forgotAction(_: FormState, form: FormData): Promise<FormState> {
  const a = area(form.get("area"));
  const neutral = {
    ok: true,
    message:
      "Als dit e-mailadres bij een account hoort, is er een link verstuurd om een nieuw wachtwoord te kiezen. De link is 15 minuten geldig. Kijk ook in je spammap.",
  };
  if (!databaseConfigured()) return { error: "De database is nog niet gekoppeld." };
  const db = getDb();
  await ensureOwner(db);
  const ctx = await requestContext();
  const captcha = await verifyTurnstile({ token: form.get("turnstileToken"), action: "reset", ip: ctx.ip, optional: true });
  if (!captcha.ok) return { error: "Rond de beveiligingscontrole af en probeer het opnieuw." };
  const r = await createPasswordReset(db, String(form.get("email") ?? ""), ctx);
  if (r.status === "created") {
    try {
      await sendResetEmail(r.user.email, r.token, a);
    } catch (err) {
      // Do not reveal the failure to the requester (that would confirm the account exists).
      console.error("[auth] reset email could not be sent:", (err as { code?: string })?.code ?? "error");
    }
  }
  return neutral;
}

export async function resetAction(_: FormState, form: FormData): Promise<FormState> {
  const a = area(form.get("area"));
  const pw = String(form.get("password") ?? "");
  if (pw !== String(form.get("confirm") ?? "")) return { error: "De twee wachtwoorden zijn niet gelijk." };
  const r = await resetPassword(getDb(), String(form.get("token") ?? ""), pw, await requestContext());
  if (!r.ok) {
    const map = {
      invalidToken: "Deze link is verlopen of al gebruikt. Vraag een nieuwe link aan.",
      tooShort: "Kies een wachtwoord van minimaal 12 tekens.",
      tooLong: "Dit wachtwoord is te lang.",
      weak: "Dit wachtwoord is te makkelijk te raden. Kies iets langers of unieks.",
    };
    return { error: map[r.reason] };
  }
  await clearSessionCookie();
  redirect(`/${a}/login?reset=1`);
}

export async function logoutAction(form: FormData) {
  const a = area(form.get("area"));
  const token = await sessionToken();
  if (token && databaseConfigured()) await revokeSession(getDb(), token);
  await clearSessionCookie();
  redirect(`/${a}/login?uitgelogd=1`);
}

/** Ends every session of the owner, including this one (lost or shared device). */
export async function logoutEverywhereAction() {
  const s = await assertOwner();
  const db = getDb();
  await revokeAllSessions(db, s.user.id);
  await audit(db, { userId: s.user.id, action: "auth.logout_all" });
  await clearSessionCookie();
  redirect("/admin/login?uitgelogd=1");
}

export async function changePasswordAction(_: FormState, form: FormData): Promise<FormState> {
  const s = await assertOwner();
  const next = String(form.get("password") ?? "");
  if (next !== String(form.get("confirm") ?? "")) return { error: "De twee nieuwe wachtwoorden zijn niet gelijk." };
  const ctx = await requestContext();
  const r = await changePassword(getDb(), s, String(form.get("current") ?? ""), next, ctx);
  if (!r.ok) {
    const map = {
      wrongPassword: "Je huidige wachtwoord klopt niet.",
      tooShort: "Kies een wachtwoord van minimaal 12 tekens.",
      tooLong: "Dit wachtwoord is te lang.",
      weak: "Dit wachtwoord is te makkelijk te raden.",
    };
    return { error: map[r.reason] };
  }
  // This device stays signed in with a fresh session; all others are signed out.
  const token = await createSession(getDb(), { ...s.user, passwordChangedAt: new Date() }, ctx, true);
  await setSessionCookie(token);
  return { ok: true, message: "Je wachtwoord is gewijzigd. Andere apparaten zijn uitgelogd." };
}

export async function startMfaAction(): Promise<FormState> {
  const s = await assertOwner();
  const { uri, secret } = await startMfaEnrolment(getDb(), s.user);
  return { ok: true, data: { uri, secret } };
}

export async function confirmMfaAction(_: FormState, form: FormData): Promise<FormState> {
  const s = await assertOwner();
  const r = await confirmMfaEnrolment(getDb(), s.user, String(form.get("code") ?? "").trim(), await requestContext());
  if (!r.ok) return { error: "Deze code klopt niet. Controleer de tijd op je telefoon en probeer de nieuwste code." };
  return { ok: true, data: { recoveryCodes: r.recoveryCodes } };
}

export async function disableMfaAction(_: FormState, form: FormData): Promise<FormState> {
  const s = await assertOwner();
  const ok = await disableMfa(getDb(), s, String(form.get("password") ?? ""), await requestContext());
  return ok ? { ok: true, message: "Tweestapsverificatie is uitgeschakeld." } : { error: "Je wachtwoord klopt niet." };
}
