import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const s = 100; // mark size
  const tine = 14;
  const stem = 14;
  const gap = (s - tine * 3) / 2;
  const longTine = 52;
  const shortTine = 40;
  const r = tine / 2;

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
        <div style={{ display: "flex", position: "relative", width: stem + longTine, height: s }}>
          {/* Stem */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: stem,
              height: s,
              backgroundColor: "white",
            }}
          />
          {/* Top tine */}
          <div
            style={{
              position: "absolute",
              left: stem,
              top: 0,
              width: longTine,
              height: tine,
              backgroundColor: "white",
              borderTopRightRadius: r,
              borderBottomRightRadius: r,
            }}
          />
          {/* Middle tine */}
          <div
            style={{
              position: "absolute",
              left: stem,
              top: tine + gap,
              width: shortTine,
              height: tine,
              backgroundColor: "white",
              borderTopRightRadius: r,
              borderBottomRightRadius: r,
            }}
          />
          {/* Bottom tine */}
          <div
            style={{
              position: "absolute",
              left: stem,
              top: 2 * (tine + gap),
              width: longTine,
              height: tine,
              backgroundColor: "white",
              borderTopRightRadius: r,
              borderBottomRightRadius: r,
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
