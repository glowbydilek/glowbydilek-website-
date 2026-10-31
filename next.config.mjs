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
const securityHeaders = [
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
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
