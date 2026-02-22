import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import Avatar from './Avatar';
import { colors, spacing, typography } from '@/lib/theme';

interface Props {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  recipeCount: number;
  lastCooked: string | null;
  followState: 'not_following' | 'following';
  onFollowPress: (id: string) => void;
  isPending?: boolean;
}

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function ChefCard({
  id,
  displayName,
  avatarUrl,
  recipeCount,
  lastCooked,
  followState,
  onFollowPress,
  isPending,
}: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => router.push(`/profile/${id}`)}
    >
      <Avatar name={displayName} size="md" imageUrl={avatarUrl} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {recipeCount} recipe{recipeCount !== 1 ? 's' : ''}
          {lastCooked ? ` \u00B7 Cooked ${formatTimeAgo(lastCooked)}` : ''}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.followButton, followState === 'following' && styles.followingButton]}
        activeOpacity={0.7}
        onPress={() => onFollowPress(id)}
        disabled={isPending}
      >
        <Text style={[styles.followText, followState === 'following' && styles.followingText]}>
          {isPending ? '...' : followState === 'following' ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...typography.subheading,
    color: colors.ink,
  },
  meta: {
    ...typography.meta,
    color: colors.inkSecondary,
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.accent,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  followText: {
    ...typography.metaSmall,
    color: colors.white,
  },
  followingText: {
    color: colors.inkSecondary,
  },
});
