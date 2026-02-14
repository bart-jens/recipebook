import React from 'react';
import { View, Text, FlatList, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AnimatedCard from './AnimatedCard';
import { colors, spacing, typography, radii, fontFamily } from '@/lib/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH * 0.4;
const CARD_GAP = spacing.md;

interface CarouselItem {
  id: string;
  title: string;
  image_url?: string | null;
}

interface Props {
  title: string;
  seeAllLabel?: string;
  onSeeAll?: () => void;
  items: CarouselItem[];
  onItemPress: (id: string) => void;
}

export default function HorizontalCarousel({ title, seeAllLabel, onSeeAll, items, onItemPress }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {seeAllLabel && onSeeAll && (
          <TouchableOpacity activeOpacity={0.7} onPress={onSeeAll}>
            <Text style={styles.seeAll}>{seeAllLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <AnimatedCard
            onPress={() => onItemPress(item.id)}
            style={styles.card}
          >
            <View style={styles.imageWrap}>
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.image}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <LinearGradient
                  colors={[colors.gradientWarmStart, colors.gradientWarmEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.placeholder}
                >
                  <FontAwesome name="cutlery" size={20} color="rgba(255,255,255,0.3)" />
                </LinearGradient>
              )}
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </AnimatedCard>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontFamily: fontFamily.serifSemiBold,
    fontSize: 18,
    color: colors.text,
  },
  seeAll: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    padding: 0,
    overflow: 'hidden',
    borderRadius: radii.lg,
  },
  imageWrap: {
    width: CARD_WIDTH,
    aspectRatio: 4 / 5,
    overflow: 'hidden',
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    ...typography.label,
    color: colors.text,
    padding: spacing.sm,
    paddingBottom: spacing.md,
  },
});
