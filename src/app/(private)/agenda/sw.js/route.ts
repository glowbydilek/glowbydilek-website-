/**
 * Minimal service worker for the installable Agenda app. It only makes the
 * agenda installable; it caches nothing, so no customer data is ever stored
 * offline on the device. Every request goes straight to the network.
 */
export const dynamic = "force-static";

const SW = `self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
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
