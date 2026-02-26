import { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Redirect, Tabs, router } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/lib/supabase';
import { ActivityIndicator, View, Pressable, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, fontFamily, typography, animation } from '@/lib/theme';
import { LogoMark } from '@/components/ui/Logo';

function AnimatedTabBarIcon({
  name,
  color,
  focused,
}: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  focused: boolean;
}) {
  return (
    <View style={{ alignItems: 'center' }}>
      <FontAwesome name={name} size={19} color={color} />
    </View>
  );
}

function AnimatedTabButton({
  children,
  onPress,
  onLongPress,
  accessibilityState,
  accessibilityRole,
  accessibilityLabel,
  testID,
}: any) {
  const scale = useSharedValue(1);
  const focused = accessibilityState?.selected;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(animation.tabPressScale, animation.springBounce);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, animation.springBounce);
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View
        style={[
          { alignItems: 'center', justifyContent: 'center', paddingVertical: 5 },
          animatedStyle,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
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

function useOnboardingCheck(userId: string | undefined) {
  const [checked, setChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('user_profiles')
      .select('onboarded_at')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        setNeedsOnboarding(!data?.onboarded_at);
        setChecked(true);
      });
  }, [userId]);

  return { checked, needsOnboarding };
}

export default function TabLayout() {
  const { session, loading } = useAuth();
  const newFollowerCount = useNewFollowerCount(session?.user?.id);
  const { checked, needsOnboarding } = useOnboardingCheck(session?.user?.id);

  if (loading || (session && !checked)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (needsOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: 'rgba(246,244,239,0.94)',
          elevation: 0,
        },
        tabBarLabelStyle: {
          ...typography.metaSmall,
          fontSize: 9,
        },
        tabBarButton: (props) => <AnimatedTabButton {...props} />,
        headerStyle: {
          backgroundColor: colors.bg,
        },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
        headerTitle: () => <LogoMark size={22} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <AnimatedTabBarIcon name="home" color={color} focused={focused} />,
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
        name="shopping-list"
        options={{
          title: 'Groceries',
          href: null,
          tabBarIcon: ({ color, focused }) => <AnimatedTabBarIcon name="shopping-cart" color={color} focused={focused} />,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ paddingLeft: 16 }}>
              <FontAwesome name="chevron-left" size={16} color={colors.inkMuted} />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <AnimatedTabBarIcon name="user" color={color} focused={focused} />,
          tabBarBadge: newFollowerCount > 0 ? (newFollowerCount > 9 ? '9+' : newFollowerCount) : undefined,
          tabBarBadgeStyle: newFollowerCount > 0 ? { backgroundColor: colors.accent, fontSize: 10 } : undefined,
        }}
      />
    </Tabs>
  );
}
