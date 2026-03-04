import { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, router } from 'expo-router';
import { LogoMark } from '@/components/ui/Logo';
import { colors, spacing, typography, fontFamily } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOUR_SEEN_KEY = 'eefeats:tour_seen';

export async function markTourSeen() {
  await AsyncStorage.setItem(TOUR_SEEN_KEY, 'true');
}

export async function isTourSeen(): Promise<boolean> {
  const val = await AsyncStorage.getItem(TOUR_SEEN_KEY);
  return val === 'true';
}

// ─── Slide visuals ────────────────────────────────────────────────────────────

function SlideVisualWelcome() {
  return (
    <View style={visuals.welcomeOuter}>
      <View style={visuals.welcomeCircle}>
        <LogoMark size={72} color={colors.accent} />
      </View>
    </View>
  );
}

function SlideVisualImport() {
  return (
    <View style={visuals.importOuter}>
      {/* Stacked recipe card abstractions */}
      <View style={[visuals.card, visuals.cardBack2]} />
      <View style={[visuals.card, visuals.cardBack1]} />
      <View style={visuals.cardFront}>
        <View style={visuals.cardImageBar} />
        <View style={visuals.cardLine} />
        <View style={[visuals.cardLine, visuals.cardLineShort]} />
        <View style={visuals.cardDots}>
          <View style={visuals.cardDot} />
          <View style={visuals.cardDot} />
          <View style={visuals.cardDot} />
        </View>
      </View>
    </View>
  );
}

function SlideVisualSocial() {
  return (
    <View style={visuals.socialOuter}>
      {/* Two overlapping avatar circles */}
      <View style={[visuals.avatar, visuals.avatarRight]}>
        <Text style={visuals.avatarInitial}>S</Text>
      </View>
      <View style={[visuals.avatar, visuals.avatarLeft]}>
        <Text style={visuals.avatarInitial}>B</Text>
      </View>
      {/* Activity dot */}
      <View style={visuals.activityBadge}>
        <View style={visuals.activityDot} />
      </View>
    </View>
  );
}

// ─── Slide data ───────────────────────────────────────────────────────────────

const SLIDES = [
  {
    key: 'welcome',
    Visual: SlideVisualWelcome,
    title: 'Everything in one place',
    subtitle: 'Your recipes, organized the way you want — always ready when you need them.',
  },
  {
    key: 'import',
    Visual: SlideVisualImport,
    title: 'Import from anywhere',
    subtitle: 'Paste a link, snap a cookbook page, or write your own — AI pulls out the full recipe instantly.',
  },
  {
    key: 'social',
    Visual: SlideVisualSocial,
    title: 'Cook with friends',
    subtitle: 'Follow people, see what they\'re making, and share what\'s in your kitchen.',
  },
];

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function TourScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const finish = useCallback(async () => {
    await markTourSeen();
    router.replace('/(tabs)');
  }, []);

  const handleNext = useCallback(() => {
    if (activeIndex < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      finish();
    }
  }, [activeIndex, finish]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Skip */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={finish}
          activeOpacity={0.6}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Slides */}
        <FlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={(item) => item.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <View style={styles.visualContainer}>
                <item.Visual />
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          )}
        />

        {/* Bottom: dots + CTA */}
        <View style={styles.bottom}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === activeIndex && styles.dotActive]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.cta}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>
              {isLast ? 'Get started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: spacing.xl,
    zIndex: 10,
  },
  skipText: {
    ...typography.label,
    color: colors.inkMuted,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingTop: 80,
    paddingBottom: 160,
  },
  visualContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxxl + spacing.lg,
  },
  title: {
    ...typography.title,
    fontSize: 30,
    lineHeight: 34,
    textAlign: 'center',
    color: colors.ink,
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    color: colors.inkSecondary,
    maxWidth: 300,
  },
  bottom: {
    position: 'absolute',
    bottom: 52,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    gap: spacing.xxl,
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 20,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  cta: {
    width: '100%',
    backgroundColor: colors.ink,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: fontFamily.sans,
    fontSize: 15,
    lineHeight: 20,
    color: colors.white,
    letterSpacing: 0.02 * 15,
  },
});

// ─── Visual styles ────────────────────────────────────────────────────────────

const visuals = StyleSheet.create({
  // Welcome: large logo on accent circle
  welcomeOuter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.accentWash,
    borderWidth: 1,
    borderColor: colors.accentWashBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Import: stacked recipe card abstractions
  importOuter: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: 160,
    height: 120,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardBack2: {
    transform: [{ rotate: '6deg' }, { translateY: 8 }],
    backgroundColor: colors.surfaceAlt,
  },
  cardBack1: {
    transform: [{ rotate: '3deg' }, { translateY: 4 }],
    backgroundColor: colors.surface,
  },
  cardFront: {
    width: 160,
    height: 120,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardImageBar: {
    height: 36,
    backgroundColor: colors.surfaceAlt,
    marginBottom: spacing.xs,
  },
  cardLine: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    width: '90%',
  },
  cardLineShort: {
    width: '60%',
  },
  cardDots: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  cardDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentWashIcon,
  },

  // Social: overlapping avatar circles
  socialOuter: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 3,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLeft: {
    left: 10,
    backgroundColor: colors.accentWash,
    borderColor: colors.accentWashBorder,
    zIndex: 2,
  },
  avatarRight: {
    right: 10,
    backgroundColor: colors.surfaceAlt,
    zIndex: 1,
  },
  avatarInitial: {
    fontFamily: fontFamily.sans,
    fontSize: 28,
    color: colors.inkSecondary,
    lineHeight: 32,
  },
  activityBadge: {
    position: 'absolute',
    bottom: 22,
    right: 22,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  activityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.olive,
  },
});
