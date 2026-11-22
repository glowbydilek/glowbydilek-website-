import "server-only";

/**
 * KVK Handelsregister lookup (official KVK API, Basisprofiel).
 *
 * Paid KVK subscription: it only runs when KVK_API_KEY is set on the server
 * (Hostinger → Environment variables). Without a key the owner fills in the
 * details by hand, exactly as before. Only what the register returns is
 * passed on — no BTW-id, IBAN or other unverified values are ever produced.
 * Results are cached in memory for a day so repeated taps cost nothing.
 */
export type KvkAddress = { street: string; postcode: string; city: string; country: string; shielded: boolean };
export type KvkResult = {
  kvk: string;
  legalName: string;
  tradeNames: string[];
  main: { number: string; name: string; address: KvkAddress | null } | null;
  establishments: { number: string; name: string }[];
};
export type KvkLookup = { ok: true; data: KvkResult } | { ok: false; reason: "invalid" | "not_configured" | "not_found" | "unavailable" | "rate_limited" };

const cache = new Map<string, { at: number; value: KvkLookup }>();
const DAY = 24 * 60 * 60 * 1000;

export const kvkConfigured = () => Boolean(process.env.KVK_API_KEY);

type Adres = {
  type?: string;
  indAfgeschermd?: string;
  indicatieAfgeschermd?: string;
  straatnaam?: string;
  huisnummer?: number | string;
  huisletter?: string;
  huisnummerToevoeging?: string;
  toevoegingAdres?: string;
  postcode?: string;
  plaats?: string;
  land?: string;
  postbusnummer?: number | string;
};

function address(list: Adres[] | undefined): KvkAddress | null {
  if (!list?.length) return null;
  const a = list.find((x) => x.type === "bezoekadres") ?? list[0];
  const shielded = a.indAfgeschermd === "Ja" || a.indicatieAfgeschermd === "Ja";
  if (shielded) return { street: "", postcode: "", city: "", country: "", shielded: true };
  const nr = [a.huisnummer, a.huisletter].filter(Boolean).join("") + (a.huisnummerToevoeging ? `-${a.huisnummerToevoeging}` : "");
  const street = a.straatnaam ? `${a.straatnaam} ${nr}`.trim() : a.postbusnummer ? `Postbus ${a.postbusnummer}` : "";
  return { street, postcode: (a.postcode ?? "").replace(/\s/g, "").replace(/^(\d{4})([A-Z]{2})$/i, "$1 $2").toUpperCase(), city: a.plaats ?? "", country: a.land ?? "", shielded: false };
}

export async function lookupKvk(input: string): Promise<KvkLookup> {
  const kvk = input.replace(/\s/g, "");
  if (!/^\d{8}$/.test(kvk)) return { ok: false, reason: "invalid" };
  const key = process.env.KVK_API_KEY;
  if (!key) return { ok: false, reason: "not_configured" };
  const hit = cache.get(kvk);
  if (hit && Date.now() - hit.at < DAY) return hit.value;
  const base = (process.env.KVK_API_BASE || "https://api.kvk.nl/api").replace(/\/$/, "");
  let res: Response;
  try {
    res = await fetch(`${base}/v1/basisprofielen/${kvk}?geoData=false`, { headers: { apikey: key, accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(8000) });
  } catch {
    return { ok: false, reason: "unavailable" };
  }
  if (res.status === 404 || res.status === 400) {
    const value: KvkLookup = { ok: false, reason: "not_found" };
    cache.set(kvk, { at: Date.now(), value });
    return value;
  }
  if (res.status === 429) return { ok: false, reason: "rate_limited" };
  if (!res.ok) return { ok: false, reason: "unavailable" };
  type Body = {
    kvkNummer?: string;
    naam?: string;
    statutaireNaam?: string;
    handelsnamen?: { naam: string; volgorde?: number }[];
    _embedded?: { hoofdvestiging?: { vestigingsnummer?: string; eersteHandelsnaam?: string; adressen?: Adres[] }; eigenaar?: { adressen?: Adres[] } };
    _links?: { vestigingen?: { href?: string } };
  };
  const b = (await res.json().catch(() => null)) as Body | null;
  if (!b?.kvkNummer) return { ok: false, reason: "unavailable" };
  const main = b._embedded?.hoofdvestiging;
  // Other establishments (only the list; numbers and names).
  let establishments: KvkResult["establishments"] = [];
  try {
    const v = await fetch(`${base}/v1/basisprofielen/${kvk}/vestigingen`, { headers: { apikey: key, accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (v.ok) {
      const j = (await v.json()) as { vestigingen?: { vestigingsnummer: string; eersteHandelsnaam?: string }[] };
      establishments = (j.vestigingen ?? []).map((x) => ({ number: x.vestigingsnummer, name: x.eersteHandelsnaam ?? "" }));
    }
  } catch {
    /* the main profile is enough */
  }
  const value: KvkLookup = {
    ok: true,
    data: {
      kvk: b.kvkNummer,
      legalName: b.statutaireNaam || b.naam || "",
      tradeNames: (b.handelsnamen ?? []).sort((x, y) => (x.volgorde ?? 0) - (y.volgorde ?? 0)).map((h) => h.naam).filter(Boolean),
      main: main ? { number: main.vestigingsnummer ?? "", name: main.eersteHandelsnaam ?? "", address: address(main.adressen?.length ? main.adressen : b._embedded?.eigenaar?.adressen) } : null,
      establishments,
    },
  };
  cache.set(kvk, { at: Date.now(), value });
  return value;
}
