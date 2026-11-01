import { whatsappLink } from "@/content/site";
import type { Dictionary } from "@/i18n/dictionaries";
import { Icon } from "./ui/Icon";

/**
 * Floating WhatsApp button. Renders NOTHING until a valid number is
 * configured (NEXT_PUBLIC_WHATSAPP_NUMBER or site.ts), so there is never a
 * broken link.
 */
export function WhatsAppButton({ dict }: { dict: Dictionary }) {
  const link = whatsappLink(dict.whatsapp.message);
  if (!link) return null;
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={dict.whatsapp.label}
      className="glass group fixed bottom-5 right-5 z-40 flex h-14 items-center gap-3 rounded-full pl-4 pr-4 text-ink transition-all duration-500 hover:pr-6 sm:bottom-7 sm:right-7"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-paper">
        <Icon name="whatsapp" className="h-5 w-5" />
      </span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-medium uppercase tracking-[0.18em] transition-all duration-500 group-hover:max-w-[8rem] group-focus-visible:max-w-[8rem]">
        {dict.whatsapp.short}
      </span>
    </a>
  );
}
