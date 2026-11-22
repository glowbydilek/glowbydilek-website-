/**
 * The Agenda / Admin "D" monogram — the same approved asset as the Agenda
 * app icon (public/brand/agenda-icon.svg). Used only inside the private
 * panels; the public website keeps its own logo.
 */
export function PanelMonogram({ className = "h-9 w-9" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static vector brand asset, no optimisation needed
    <img src="/brand/agenda-icon.svg" alt="" aria-hidden="true" width={140} height={140} className={`${className} shrink-0 rounded-[22%]`} />
  );
}
