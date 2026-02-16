interface LogoProps {
  /** Controls the font-size of the text portion. Fork-E scales to match cap height. */
  height?: number;
  className?: string;
}

function ForkE({ size, color }: { size: number; color: string }) {
  const width = Math.ceil(size * (22 / 32));
  return (
    <svg
      width={width}
      height={size}
      viewBox="0 0 22 32"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="0" y="0" width="4.5" height="32" />
      <path d="M4.5 0h14.5a2.25 2.25 0 0 1 0 4.5H4.5z" />
      <path d="M4.5 13.75h11.5a2.25 2.25 0 0 1 0 4.5H4.5z" />
      <path d="M4.5 27.5h14.5a2.25 2.25 0 0 1 0 4.5H4.5z" />
    </svg>
  );
}

export function Logo({ height = 24, className }: LogoProps) {
  const eHeight = Math.round(height * 0.72);
  const gap = Math.max(1, Math.round(height * 0.05));

  return (
    <span
      className={`inline-flex items-baseline ${className ?? ""}`}
      role="img"
      aria-label="EefEats"
    >
      <ForkE size={eHeight} color="#2D5F5D" />
      <span
        className="font-bold tracking-tight text-[#111111]"
        style={{ fontSize: height, lineHeight: 1, marginLeft: gap }}
      >
        efEats
      </span>
    </span>
  );
}

export function LogoMark({ size = 24, color = "#2D5F5D" }: { size?: number; color?: string }) {
  return <ForkE size={size} color={color} />;
}
