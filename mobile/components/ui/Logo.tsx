import { View, Text, StyleSheet } from 'react-native';
import Svg, { Defs, Mask, Rect, Circle, Line, Path } from 'react-native-svg';
import { colors, fontFamily } from '@/lib/theme';

interface LogoProps {
  height?: number;
}

let maskCounter = 0;

function ForkMark({ size = 20, color = colors.ink }: { size?: number; color?: string }) {
  const maskId = `fork-mask-${++maskCounter}`;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <Mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
          <Rect width="24" height="24" fill="white" />
          <Line x1="8.5" y1="5" x2="8.5" y2="10.5" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
          <Line x1="10.8" y1="5" x2="10.8" y2="10.5" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
          <Line x1="13.2" y1="5" x2="13.2" y2="10.5" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
          <Line x1="15.5" y1="5" x2="15.5" y2="10.5" stroke="black" strokeWidth="1.5" strokeLinecap="round" />
          <Path d="M8.5 10.5 Q8.5 13 12 13 Q15.5 13 15.5 10.5" stroke="black" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <Line x1="12" y1="13" x2="12" y2="19.5" stroke="black" strokeWidth="1.8" strokeLinecap="round" />
        </Mask>
      </Defs>
      <Circle cx="12" cy="12" r="11" fill={color} mask={`url(#${maskId})`} />
    </Svg>
  );
}

export function ForkDot({ size, color }: { size: number; color?: string }) {
  return <ForkMark size={size} color={color} />;
}

export function Logo({ height = 17 }: LogoProps) {
  return (
    <View style={styles.container} accessibilityLabel="EefEats" accessibilityRole="image">
      <ForkMark size={20} color={colors.ink} />
      <Text style={styles.text}>EefEats</Text>
    </View>
  );
}

export function LogoMark({ size = 24, color }: { size?: number; color?: string }) {
  return <ForkMark size={size} color={color} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontFamily: fontFamily.logo,
    fontSize: 17,
    lineHeight: 17,
    letterSpacing: -0.03 * 17,
    color: colors.ink,
    marginLeft: 7,
  },
});
