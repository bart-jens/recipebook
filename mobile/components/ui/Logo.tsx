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
      <Rect x="0" y="0" width="4.5" height="32" />
      <Path d="M4.5 0h14.5a2.25 2.25 0 0 1 0 4.5H4.5z" />
      <Path d="M4.5 13.75h11.5a2.25 2.25 0 0 1 0 4.5H4.5z" />
      <Path d="M4.5 27.5h14.5a2.25 2.25 0 0 1 0 4.5H4.5z" />
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
    fontFamily: fontFamily.sansBold,
    color: colors.text,
    letterSpacing: -0.5,
  },
});
