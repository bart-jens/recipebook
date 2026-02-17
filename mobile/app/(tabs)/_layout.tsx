import { useEffect, useState, useCallback } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/lib/supabase';
import { ActivityIndicator, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, typography, animation } from '@/lib/theme';
import { Logo } from '@/components/ui/Logo';

function AnimatedTabBarIcon({
  name,
  color,
  focused,
}: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  focused: boolean;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (focused) {
      scale.value = withSpring(1.15, animation.springConfig);
    } else {
      scale.value = withSpring(1, animation.springConfig);
    }
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ alignItems: 'center', marginBottom: -2 }, animatedStyle]}>
      <FontAwesome name={name} size={22} color={color} />
      <View
        style={{
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: focused ? colors.primary : 'transparent',
          marginTop: 3,
        }}
      />
    </Animated.View>
  );
}

function useNewFollowerCount(userId: string | undefined) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    async function fetch() {
      const { data } = await supabase.rpc('get_new_follower_count', { p_user_id: userId });
      setCount(data ?? 0);
    }

    fetch();
    const interval = setInterval(fetch, 60_000);
    return () => clearInterval(interval);
  }, [userId]);

  return count;
}

export default function TabLayout() {
  const { session, loading } = useAuth();
  const newFollowerCount = useNewFollowerCount(session?.user?.id);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
          elevation: 0,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <AnimatedTabBarIcon name="home" color={color} focused={focused} />,
          headerTitle: () => <Logo height={22} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, focused }) => <AnimatedTabBarIcon name="compass" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'My Recipes',
          tabBarIcon: ({ color, focused }) => <AnimatedTabBarIcon name="book" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <AnimatedTabBarIcon name="user" color={color} focused={focused} />,
          tabBarBadge: newFollowerCount > 0 ? (newFollowerCount > 9 ? '9+' : newFollowerCount) : undefined,
          tabBarBadgeStyle: newFollowerCount > 0 ? { backgroundColor: colors.primary, fontSize: 10 } : undefined,
        }}
      />
    </Tabs>
  );
}
