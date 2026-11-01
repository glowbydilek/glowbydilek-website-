import type { SocialLink } from "@/lib/cms/menu";

const ICONS: Record<SocialLink["network"], { label: string; d: string }> = {
  instagram: {
    label: "Instagram",
    d: "M12 7.4a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2Zm0 7.6a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm4.8-8.9a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2ZM12 3.6c2.3 0 2.5 0 3.4.05 2.3.1 3.4 1.2 3.5 3.5.04.9.05 1.2.05 3.4v1c0 2.3 0 2.5-.05 3.4-.1 2.3-1.2 3.4-3.5 3.5-.9.04-1.2.05-3.4.05s-2.5 0-3.4-.05c-2.3-.1-3.4-1.2-3.5-3.5C5 15 5 14.7 5 12.5v-1c0-2.2 0-2.5.05-3.4.1-2.3 1.2-3.4 3.5-3.5.9-.05 1.1-.05 3.4-.05ZM12 2c-2.3 0-2.6 0-3.5.05C5.4 2.2 3.7 3.9 3.55 7c-.05.9-.05 1.2-.05 3.5v1c0 2.3 0 2.6.05 3.5.15 3.1 1.85 4.8 4.95 4.95.9.05 1.2.05 3.5.05s2.6 0 3.5-.05c3.1-.15 4.8-1.85 4.95-4.95.05-.9.05-1.2.05-3.5v-1c0-2.3 0-2.6-.05-3.5C20.3 3.9 18.6 2.2 15.5 2.05 14.6 2 14.3 2 12 2Z",
  },
  facebook: {
    label: "Facebook",
    d: "M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.25-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3Z",
  },
  tiktok: {
    label: "TikTok",
    d: "M16.6 3h-3v11.9a2.6 2.6 0 1 1-2.6-2.6c.27 0 .53.04.78.12V9.33a5.7 5.7 0 0 0-.78-.05 5.7 5.7 0 1 0 5.7 5.7V9.06a7.2 7.2 0 0 0 4.2 1.35V7.36A4.2 4.2 0 0 1 16.6 3Z",
  },
};

/** Social profile links set by the owner; nothing renders without a real, enabled link. */
export function SocialIcons({ links, label, className = "" }: { links: SocialLink[]; label: string; className?: string }) {
  if (!links.length) return null;
  return (
    <ul aria-label={label} className={`flex items-center gap-1 ${className}`}>
      {links.map((l) => (
        <li key={l.network}>
          <a href={l.url} target="_blank" rel="noopener noreferrer me" aria-label={`${ICONS[l.network].label} (opent in een nieuw venster)`} className="grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-paper/10">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
              <path d={ICONS[l.network].d} />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
