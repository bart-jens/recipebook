const PALETTES: [string, string, string][] = [
  ["#EDE5D8", "#C17B50", "#8B4513"],  // terracotta
  ["#E6E2D4", "#8B8B5A", "#5A6B3A"],  // olive
  ["#EDE0D4", "#C4957A", "#A06040"],  // dusty rose
  ["#EBE5CC", "#C4A050", "#A08030"],  // ochre
  ["#E4DEDA", "#8B6B5A", "#6B4A3A"],  // walnut
  ["#E2E6DC", "#7A8C6E", "#5A7050"],  // sage
  ["#EBE2E2", "#B07070", "#8B5252"],  // blush burgundy
  ["#E8E4DC", "#A09070", "#7A6850"],  // warm stone
];

function hashUUID(id: string): number {
  let h = 5381;
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) + h) ^ id.charCodeAt(i);
    h = h >>> 0;
  }
  return h;
}

export function RecipePlaceholder({
  id,
  size,
  className,
}: {
  id: string;
  size: number;
  className?: string;
}) {
  const h = hashUUID(id);
  const [bg, c1, c2] = PALETTES[h % 8];
  const uid = id.replace(/[^a-z0-9]/gi, "").slice(0, 8);

  const x1 = (size * (0.10 + 0.25 * ((h) % 100) / 100)).toFixed(1);
  const y1 = (size * (0.00 + 0.40 * ((h >> 4) % 100) / 100)).toFixed(1);
  const x2 = (size * (0.45 + 0.45 * ((h >> 8) % 100) / 100)).toFixed(1);
  const y2 = (size * (0.30 + 0.55 * ((h >> 12) % 100) / 100)).toFixed(1);
  const r1f = size * (0.55 + 0.35 * ((h >> 16) % 100) / 100);
  const r2f = size * (0.50 + 0.35 * ((h >> 20) % 100) / 100);
  const r1 = r1f.toFixed(1);
  const r2 = r2f.toFixed(1);
  const ry1 = (r1f * (0.80 + 0.20 * ((h >> 2) % 100) / 100)).toFixed(1);
  const ry2 = (r2f * (0.80 + 0.20 * ((h >> 6) % 100) / 100)).toFixed(1);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
      className={className}
    >
      <defs>
        <radialGradient id={`rg1-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={c1} stopOpacity={0.72} />
          <stop offset="100%" stopColor={c1} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`rg2-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={c2} stopOpacity={0.55} />
          <stop offset="100%" stopColor={c2} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={size} height={size} fill={bg} />
      <ellipse cx={x1} cy={y1} rx={r1} ry={ry1} fill={`url(#rg1-${uid})`} />
      <ellipse cx={x2} cy={y2} rx={r2} ry={ry2} fill={`url(#rg2-${uid})`} />
    </svg>
  );
}
