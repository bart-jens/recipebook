import Svg, { Rect, Polygon, Line } from 'react-native-svg';
import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

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
  style,
}: {
  id: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const h = hashUUID(id);
  const [bg, mid, bold] = PALETTES[h % 8];
  const tlbr = ((h >> 4) & 1) === 0;
  const S = size ?? 200;
  const sw = S * 0.018;

  const containerStyle: StyleProp<ViewStyle> = size
    ? [{ width: size, height: size }, style]
    : [{ flex: 1 }, style];

  return (
    <View style={containerStyle}>
      <Svg
        width={size ?? '100%'}
        height={size ?? '100%'}
        viewBox={`0 0 ${S} ${S}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <Rect width={S} height={S} fill={bg} />
        {tlbr ? (
          <>
            <Polygon points={`0,0 ${S},0 0,${S}`} fill={mid} />
            <Line x1={0} y1={S} x2={S} y2={0} stroke={bold} strokeWidth={sw} />
          </>
        ) : (
          <>
            <Polygon points={`${S},0 ${S},${S} 0,${S}`} fill={mid} />
            <Line x1={0} y1={0} x2={S} y2={S} stroke={bold} strokeWidth={sw} />
          </>
        )}
      </Svg>
    </View>
  );
}
