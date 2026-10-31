/** Minimal line icon set, drawn for Glow by Dilek (1.25px strokes, 24px grid). */
export type IconName =
  | "hygiene"
  | "comfort"
  | "privacy"
  | "attention"
  | "mail"
  | "pin"
  | "calendar"
  | "check"
  | "arrow"
  | "plus"
  | "sparkle"
  | "clock"
  | "info";

const paths: Record<IconName, string> = {
  hygiene: "M12 3c3 4 6 7.2 6 10.5A6 6 0 0 1 6 13.5C6 10.2 9 7 12 3Z M9.5 14.5a2.6 2.6 0 0 0 2.5 2.4",
  comfort: "M4 15c2.5-4 5.5-6 8-6s5.5 2 8 6 M6.5 18.5h11 M12 5v1.5 M6.6 7.2l1 1 M17.4 7.2l-1 1",
  privacy: "M12 3.5 5 6v5.5c0 4.2 3 7.7 7 9 4-1.3 7-4.8 7-9V6l-7-2.5Z M9.2 12l2 2 3.8-3.9",
  attention: "M12 20.5s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.9c0 5.6-7.5 10-7.5 10Z",
  mail: "M3.5 6.5h17v11h-17z M3.8 7l8.2 6.2L20.2 7",
  pin: "M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z M12 12.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z",
  calendar: "M4 6.5h16v13H4z M4 10.5h16 M8.5 4v4 M15.5 4v4",
  check: "M5 12.5l4.2 4.2L19 7",
  arrow: "M4 12h15 M14 7l5 5-5 5",
  plus: "M12 5v14 M5 12h14",
  sparkle: "M12 3.5c.6 4.2 2.3 5.9 6.5 6.5-4.2.6-5.9 2.3-6.5 6.5-.6-4.2-2.3-5.9-6.5-6.5 4.2-.6 5.9-2.3 6.5-6.5Z",
  clock: "M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17Z M12 7.5V12l3 2",
  info: "M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17Z M12 11v5.5 M12 7.8v.4",
};

export function Icon({ name, className = "h-6 w-6" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}
