interface LogoProps {
  height?: number;
  className?: string;
}

export function ForkDot({ size, color = "#2D5F5D" }: { size: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="12" fill={color} />
      <g fill="white">
        <rect x="7" y="5" width="1.5" height="7" rx="0.75" />
        <rect x="9.5" y="5" width="1.5" height="7" rx="0.75" />
        <rect x="12" y="5" width="1.5" height="7" rx="0.75" />
        <rect x="14.5" y="5" width="1.5" height="7" rx="0.75" />
        <path d="M7 10.5 h9 c0 2.5 -3 3.5 -5 3.5 h-4 Z" />
        <rect x="9" y="13" width="3" height="6.5" rx="1.5" />
      </g>
    </svg>
  );
}

export function Logo({ height = 24, className }: LogoProps) {
  const dotSize = Math.max(6, Math.round(height * 0.38));
  const gap = Math.max(2, Math.round(height * 0.12));

  return (
    <span
      className={`inline-flex items-center ${className ?? ""}`}
      role="img"
      aria-label="EefEats"
    >
      <span
        className="font-logo font-bold text-[#111111]"
        style={{ fontSize: height, lineHeight: 1 }}
      >
        EefEats
      </span>
      <span style={{ marginLeft: gap, display: "inline-flex", alignSelf: "flex-end", marginBottom: Math.round(height * 0.04) }}>
        <ForkDot size={dotSize} />
      </span>
    </span>
  );
}

export function LogoMark({ size = 24, color = "#2D5F5D" }: { size?: number; color?: string }) {
  return <ForkDot size={size} color={color} />;
}
