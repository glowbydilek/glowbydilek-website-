import { parseIntake, type IntakeBlock } from "@/lib/intake/template";

/**
 * The intake & consent form as an A4 sheet (preview and print). Uses the
 * same parsed blocks as the PDF, so wording is identical everywhere.
 */
export function IntakeSheet({ source, version, locale }: { source: string; version: string; locale: "nl" | "en" }) {
  const p = parseIntake(source, version, locale === "nl" ? ["Ja", "Nee", "Weet niet"] : ["Yes", "No", "Not sure"]);
  const Box = () => <span aria-hidden="true" className="inline-block h-3.5 w-3.5 shrink-0 border border-[#2b202b]" />;
  const Line = () => <span aria-hidden="true" className="mt-5 block border-b border-[#bfa9b1]" />;
  const block = (b: IntakeBlock, i: number) => {
    switch (b.type) {
      case "title":
        return <h1 key={i} className="font-serif text-[1.65rem] leading-tight text-[#2b202b]">{b.text}</h1>;
      case "heading":
        return <h2 key={i} className="mt-5 border-b border-[#bfa9b1] pb-1 text-[0.95rem] font-semibold text-[#8e4759]">{b.text}</h2>;
      case "intro":
        return <p key={i} className="mt-1.5 text-[0.78rem] leading-snug text-[#5c4a58]">{b.text}</p>;
      case "note":
        return <p key={i} className="mt-2 bg-[#f5e6e7] px-2.5 py-1.5 text-[0.76rem] italic leading-snug text-[#2b202b]">{b.text}</p>;
      case "fields":
        return (
          <div key={i} className="mt-1 grid grid-cols-2 gap-x-6">
            {b.labels.map((l) => (
              <div key={l} className="pt-1.5 text-[0.74rem] text-[#5c4a58]">
                {l}
                <Line />
              </div>
            ))}
          </div>
        );
      case "options":
        return (
          <div key={i} className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1.5 text-[0.8rem] text-[#2b202b]">
            {b.items.map((o) => (
              <span key={o.label} className="inline-flex items-center gap-1.5">
                <Box />
                {o.label}
                {o.line && <span aria-hidden="true" className="inline-block w-24 border-b border-[#bfa9b1]">&nbsp;</span>}
              </span>
            ))}
          </div>
        );
      case "questions":
        return (
          <table key={i} className="mt-2 w-full border-collapse text-[0.78rem]">
            {b.title && <caption className="pb-1 text-left text-[0.82rem] font-semibold text-[#2b202b]">{b.title}</caption>}
            <thead>
              <tr>
                <th scope="col" className="text-left font-normal text-[#5c4a58]"><span className="sr-only">Vraag</span></th>
                {p.answers.map((a) => (
                  <th key={a} scope="col" className="w-14 pb-1 text-center text-[0.68rem] font-semibold text-[#5c4a58]">{a}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.items.map((q) => (
                <tr key={q} className="border-b border-[#e6d0d6]">
                  <td className="py-1.5 pr-2 leading-snug text-[#2b202b]">{q}</td>
                  {p.answers.map((a) => (
                    <td key={a} className="text-center"><Box /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );
      case "line":
        return (
          <div key={i} className="mt-2 text-[0.74rem] text-[#5c4a58]">
            {b.label}
            <Line />
          </div>
        );
      case "statements":
        return (
          <ul key={i} className="mt-2 space-y-1.5">
            {b.items.map((s) => (
              <li key={s} className="flex gap-2 text-[0.8rem] leading-snug text-[#2b202b]">
                <span className="mt-0.5"><Box /></span>
                {s}
              </li>
            ))}
          </ul>
        );
      case "signature":
        return (
          <div key={i} className={`mt-3 grid gap-x-6 ${b.parts.length >= 3 ? "grid-cols-[1.4fr_1fr_1.2fr]" : "grid-cols-[1.6fr_1fr]"}`}>
            {b.parts.map((s) => (
              <div key={s} className="text-[0.74rem] text-[#5c4a58]">
                {s}
                <span aria-hidden="true" className="mt-8 block border-b border-[#bfa9b1]" />
              </div>
            ))}
          </div>
        );
      case "pagebreak":
        return <div key={i} className="intake-break" aria-hidden="true" />;
    }
  };
  return (
    <article lang={locale === "nl" ? "nl" : "en"} className="intake-sheet mx-auto bg-white text-[#2b202b]">
      <div className="flex items-baseline justify-between text-[0.68rem] text-[#5c4a58]">
        <span className="font-serif text-base text-[#2b202b]">Glow <em>by Dilek</em></span>
        <span>{version}</span>
      </div>
      <div className="mt-3">{p.blocks.map(block)}</div>
    </article>
  );
}
