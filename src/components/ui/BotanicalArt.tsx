/** Fine-line botanical sprig on forest green, used only where a photo is missing. */
export function BotanicalArt() {
  const leaves = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8;
    const x = 200 + Math.sin(t * 2.6) * 38;
    const y = 470 - t * 380;
    const side = i % 2 === 0 ? 1 : -1;
    const rot = side * (48 - t * 18);
    return { x, y, rot, size: 42 - t * 14, side };
  });
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
      <defs>
        <radialGradient id="glow" cx="65%" cy="30%" r="70%">
          <stop offset="0" stopColor="#b99c6b" stopOpacity="0.28" />
          <stop offset="1" stopColor="#b99c6b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="500" fill="url(#glow)" />
      <g fill="none" stroke="#dcc9a5" strokeOpacity="0.55" strokeWidth="1.1" strokeLinecap="round">
        <path d="M200 490 C 232 400, 172 300, 214 200 S 226 90, 196 40" />
        {leaves.map((l, i) => (
          <g key={i} transform={`translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.rot.toFixed(1)})`}>
            <path d={`M0 0 C ${l.size * 0.35} ${-l.size * 0.45}, ${l.size * 0.9} ${-l.size * 0.4}, ${l.size * 1.25} 0 C ${l.size * 0.9} ${l.size * 0.4}, ${l.size * 0.35} ${l.size * 0.45}, 0 0 Z`} transform={l.side < 0 ? "scale(-1 1)" : undefined} />
            <path d={`M0 0 L ${l.size * 1.05} 0`} strokeOpacity="0.35" transform={l.side < 0 ? "scale(-1 1)" : undefined} />
          </g>
        ))}
      </g>
      <circle cx="272" cy="118" r="5" fill="#b99c6b" fillOpacity="0.8" />
    </svg>
  );
}
