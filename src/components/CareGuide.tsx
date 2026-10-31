import type { Dictionary } from "@/i18n/dictionaries";
import { Icon } from "./ui/Icon";

export function CareGuide({ dict }: { dict: Dictionary }) {
  const blocks = [
    { ...dict.care.before, icon: "calendar" as const, tone: "bg-ivory" },
    { ...dict.care.after, icon: "sparkle" as const, tone: "bg-blush-light" },
  ];
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {blocks.map((b) => (
        <div key={b.title} className={`rounded-[1.75rem] ${b.tone} p-7 shadow-card sm:p-10`}>
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-espresso text-champagne-light">
              <Icon name={b.icon} className="h-5 w-5" />
            </span>
            <h3 className="text-3xl">{b.title}</h3>
          </div>
          <ul className="mt-7 space-y-4">
            {b.items.map((item) => (
              <li key={item} className="flex gap-3 leading-relaxed text-espresso-soft">
                <Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-champagne-deep" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
