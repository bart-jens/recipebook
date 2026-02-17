import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Rect, Path, G } from 'react-native-svg';
import { colors, fontFamily } from '@/lib/theme';

interface LogoProps {
  height?: number;
}

export function ForkDot({ size, color = colors.primary }: { size: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="12" fill={color} />
      <G fill="white">
        <Rect x="7" y="5" width="1.5" height="7" rx="0.75" />
        <Rect x="9.5" y="5" width="1.5" height="7" rx="0.75" />
        <Rect x="12" y="5" width="1.5" height="7" rx="0.75" />
        <Rect x="14.5" y="5" width="1.5" height="7" rx="0.75" />
        <Path d="M7 10.5 h9 c0 2.5 -3 3.5 -5 3.5 h-4 Z" />
        <Rect x="9" y="13" width="3" height="6.5" rx="1.5" />
      </G>
    </Svg>
  );
}

export function Logo({ height = 24 }: LogoProps) {
  const dotSize = Math.max(6, Math.round(height * 0.55));
  const gap = Math.max(2, Math.round(height * 0.12));

  return (
    <View style={styles.container} accessibilityLabel="EefEats" accessibilityRole="image">
      <Text
        style={[
          styles.text,
          { fontSize: height, lineHeight: height },
        ]}
      >
        EefEats
      </Text>
      <View style={{ marginLeft: gap, alignSelf: 'flex-end', marginBottom: Math.round(height * 0.04) }}>
        <ForkDot size={dotSize} />
      </View>
    </View>
  );
}

export function LogoMark({ size = 24, color = colors.primary }: { size?: number; color?: string }) {
  return <ForkDot size={size} color={color} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontFamily: fontFamily.logo,
    color: colors.text,
    letterSpacing: 0,
  },
});
