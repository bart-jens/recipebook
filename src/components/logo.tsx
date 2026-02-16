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
      {/* Four prongs — rounded tips, the fork's signature */}
      <rect x="0.5" y="0" width="3" height="11" rx="1.5" />
      <rect x="6" y="0" width="3" height="11" rx="1.5" />
      <rect x="11.5" y="0" width="3" height="11" rx="1.5" />
      <rect x="17" y="0" width="3" height="11" rx="1.5" />
      {/* Neck — organic taper from tines to handle */}
      <path d="M0.5 9 H20 C20 13, 12 14, 5.5 14.5 H0.5 Z" />
      {/* Handle */}
      <path d="M0.5 13 h5 v16.5 a2.5 2.5 0 0 1 -5 0 Z" />
      {/* Middle nub (E middle bar) */}
      <path d="M5.5 18 h8.5 a1.75 1.75 0 0 1 0 3.5 H5.5 Z" />
      {/* Bottom nub (E bottom bar) */}
      <path d="M5.5 27.5 h10.5 a1.75 1.75 0 0 1 0 3.5 H5.5 Z" />
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
        className="font-logo font-bold text-[#111111]"
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
