"use client";

import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

/**
 * "Install the Agenda app" for phone, tablet and laptop.
 * - Chrome / Edge / Samsung Internet (Android, Windows, Mac, ChromeOS): one
 *   button that opens the browser's own install dialog.
 * - iPhone / iPad (Safari has no install dialog): a short instruction for
 *   Share → "Zet op beginscherm".
 * - Hidden when the agenda already runs as an installed app.
 */
export function InstallApp() {
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  const [device, setDevice] = useState({ ios: false, installed: true });
  const { ios, installed } = device;

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const ua = navigator.userAgent;
    const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the device after hydration
    setDevice({ installed: standalone, ios: /iPhone|iPad|iPod/.test(ua) || iPadOS });

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/agenda/sw.js", { scope: "/agenda" }).catch(() => {});
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as InstallEvent);
    };
    const onInstalled = () => {
      setDevice((d) => ({ ...d, installed: true }));
      setEvt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || (!evt && !ios)) return null;

  return (
    <div className="mt-5 rounded-xl border border-line bg-paper p-4 text-sm">
      <p className="font-medium text-ink">Agenda als app op je telefoon, tablet of laptop</p>
      {evt ? (
        <>
          <p className="mt-1 text-muted">Installeer de agenda en open hem voortaan met één tik, zonder browser.</p>
          <button
            type="button"
            onClick={async () => {
              await evt.prompt();
              await evt.userChoice.catch(() => null);
              setEvt(null);
            }}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-ink px-5 font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-accent"
          >
            App installeren
          </button>
        </>
      ) : (
        <p className="mt-1 text-muted">
          Tik in Safari op <strong className="font-medium text-ink">Deel</strong> (vierkantje met pijl omhoog) en kies{" "}
          <strong className="font-medium text-ink">Zet op beginscherm</strong>. Daarna staat de Agenda als app tussen je apps.
        </p>
      )}
    </div>
  );
}
