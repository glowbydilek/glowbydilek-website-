"use client";

import { useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let loader: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!loader) {
    loader = new Promise<TurnstileApi>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SCRIPT;
      s.async = true;
      s.defer = true;
      s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile")));
      s.onerror = () => {
        loader = null;
        reject(new Error("turnstile"));
      };
      document.head.appendChild(s);
    });
  }
  return loader;
}

/**
 * Cloudflare Turnstile widget (explicit rendering). Reports a fresh token via
 * `onToken`, or `null` when it expires or fails. Changing `resetKey` asks for
 * a new token (tokens are single-use). Form values are never touched here,
 * so a failed or expired challenge never clears what the visitor typed.
 */
export function Turnstile({
  siteKey,
  action,
  locale,
  resetKey,
  onToken,
  labels,
}: {
  siteKey: string;
  action: string;
  locale: "nl" | "en";
  resetKey: number;
  onToken: (token: string | null) => void;
  labels: { title: string; loading: string; blocked: string; email: string; unavailable?: string };
}) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const tokenCb = useRef(onToken);
  const [status, setStatus] = useState<"loading" | "ready" | "blocked">("loading");

  useEffect(() => {
    tokenCb.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;
    loadTurnstile()
      .then((api) => {
        if (cancelled || !box.current) return;
        widget.current = api.render(box.current, {
          sitekey: siteKey,
          action,
          language: locale,
          theme: "light",
          size: "flexible",
          "refresh-expired": "auto",
          callback: (token: string) => tokenCb.current(token),
          "expired-callback": () => tokenCb.current(null),
          "timeout-callback": () => tokenCb.current(null),
          "error-callback": () => {
            tokenCb.current(null);
            return false;
          },
        });
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("blocked"));
    return () => {
      cancelled = true;
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = null;
    };
  }, [siteKey, action, locale]);

  useEffect(() => {
    if (resetKey > 0 && widget.current && window.turnstile) {
      tokenCb.current(null);
      window.turnstile.reset(widget.current);
    }
  }, [resetKey]);

  if (!siteKey) {
    // Not configured on the server (production without live keys): be honest, offer email.
    return (
      <p role="alert" className="text-sm text-[#9b3b2f]">
        {labels.unavailable ?? labels.blocked}{" "}
        <a className="underline" href={`mailto:${labels.email}`}>{labels.email}</a>.
      </p>
    );
  }
  return (
    <div role="group" aria-label={labels.title} className="min-h-[65px]">
      <div ref={box} />
      {status === "loading" && <p className="text-sm text-muted">{labels.loading}</p>}
      {status === "blocked" && (
        <p className="text-sm text-[#9b3b2f]">
          {labels.blocked}{" "}
          <a className="underline" href={`mailto:${labels.email}`}>
            {labels.email}
          </a>
          .
        </p>
      )}
    </div>
  );
}

/** Token state for a form: the token, a reset trigger and a "missing" flag. */
export function useTurnstileToken() {
  const [token, setTokenState] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [missing, setMissing] = useState(false);
  const setToken = (t: string | null) => {
    setTokenState(t);
    if (t) setMissing(false);
  };
  /** Tokens are single-use: request a new one after every submission attempt. */
  const renew = () => {
    setTokenState(null);
    setResetKey((k) => k + 1);
  };
  return { token, setToken, resetKey, renew, missing, setMissing };
}
