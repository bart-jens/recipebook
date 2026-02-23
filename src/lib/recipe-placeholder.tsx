const PALETTES: [string, string, string][] = [
  ["#EDE5D8", "#C17B50", "#8B4513"],  // terracotta
  ["#E6E2D4", "#7A8C6E", "#3D5A2A"],  // olive
  ["#EDE0D4", "#C4957A", "#8B3A20"],  // dusty rose
  ["#EBE5CC", "#C4A050", "#8B6914"],  // ochre
  ["#E4DEDA", "#8B6B5A", "#4A2C1A"],  // walnut
  ["#E2E6DC", "#7A9670", "#3D5A3D"],  // sage
  ["#EBE2E2", "#B07070", "#6B2020"],  // blush burgundy
  ["#E8E4DC", "#9C8C70", "#5A4830"],  // warm stone
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
  const [bg, mid, bold] = PALETTES[h % 8];
  const tlbr = ((h >> 4) & 1) === 0;
  const sw = (size * 0.018).toFixed(2);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
      className={className}
    >
      <rect width={size} height={size} fill={bg} />
      {tlbr ? (
        <>
          <polygon points={`0,0 ${size},0 0,${size}`} fill={mid} />
          <line x1="0" y1={size} x2={size} y2="0" stroke={bold} strokeWidth={sw} />
        </>
      ) : (
        <>
          <polygon points={`${size},0 ${size},${size} 0,${size}`} fill={mid} />
          <line x1="0" y1="0" x2={size} y2={size} stroke={bold} strokeWidth={sw} />
        </>
      )}
    </svg>
  );
}
