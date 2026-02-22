"use client";

import { useId } from "react";

interface LogoProps {
  height?: number;
  className?: string;
}

function ForkMark({
  size = 20,
  color,
  className = "",
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  const id = useId();
  const maskId = `fork-mask-${id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      style={color ? { color } : undefined}
    >
      <defs>
        <mask id={maskId}>
          <rect width="24" height="24" fill="white" />
          <line x1="8.5" y1="5" x2="8.5" y2="10.5" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="10.8" y1="5" x2="10.8" y2="10.5" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="13.2" y1="5" x2="13.2" y2="10.5" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="15.5" y1="5" x2="15.5" y2="10.5" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8.5 10.5 Q8.5 13 12 13 Q15.5 13 15.5 10.5" stroke="black" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <line x1="12" y1="13" x2="12" y2="19.5" stroke="black" strokeWidth="1.8" strokeLinecap="round" />
        </mask>
      </defs>
      <circle cx="12" cy="12" r="11" fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  );
}

export function ForkDot({ size, color }: { size: number; color?: string }) {
  return <ForkMark size={size} color={color} />;
}

export function Logo({ className }: LogoProps) {
  return (
    <span
      className={`inline-flex items-center ${className ?? ""}`}
      role="img"
      aria-label="EefEats"
    >
      <ForkMark size={20} className="text-ink" />
      <span
        className="font-normal text-ink"
        style={{ fontSize: 17, lineHeight: 1, letterSpacing: "-0.03em", marginLeft: 7 }}
      >
        EefEats
      </span>
    </span>
  );
}

export function LogoMark({ size = 24, color }: { size?: number; color?: string }) {
  return <ForkMark size={size} color={color} />;
}
