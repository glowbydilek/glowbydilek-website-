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
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "frame-src https://challenges.cloudflare.com",
  "connect-src 'self' https://challenges.cloudflare.com",
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
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
