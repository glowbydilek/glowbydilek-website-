// @ts-check

/**
 * Plain JavaScript config (not TypeScript) on purpose: a `next.config.ts`
 * must be transpiled by Next.js's SWC compiler before it can be loaded,
 * which fails on hosts where the native SWC binary cannot run, such as
 * Hostinger's Node.js build environment (glibc older than 2.29).
 *
 * Hostinger Node.js Web Apps run `npm run build` followed by `npm start`
 * (`next start`), which listens on the PORT environment variable.
 */
const dev = process.env.NODE_ENV === "development";

/**
 * Content Security Policy. Cloudflare Turnstile needs its script and iframe
 * from challenges.cloudflare.com. 'unsafe-inline' is required for the inline
 * scripts Next.js emits on statically generated pages.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline'",
  // Google Analytics endpoints are only contacted after the owner enabled GA4 AND the visitor consented.
  "img-src 'self' data: blob: https://*.google-analytics.com https://*.googletagmanager.com",
  "font-src 'self' data:",
  "frame-src https://challenges.cloudflare.com",
  "connect-src 'self' https://challenges.cloudflare.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
  "form-action 'self'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Media uploads in the admin (images up to 12 MB) are sent through Server Actions.
  experimental: { serverActions: { bodySizeLimit: "14mb" } },
  // pdfkit reads its font metrics from node_modules at runtime; keep it unbundled.
  serverExternalPackages: ["pdfkit"],
  poweredByHeader: false,
  /**
   * Convenience redirects for short or guessable URLs. No existing page URL
   * changed in this release; category anchors (/waxbehandelingen#face) keep
   * working on the overview page.
   */
  async redirects() {
    return [
      { source: "/faq", destination: "/veelgestelde-vragen", permanent: true },
      { source: "/afspraak", destination: "/afspraak-maken", permanent: true },
      { source: "/waxbehandelingen/intiem", destination: "/waxbehandelingen/bikini-intiem", permanent: true },
      { source: "/waxbehandelingen/bikini", destination: "/waxbehandelingen/bikini-intiem", permanent: true },
      { source: "/en/waxing-treatments/intimate", destination: "/en/waxing-treatments/bikini-intimate", permanent: true },
      { source: "/en/waxing-treatments/bikini", destination: "/en/waxing-treatments/bikini-intimate", permanent: true },
      { source: "/en/how-it-works", destination: "/en/appointment-process", permanent: true },
      { source: "/en/book", destination: "/en/book-appointment", permanent: true },
    ];
  },
  async headers() {
    const privateHeaders = [
      { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
      { key: "Cache-Control", value: "private, no-store, max-age=0" },
      { key: "Referrer-Policy", value: "no-referrer" },
    ];
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: privateHeaders },
      { source: "/admin", headers: privateHeaders },
      { source: "/ajanda/:path*", headers: privateHeaders },
      { source: "/ajanda", headers: privateHeaders },
      { source: "/api/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex" }, { key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
