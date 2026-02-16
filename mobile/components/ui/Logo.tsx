import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Path } from 'react-native-svg';
import { colors, fontFamily } from '@/lib/theme';

interface LogoProps {
  /** Controls the font-size of the text portion. Fork-E scales to match cap height. */
  height?: number;
}

function ForkE({ size, color }: { size: number; color: string }) {
  const width = Math.ceil(size * (22 / 32));
  return (
    <Svg width={width} height={size} viewBox="0 0 22 32" fill={color}>
      {/* Four prongs — rounded tips, the fork's signature */}
      <Rect x="0.5" y="0" width="3" height="11" rx="1.5" />
      <Rect x="6" y="0" width="3" height="11" rx="1.5" />
      <Rect x="11.5" y="0" width="3" height="11" rx="1.5" />
      <Rect x="17" y="0" width="3" height="11" rx="1.5" />
      {/* Neck — organic taper from tines to handle */}
      <Path d="M0.5 9 H20 C20 13, 12 14, 5.5 14.5 H0.5 Z" />
      {/* Handle */}
      <Path d="M0.5 13 h5 v16.5 a2.5 2.5 0 0 1 -5 0 Z" />
      {/* Middle nub (E middle bar) */}
      <Path d="M5.5 18 h8.5 a1.75 1.75 0 0 1 0 3.5 H5.5 Z" />
      {/* Bottom nub (E bottom bar) */}
      <Path d="M5.5 27.5 h10.5 a1.75 1.75 0 0 1 0 3.5 H5.5 Z" />
    </Svg>
  );
}

export function Logo({ height = 24 }: LogoProps) {
  const eHeight = Math.round(height * 0.72);
  const gap = Math.max(1, Math.round(height * 0.05));

  return (
    <View style={styles.container} accessibilityLabel="EefEats" accessibilityRole="image">
      <ForkE size={eHeight} color={colors.primary} />
      <Text
        style={[
          styles.text,
          { fontSize: height, lineHeight: height, marginLeft: gap },
        ]}
      >
        efEats
      </Text>
    </View>
  );
}

export function LogoMark({ size = 24, color = colors.primary }: { size?: number; color?: string }) {
  return <ForkE size={size} color={color} />;
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
