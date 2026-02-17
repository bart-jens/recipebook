import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#2D5F5D",
          borderRadius: 36,
        }}
      >
        {/* Fork silhouette — 4 tines, neck, handle */}
        <svg width="100" height="100" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <g fill="white">
            <rect x="7" y="5" width="1.5" height="7" rx="0.75" />
            <rect x="9.5" y="5" width="1.5" height="7" rx="0.75" />
            <rect x="12" y="5" width="1.5" height="7" rx="0.75" />
            <rect x="14.5" y="5" width="1.5" height="7" rx="0.75" />
            <path d="M7 10.5 h9 c0 2.5 -3 3.5 -5 3.5 h-4 Z" />
            <rect x="9" y="13" width="3" height="6.5" rx="1.5" />
          </g>
        </svg>
      </div>
    ),
    { ...size },
  );
}
