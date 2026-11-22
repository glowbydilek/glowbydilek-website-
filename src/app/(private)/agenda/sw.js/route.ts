/**
 * Service worker for the installable Agenda app.
 * - Caches nothing: no customer data is ever stored offline on the device.
 * - Push: shows the (lock-screen safe) notification and sets the app-icon
 *   badge to the number of open actions sent by the server.
 * - Tap: opens the exact Agenda screen. That screen requires a normal signed-in
 *   session; nothing is approved or changed from the notification itself.
 */
export const dynamic = "force-static";

const SW = `self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

function setBadge(n) {
  try {
    if (!self.navigator || !("setAppBadge" in self.navigator)) return Promise.resolve();
    return n > 0 ? self.navigator.setAppBadge(n) : self.navigator.clearAppBadge();
  } catch (e) { return Promise.resolve(); }
}

function safeUrl(u) {
  return typeof u === "string" && /^\\/agenda(\\/[\\w\\-/?=&%.]*)?$/.test(u) && u.indexOf("//") === -1 ? u : "/agenda/meldingen";
}

self.addEventListener("push", (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = {}; }
  const title = typeof d.title === "string" ? d.title.slice(0, 120) : "Glow by Dilek";
  const badge = Number.isInteger(d.badge) && d.badge >= 0 ? d.badge : null;
  event.waitUntil(Promise.all([
    self.registration.showNotification(title, {
      body: typeof d.body === "string" ? d.body.slice(0, 200) : "",
      tag: typeof d.tag === "string" ? d.tag.slice(0, 120) : undefined,
      icon: "/brand/agenda-icon-192.png",
      badge: "/brand/agenda-icon-192.png",
      data: { url: safeUrl(d.url) },
      lang: "nl",
    }),
    badge === null ? Promise.resolve() : setBadge(badge),
  ]));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = safeUrl(event.notification.data && event.notification.data.url);
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) {
      if (new URL(c.url).pathname.indexOf("/agenda") === 0 && "focus" in c) {
        await c.focus();
        if ("navigate" in c) return c.navigate(url);
        return;
      }
    }
    return self.clients.openWindow(url);
  })());
});

self.addEventListener("pushsubscriptionchange", (event) => {
  // The browser replaced the subscription: the app re-registers it on next open
  // (needs a signed-in session, so nothing is sent from here).
  event.waitUntil(Promise.resolve());
});
`;

export function GET() {
  return new Response(SW, {
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "no-cache",
      "Service-Worker-Allowed": "/agenda",
    },
  });
}
