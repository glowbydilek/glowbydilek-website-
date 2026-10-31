/**
 * Quiet botanical line drawing on a warm nude/stone ground — shown only where
 * a photo is still missing. Decorative; scales with its frame without
 * meaningful content that could be "cropped".
 */
export function BotanicalArt() {
  const leaves = Array.from({ length: 7 }, (_, i) => {
    const t = i / 6;
    return {
      x: 200 + Math.sin(t * 2.4) * 30,
      y: 420 - t * 300,
      rot: (i % 2 === 0 ? 1 : -1) * (46 - t * 16),
      size: 38 - t * 12,
      flip: i % 2 === 1,
    };
  });
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      <defs>
        <linearGradient id="ba-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3e8e0" />
          <stop offset="1" stopColor="#e5dad0" />
        </linearGradient>
        <radialGradient id="ba-glow" cx="62%" cy="32%" r="60%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="500" fill="url(#ba-bg)" />
      <rect width="400" height="500" fill="url(#ba-glow)" />
      <g fill="none" stroke="#c5a477" strokeOpacity="0.55" strokeWidth="1" strokeLinecap="round">
        <path d="M200 470 C 228 390, 176 300, 212 210 S 222 120, 198 80" />
        {leaves.map((l, i) => (
          <g key={i} transform={`translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.rot.toFixed(1)})${l.flip ? " scale(-1 1)" : ""}`}>
            <path d={`M0 0 C ${l.size * 0.35} ${-l.size * 0.45}, ${l.size * 0.9} ${-l.size * 0.4}, ${l.size * 1.25} 0 C ${l.size * 0.9} ${l.size * 0.4}, ${l.size * 0.35} ${l.size * 0.45}, 0 0 Z`} />
          </g>
        ))}
      </g>
      <circle cx="262" cy="132" r="4.5" fill="#c5a477" fillOpacity="0.8" />
    </svg>
  );
}
