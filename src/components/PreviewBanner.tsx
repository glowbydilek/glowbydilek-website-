/** Shown only to the signed-in owner while previewing unpublished changes. */
export function PreviewBanner() {
  return (
    <div className="sticky top-0 z-[60] flex flex-wrap items-center justify-center gap-3 bg-[#5a4320] px-4 py-2 text-center text-sm text-white">
      <span>Voorbeeldweergave — je ziet niet-gepubliceerde wijzigingen.</span>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- route handler, not a page */}
      <a href="/api/preview?stop=1" className="rounded-full bg-white/15 px-3 py-1 underline">
        Voorbeeld sluiten
      </a>
    </div>
  );
}
