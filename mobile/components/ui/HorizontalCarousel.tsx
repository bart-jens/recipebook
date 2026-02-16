import React from 'react';
import { View, Text, FlatList, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { colors, spacing, typography, radii, fontFamily, animation } from '@/lib/theme';

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
          <TouchableOpacity activeOpacity={animation.pressOpacity} onPress={onSeeAll}>
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
          <TouchableOpacity
            activeOpacity={animation.pressOpacity}
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
                <View style={styles.placeholder} />
              )}
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sectionGap,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.pagePadding,
  },
  title: {
    fontFamily: fontFamily.sansMedium,
    ...typography.sectionTitle,
    color: colors.text,
  },
  seeAll: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: spacing.pagePadding,
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    overflow: 'hidden',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  imageWrap: {
    width: CARD_WIDTH,
    aspectRatio: 4 / 3,
    overflow: 'hidden',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholder: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  cardTitle: {
    ...typography.label,
    color: colors.text,
    padding: spacing.sm,
    paddingBottom: spacing.md,
  },
});
