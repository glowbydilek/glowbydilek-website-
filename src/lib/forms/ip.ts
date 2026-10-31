type HeaderSource = { headers: { get(name: string): string | null } };

/**
 * Client IP for rate limiting. Only headers set by our own infrastructure are
 * trusted: X-Real-IP (set by the hosting proxy) or the LAST X-Forwarded-For
 * entry (the one appended by our proxy — earlier entries can be forged by the
 * client). Behind Cloudflare's proxy, set TRUST_CF_CONNECTING_IP=true to use
 * CF-Connecting-IP instead.
 */
export function clientIp(req: HeaderSource, env: Record<string, string | undefined> = process.env): string {
  if (env.TRUST_CF_CONNECTING_IP === "true") {
    const cf = req.headers.get("cf-connecting-ip")?.trim();
    if (cf) return cf;
  }
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const chain =
    req.headers
      .get("x-forwarded-for")
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  return chain[chain.length - 1] || "unknown";
}
