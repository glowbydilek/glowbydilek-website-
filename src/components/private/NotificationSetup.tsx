"use client";

import { useCallback, useEffect, useState } from "react";
import { useT } from "./PanelLangProvider";

type State =
  | "checking"
  | "unsupported" // browser has no Web Push
  | "ios-install" // iPhone/iPad in Safari: must be added to the Home Screen first
  | "unconfigured" // server has no push keys yet
  | "denied" // permission blocked in system/browser settings
  | "off" // can be switched on
  | "on"; // this device receives notifications

const b64ToBytes = (s: string) => {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const raw = atob((s + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

async function registration() {
  return navigator.serviceWorker.register("/agenda/sw.js", { scope: "/agenda" }).then(() => navigator.serviceWorker.ready);
}

/** Re-registers an existing subscription with the server (e.g. after the browser renewed it). */
export async function refreshSubscription(): Promise<void> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || Notification.permission !== "granted") return;
  const reg = await registration();
  const sub = await reg.pushManager.getSubscription();
  if (sub) await fetch("/api/agenda/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) }).catch(() => {});
}

/**
 * "Meldingen inschakelen": step-by-step, in plain Dutch. Permission is only
 * asked after a tap (required by iOS and good practice everywhere).
 */
export function NotificationSetup() {
  const t = useT();
  const [state, setState] = useState<State>("checking");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const detect = useCallback(async () => {
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setState(ios && !standalone ? "ios-install" : "unsupported");
      return;
    }
    const key = await fetch("/api/agenda/push", { cache: "no-store" })
      .then((r) => r.json())
      .catch(() => null);
    if (!key?.publicKey) return setState("unconfigured");
    if (Notification.permission === "denied") return setState("denied");
    const reg = await registration();
    const sub = await reg.pushManager.getSubscription();
    setState(sub && Notification.permission === "granted" ? "on" : "off");
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time capability check after hydration
    detect().catch(() => setState("unsupported"));
  }, [detect]);

  async function enable() {
    setBusy(true);
    setMsg(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "off");
        return;
      }
      const { publicKey } = await fetch("/api/agenda/push", { cache: "no-store" }).then((r) => r.json());
      const reg = await registration();
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(publicKey) }));
      const r = await fetch("/api/agenda/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
      if (!r.ok) throw new Error("save");
      setState("on");
      setMsg(t("Meldingen staan aan op dit apparaat. Stuur hieronder een testmelding."));
    } catch {
      setMsg(t("Het inschakelen is niet gelukt. Probeer het opnieuw."));
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setMsg(null);
    const r = await fetch("/api/agenda/push/test", { method: "POST" })
      .then((x) => x.json())
      .catch(() => null);
    setBusy(false);
    if (!r?.ok) setMsg(t(r?.error === "rateLimited" ? "Even wachten: probeer het over een paar minuten opnieuw." : "De testmelding kon niet worden verstuurd."));
    else if (!r.devices) setMsg(t("Er is nog geen apparaat aangemeld. Zet eerst de meldingen aan."));
    else setMsg(t(r.delivered > 0 ? "Testmelding verstuurd. Je ziet hem binnen enkele seconden, ook als de app dicht is." : "De testmelding kwam niet aan. Zet de meldingen uit en weer aan."));
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await registration();
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/agenda/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      setState("off");
      setMsg(t("Meldingen staan uit op dit apparaat. Openstaande acties blijven zichtbaar in Meldingen."));
    } finally {
      setBusy(false);
    }
  }

  const btn = "inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-medium disabled:opacity-60";
  return (
    <div className="space-y-3 text-sm">
      {state === "checking" && <p className="text-muted">{t("Bezig met controleren…")}</p>}
      {state === "ios-install" && (
        <ol className="list-decimal space-y-1 pl-5">
          <li>{t("Open deze pagina in Safari.")}</li>
          <li>{t("Tik op de deelknop (vierkant met pijl omhoog).")}</li>
          <li>{t("Kies „Zet op beginscherm” en tik op „Voeg toe”.")}</li>
          <li>{t("Open de Agenda via het nieuwe icoon op je beginscherm en kom terug naar deze pagina.")}</li>
        </ol>
      )}
      {state === "unsupported" && <p>{t("Deze browser ondersteunt geen meldingen. Gebruik op iPhone of iPad de Agenda-app op je beginscherm (iOS 16.4 of nieuwer), of Chrome, Edge of Safari op een computer.")}</p>}
      {state === "unconfigured" && <p>{t("Meldingen zijn nog niet ingesteld op de server. Openstaande acties staan altijd in Meldingen.")}</p>}
      {state === "denied" && (
        <div className="space-y-1">
          <p>{t("Meldingen zijn geblokkeerd voor de Agenda. Zo zet je ze weer aan:")}</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>{t("iPhone/iPad:")}</strong> {t("Instellingen → Meldingen → Agenda → Sta meldingen toe (en zet Badges aan).")}</li>
            <li><strong>{t("Android:")}</strong> {t("houd het Agenda-icoon ingedrukt → App-info → Meldingen → aan.")}</li>
            <li><strong>{t("Computer:")}</strong> {t("klik op het slotje naast het webadres → Meldingen → Toestaan.")}</li>
          </ul>
          <p>{t("Kom daarna terug naar deze pagina.")}</p>
        </div>
      )}
      {state === "off" && (
        <button type="button" onClick={enable} disabled={busy} className={`${btn} bg-ink text-paper`}>
          {busy ? t("Bezig…") : t("Meldingen inschakelen")}
        </button>
      )}
      {state === "on" && (
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex min-h-11 items-center rounded-full bg-green-50 px-4 font-medium text-green-800">{t("✓ Meldingen staan aan op dit apparaat")}</span>
          <button type="button" onClick={test} disabled={busy} className={`${btn} border border-ink/25`}>
            {t("Testmelding sturen")}
          </button>
          <button type="button" onClick={disable} disabled={busy} className={`${btn} text-muted underline`}>
            {t("Uitzetten op dit apparaat")}
          </button>
        </div>
      )}
      {msg && (
        <p role="status" className="text-ink">
          {msg}
        </p>
      )}
    </div>
  );
}
