import type { Dictionary } from "@/i18n/dictionaries";
import { Icon, type IconName } from "./ui/Icon";

export function TrustGrid({ dict, tone = "light", columns = 2 }: { dict: Dictionary; tone?: "light" | "dark"; columns?: 2 | 4 }) {
  const dark = tone === "dark";
  return (
    <ul className={`grid gap-px overflow-hidden rounded-[1.75rem] ${dark ? "bg-ivory/10" : "bg-champagne/25"} sm:grid-cols-2 ${columns === 4 ? "lg:grid-cols-4" : ""}`}>
      {dict.trust.map((item) => (
        <li key={item.title} className={`flex flex-col p-7 sm:p-8 ${dark ? "bg-espresso" : "bg-ivory"}`}>
          <span className={`flex h-12 w-12 items-center justify-center rounded-full ${dark ? "bg-ivory/8 text-champagne" : "bg-blush-light text-champagne-deep"}`}>
            <Icon name={item.icon as IconName} />
          </span>
          <h3 className={`mt-6 text-2xl ${dark ? "text-ivory" : ""}`}>{item.title}</h3>
          <p className={`mt-3 leading-relaxed ${dark ? "text-ivory/70" : "text-espresso-soft"}`}>{item.body}</p>
        </li>
      ))}
    </ul>
  );
}
