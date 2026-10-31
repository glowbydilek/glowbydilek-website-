import { siteConfig } from "@/content/site";
import type { Dictionary } from "@/i18n/dictionaries";

type Channel = { label: string; value: string; href?: string };

export function getContactChannels(dict: Dictionary): Channel[] {
  const c = siteConfig.contact;
  const channels: Channel[] = [];
  if (c.email) channels.push({ label: dict.contact.email, value: c.email, href: `mailto:${c.email}` });
  if (c.phone) channels.push({ label: dict.contact.phone, value: c.phone, href: `tel:${c.phone}` });
  if (c.whatsapp)
    channels.push({ label: dict.contact.whatsapp, value: `+${c.whatsapp}`, href: `https://wa.me/${c.whatsapp}` });
  if (c.instagram) {
    const handle = c.instagram.replace(/^@/, "");
    channels.push({ label: dict.contact.instagram, value: `@${handle}`, href: `https://www.instagram.com/${handle}` });
  }
  if (c.address)
    channels.push({
      label: dict.contact.location,
      value: `${c.address.street}, ${c.address.postalCode} ${c.address.city}`,
    });
  else if (c.region) channels.push({ label: dict.contact.location, value: c.region });
  return channels;
}

export function ContactChannels({ dict }: { dict: Dictionary }) {
  const channels = getContactChannels(dict);

  if (channels.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-champagne/50 bg-ivory-100 px-6 py-5 leading-relaxed text-charcoal-soft">
        {dict.contact.noChannels}
      </p>
    );
  }

  return (
    <dl className="divide-y divide-champagne/20">
      {channels.map((ch) => (
        <div key={ch.label} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between">
          <dt className="eyebrow">{ch.label}</dt>
          <dd className="font-serif text-xl">
            {ch.href ? (
              <a
                href={ch.href}
                className="transition-colors hover:text-champagne-deep"
                {...(ch.href.startsWith("http") && { target: "_blank", rel: "noopener noreferrer" })}
              >
                {ch.value}
              </a>
            ) : (
              ch.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
