import { Icon, type IconName } from "./Icon";

/** Calm list with a small gold marker; used for preparation/aftercare/precautions. */
export function CheckList({ items, icon = "check", className = "" }: { items: string[]; icon?: IconName; className?: string }) {
  return (
    <ul className={`space-y-3 ${className}`}>
      {items.map((item) => (
        <li key={item} className="flex gap-3 leading-relaxed text-charcoal-soft">
          <Icon name={icon} className="mt-1 h-4 w-4 shrink-0 text-gold-deep" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
